import {readDiagnosticCompletions,readProgress} from './database.mjs';
import {resolveStudentSession,verifyPassword} from './auth.mjs';
import {isAllowedWriteOrigin} from './security.mjs';

const response=(body,status=200,headers={})=>new Response(JSON.stringify(body,null,status===200?2:0),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie',...headers}});
const clearCookie='__Host-student_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
async function readJson(request){const raw=await request.text();if(raw.length>4096)return {error:response({error:'Request too large'},413)};try{return {input:JSON.parse(raw)}}catch{return {error:response({error:'Invalid JSON'},400)}}}
export function createAccountApi(){return async function handle(request,env){
 if(!env.DB)return response({error:'Account service is unavailable.'},503);const path=new URL(request.url).pathname,session=await resolveStudentSession(request,env);if(!session)return response({error:'Sign in to manage your account.'},401);const student=session.student,userId='student:'+student.id;
 try{
  if(path==='/api/account/export'&&request.method==='GET'){
   const saved=await readProgress(env.DB,userId),progress=saved?JSON.parse(saved.payload):{sheet:[],attempt:null,history:[]},reports=await env.DB.prepare('SELECT question_id, question_version, category, note, status, created_at, reviewed_at, resolution_note FROM question_reports WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();return response({exportedAt:new Date().toISOString(),account:{username:student.username,role:student.role,region:student.region||null,profileImage:student.profile_image||null,recoveryReady:Boolean(student.recovery_hash)},progress,diagnostics:await readDiagnosticCompletions(env.DB,userId),questionReports:reports.results||[]});
  }
  if(path==='/api/account/delete'&&request.method==='POST'){
   if(!isAllowedWriteOrigin(request))return response({error:'Cross-origin requests are not allowed.'},403);if(student.role==='management')return response({error:'The seeded management account cannot be deleted here.'},403);if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return response({error:'JSON required'},415);const parsed=await readJson(request);if(parsed.error)return parsed.error;const input=parsed.input;if(input?.username!==student.username||typeof input?.password!=='string'||!await verifyPassword(input.password,student.password_hash))return response({error:'Enter the exact username and current passphrase.'},401);
   await env.DB.batch([env.DB.prepare('DELETE FROM learner_progress WHERE user_id = ?').bind(userId),env.DB.prepare('DELETE FROM diagnostic_completions WHERE user_id = ?').bind(userId),env.DB.prepare('DELETE FROM question_reports WHERE user_id = ?').bind(userId),env.DB.prepare('DELETE FROM question_sessions WHERE user_id = ?').bind(userId),env.DB.prepare('DELETE FROM student_sessions WHERE student_id = ?').bind(student.id),env.DB.prepare('DELETE FROM student_accounts WHERE id = ?').bind(student.id)]);return response({deleted:true},200,{'Set-Cookie':clearCookie});
  }
  return response({error:'Not found'},404);
 }catch(error){console.error('Account lifecycle failed',error.name);return response({error:'The account request could not be completed.'},503);}
};}
