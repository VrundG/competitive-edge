export const findStudent=(db,username)=>db.prepare('SELECT id, username, password_hash, role, region, profile_image, recovery_hash, recovery_created_at FROM student_accounts WHERE username = ?').bind(username).first();
const changed=result=>Number(result?.meta?.changes??result?.changes??0);
export async function insertStudent(db,id,username,passwordHash,region,now,sourceIdentity=null,recoveryHash=null){
 const statements=[db.prepare('INSERT INTO student_accounts (id, username, password_hash, region, region_updated_at, recovery_hash, recovery_created_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(username) DO NOTHING').bind(id,username,passwordHash,region,now,recoveryHash,recoveryHash?now:null,now)];
 if(sourceIdentity){
  const accountExists='EXISTS (SELECT 1 FROM student_accounts WHERE id = ?)';
  statements.push(
   db.prepare(`UPDATE learner_progress SET user_id = ? WHERE user_id = ? AND ${accountExists}`).bind('student:'+id,sourceIdentity,id),
   db.prepare(`UPDATE diagnostic_completions SET user_id = ? WHERE user_id = ? AND ${accountExists}`).bind('student:'+id,sourceIdentity,id),
   db.prepare(`UPDATE question_reports SET user_id = ? WHERE user_id = ? AND ${accountExists}`).bind('student:'+id,sourceIdentity,id)
  );
 }
 const results=await db.batch(statements);
 if(!changed(results[0]))return null;
 return {student:await findStudent(db,username),progressMigrated:results.slice(1).some(changed)};
}
export const updateStudentRegion=(db,id,region,now)=>db.prepare('UPDATE student_accounts SET region = ?, region_updated_at = ? WHERE id = ? RETURNING id, username, role, region, profile_image').bind(region,now,id).first();
export const updateStudentProfileImage=(db,id,profileImage)=>db.prepare('UPDATE student_accounts SET profile_image = ? WHERE id = ? RETURNING id, username, role, region, profile_image').bind(profileImage,id).first();
export const insertSession=(db,hash,studentId,expires,createdAt=Date.now())=>db.prepare('INSERT INTO student_sessions (token_hash, student_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(hash,studentId,expires,createdAt).run();
export const findSession=(db,hash,now)=>db.prepare('SELECT a.id, a.username, a.password_hash, a.role, a.region, a.profile_image, a.recovery_hash, s.token_hash FROM student_sessions s JOIN student_accounts a ON a.id = s.student_id WHERE s.token_hash = ? AND s.expires_at > ?').bind(hash,now).first();
export const deleteSession=(db,hash)=>db.prepare('DELETE FROM student_sessions WHERE token_hash = ?').bind(hash).run();
export const countSessions=(db,studentId,now)=>db.prepare('SELECT COUNT(*) AS count FROM student_sessions WHERE student_id = ? AND expires_at > ?').bind(studentId,now).first();
export const deleteOtherSessions=(db,studentId,currentHash)=>db.prepare('DELETE FROM student_sessions WHERE student_id = ? AND token_hash <> ?').bind(studentId,currentHash).run();
export const setRecoveryHash=(db,studentId,recoveryHash,now)=>db.prepare('UPDATE student_accounts SET recovery_hash = ?, recovery_created_at = ? WHERE id = ?').bind(recoveryHash,now,studentId).run();
export async function resetWithRecovery(db,studentId,passwordHash){await db.batch([db.prepare('UPDATE student_accounts SET password_hash = ?, recovery_hash = NULL, recovery_created_at = NULL WHERE id = ?').bind(passwordHash,studentId),db.prepare('DELETE FROM student_sessions WHERE student_id = ?').bind(studentId)]);}
export const consumeAuthAttempt=(db,key,now,until)=>db.prepare('INSERT INTO auth_attempts (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN auth_attempts.expires_at <= ? THEN 1 ELSE auth_attempts.count + 1 END, expires_at = CASE WHEN auth_attempts.expires_at <= ? THEN excluded.expires_at ELSE auth_attempts.expires_at END RETURNING count, expires_at').bind(key,until,now,now).first();
export async function expireAuthRecords(db,now){await db.batch([db.prepare('DELETE FROM student_sessions WHERE expires_at <= ?').bind(now),db.prepare('DELETE FROM auth_attempts WHERE expires_at <= ?').bind(now)]);}
