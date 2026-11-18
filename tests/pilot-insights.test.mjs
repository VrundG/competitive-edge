import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {database} from '../scripts/sqlite-adapter.mjs';
import {createPilotInsightsApi} from '../server/pilot-insights.mjs';
const require=createRequire(import.meta.url),bank=require('../server/question-bank.cjs');
function setup(){const DB=database();for(const file of fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort())DB.sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));const api=createPilotInsightsApi({topics:bank.topics,authorize:async request=>request.headers.get('x-role')==='management'});return {DB,call:async(role='management',method='GET')=>{const response=await api(new Request('https://example.test/api/pilot-insights',{method,headers:{'x-role':role}}),{DB});return {status:response.status,data:await response.json()};}};}
function account(DB,id,username,region='North Central'){DB.sqlite.prepare('INSERT INTO student_accounts (id, username, password_hash, role, region, region_updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id,username,'hash','student',region,1,1);}
function attempt(id,mode,questions,wrong=false){return {id,mode,track:'economics',completedAt:new Date().toISOString(),questions,answers:Object.fromEntries(questions.map((question,index)=>[question.id,wrong&&index===0?(question.answer+1)%question.choices.length:question.answer]))};}
function progress(DB,id,history,sheet=[]){DB.sqlite.prepare('INSERT INTO learner_progress (user_id, revision, payload, last_write_id, updated_at) VALUES (?, ?, ?, ?, ?)').run('student:'+id,1,JSON.stringify({sheet,attempt:null,history}),crypto.randomUUID(),new Date().toISOString());}
function diagnostic(DB,id,track){DB.sqlite.prepare('INSERT INTO diagnostic_completions (user_id, track, completed_at, attempt_id) VALUES (?, ?, ?, ?)').run('student:'+id,track,new Date().toISOString(),crypto.randomUUID());}

test('pilot insights returns a coherent aggregate funnel and suppresses small topic accuracy',async()=>{
 const {DB,call}=setup(),topic=bank.questions[0].topic,questions=bank.questions.filter(question=>question.topic===topic).slice(0,3);
 assert.equal(questions.length,3);account(DB,'a','student_alpha');account(DB,'b','student_beta','Western');account(DB,'c','student_gamma',null);
 progress(DB,'a',[attempt('a-diagnostic','diagnostic',questions),attempt('a-practice','practice',questions,true)],[['saving',false]]);progress(DB,'b',[attempt('b-practice','practice',questions)]);diagnostic(DB,'a','economics');diagnostic(DB,'b','finance');
 const result=await call();assert.equal(result.status,200);assert.deepEqual(result.data.funnel,{registrations:3,activeLearners:2,diagnosticStarted:2,diagnosticCompleted:2,practiceCompleted:2,returningLearners:1,studyPlanners:1});assert.deepEqual(result.data.diagnostics,{economics:1,finance:1});assert.equal(result.data.activity.completedSets,3);assert.equal(result.data.activity.totalAnswers,9);assert.equal(result.data.activity.totalCorrect,8);assert.equal(result.data.activity.accuracy,89);assert.equal(result.data.dataQuality.missingRegion,1);
 const topicResult=result.data.topics.find(item=>item.id===topic);assert.equal(topicResult.attempted,9);assert.equal(topicResult.learnerCount,2);assert.equal(topicResult.displayAccuracy,true);assert.equal(topicResult.accuracy,89);const empty=result.data.topics.find(item=>item.id!==topic);assert.equal(empty.displayAccuracy,false);assert.equal(result.data.privacy.individualRecordsReturned,0);
 const serialized=JSON.stringify(result.data);for(const privateValue of ['student_alpha','student_beta','student:a','student:b'])assert.equal(serialized.includes(privateValue),false);
});

test('pilot insights requires management and supports GET only',async()=>{const {call}=setup();assert.equal((await call('student')).status,403);assert.equal((await call('management','POST')).status,405);});
