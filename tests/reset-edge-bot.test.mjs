import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {database} from '../scripts/sqlite-adapter.mjs';

test('the repeatable demo reset clears student state while preserving the seeded login',()=>{
 const DB=database(),files=fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort();
 for(const file of files.filter(name=>name<'0013_'))DB.sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 const identity='student:demo-edge-bot';
 DB.sqlite.prepare("UPDATE student_accounts SET profile_image='data:image/png;base64,AAAA', recovery_hash='recovery', recovery_created_at=1 WHERE id='demo-edge-bot'").run();
 DB.sqlite.prepare('INSERT INTO learner_progress (user_id, revision, payload, last_write_id, updated_at) VALUES (?, 1, ?, ?, ?)').run(identity,'{"sheet":[["saving",false]],"attempt":null,"history":[]}','write','2026-10-28');
 DB.sqlite.prepare('INSERT INTO diagnostic_completions (user_id, track, completed_at, attempt_id) VALUES (?, ?, ?, ?)').run(identity,'finance','2026-10-28','attempt');
 DB.sqlite.prepare('INSERT INTO question_reports (id, user_id, attempt_id, question_id, question_version, category, created_at) VALUES (?, ?, ?, ?, 1, ?, 1)').run('report',identity,'attempt','pilot-01','answer');
 DB.sqlite.prepare('INSERT INTO question_sessions (id, user_id, mode, track, question_ids, created_at, expires_at) VALUES (?, ?, ?, ?, ?, 1, 2)').run('question-session',identity,'practice','finance','["pilot-01"]');
 DB.sqlite.prepare('INSERT INTO student_sessions (token_hash, student_id, expires_at, created_at) VALUES (?, ?, 2, 1)').run('session','demo-edge-bot');
 DB.sqlite.exec(fs.readFileSync('drizzle/0013_reset_edge_bot_demo.sql','utf8'));
 for(const [table,column,value] of [['learner_progress','user_id',identity],['diagnostic_completions','user_id',identity],['question_reports','user_id',identity],['question_sessions','user_id',identity],['student_sessions','student_id','demo-edge-bot']])assert.equal(DB.sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column}=?`).get(value).count,0);
 const account=DB.sqlite.prepare("SELECT username, role, region, profile_image, recovery_hash, recovery_created_at FROM student_accounts WHERE id='demo-edge-bot'").get();
 assert.deepEqual({...account},{username:'edge_bot_student',role:'demo',region:'North Central',profile_image:null,recovery_hash:null,recovery_created_at:null});
});
