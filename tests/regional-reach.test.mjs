import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {database} from '../scripts/sqlite-adapter.mjs';
import {createRegionalReachApi,readRegionalReach} from '../server/regional-reach.mjs';

function setup(){const DB=database();for(const file of fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')))DB.sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));return DB;}
function account(DB,id,username,region){DB.sqlite.prepare('INSERT INTO student_accounts (id, username, password_hash, region, region_updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id,username,'hash',region,1,1);}
function progress(DB,id,sheet=[]){DB.sqlite.prepare('INSERT INTO learner_progress (user_id, revision, payload, last_write_id, updated_at) VALUES (?, ?, ?, ?, ?)').run('student:'+id,1,JSON.stringify({sheet,attempt:null,history:[]}),crypto.randomUUID(),new Date().toISOString());}
function diagnostic(DB,id,track){DB.sqlite.prepare('INSERT INTO diagnostic_completions (user_id, track, completed_at, attempt_id) VALUES (?, ?, ?, ?)').run('student:'+id,track,new Date().toISOString(),crypto.randomUUID());}
function request(method='GET',user='owner-1'){return new Request('https://example.test/api/regional-reach',{method,headers:user?{'oai-authenticated-user-id':user}:{}});}

test('regional reach returns all eight regions with aggregate activity only',async()=>{
 const DB=setup();account(DB,'a','north_student','North Central');account(DB,'b','western_student','Western');account(DB,'c','outside_student','Outside North Carolina');account(DB,'d','legacy_student',null);
 DB.sqlite.prepare("UPDATE student_accounts SET role = 'management' WHERE username = 'ntce'").run();
 DB.sqlite.prepare("UPDATE student_accounts SET role = 'demo' WHERE username = 'edge_bot_student'").run();
 progress(DB,'a',[['saving',false]]);progress(DB,'b');diagnostic(DB,'a','economics');diagnostic(DB,'a','finance');diagnostic(DB,'b','economics');
 const report=await readRegionalReach(DB);assert.equal(report.regions.length,8);assert.deepEqual(report.regions.map(row=>row.region),['Northeast','North Central','Piedmont-Triad','Southwest','Northwest','Western','Sandhills','Southeast']);
 assert.deepEqual(report.regions.find(row=>row.region==='North Central'),{region:'North Central',registrations:1,activeLearners:1,studyPlanners:1,diagnosticLearners:1,economicsDiagnostics:1,financeDiagnostics:1});
 assert.deepEqual(report.regions.find(row=>row.region==='Western'),{region:'Western',registrations:1,activeLearners:1,studyPlanners:0,diagnosticLearners:1,economicsDiagnostics:1,financeDiagnostics:0});
 assert.equal(report.regions.find(row=>row.region==='Southeast').registrations,0);assert.equal(report.other.registrations,2);assert.deepEqual(report.totals,{region:'All students',registrations:4,activeLearners:2,studyPlanners:1,diagnosticLearners:2,economicsDiagnostics:2,financeDiagnostics:1});
 const api=createRegionalReachApi(),response=await api(request(),{DB,ANALYTICS_ADMIN_USER_IDS:'owner-1, owner-2'});assert.equal(response.status,200);const text=await response.text();assert.ok(!text.includes('north_student'));assert.ok(!text.includes('student:a'));assert.equal(JSON.parse(text).regions.length,8);
});

test('regional reach requires the configured platform administrator identity',async()=>{
 const DB=setup(),api=createRegionalReachApi(),env={DB,ANALYTICS_ADMIN_USER_IDS:'owner-1'};
 assert.equal((await api(request('GET','student-1'),env)).status,403);assert.equal((await api(request('GET',''),env)).status,403);assert.equal((await api(request('POST','owner-1'),env)).status,405);assert.equal((await api(request('GET','owner-1'),{},)).status,503);
});
