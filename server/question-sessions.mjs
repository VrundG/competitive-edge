import {consumeAuthAttempt} from './auth-database.mjs';
import {isAllowedWriteOrigin} from './security.mjs';

const MAX_QUESTIONS=40,SESSION_MS=24*60*60*1000;
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie',...headers}});
const safeQuestion=({answer,explanation,params,...question})=>question;
const validId=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]{1,79}$/i.test(value);
const boundedStrings=(value,max=120)=>Array.isArray(value)&&value.length<=max&&value.every(validId)?value:null;
async function readJson(request){const raw=await request.text();if(raw.length>12000)return {error:json({error:'Request too large'},413)};try{return {input:JSON.parse(raw)}}catch{return {error:json({error:'Invalid JSON'},400)}}}
function studentIdentity(identity){return typeof identity==='string'&&identity.startsWith('student:')&&identity.length<=200?identity:null;}

export function createQuestionSessionApi({bank,learning,competition,resolveIdentity}){
 const byId=new Map(bank.questions.map(question=>[question.id,question]));
 const skillFor=question=>learning.skillId(question);
 const choose=(input)=>{
  const mode=input.mode,track=input.track||'all',seen=boundedStrings(input.seenIds||[],500)||[],count=Math.min(MAX_QUESTIONS,Math.max(1,Number(input.count)||10));
  if(!['practice','diagnostic','review','quiz'].includes(mode)||!['all','economics','finance'].includes(track))throw Error('Choose a valid question session.');
  if(mode==='diagnostic'){
   if(!['economics','finance'].includes(track))throw Error('Choose a diagnostic challenge.');
   return learning.diagnostic(seen,Math.random,track);
  }
  if(mode==='practice'){
   const resourceIds=boundedStrings(input.resourceIds||[],40);if(!resourceIds?.length)throw Error('Choose at least one study topic.');
   const eligible=bank.eligible(resourceIds);if(!eligible.length)throw Error('No practice questions match those topics.');
   return bank.sample(eligible,count,seen);
  }
  if(mode==='review'){
   const requested=boundedStrings(input.questionIds||[],MAX_QUESTIONS),skillIds=boundedStrings(input.skillIds||[],40);
   if(requested?.length){const items=requested.map(id=>byId.get(id));if(items.some(item=>!item))throw Error('A requested question is unavailable.');return bank.shuffle(items).slice(0,count);}
   if(!skillIds?.length)throw Error('Choose at least one skill to review.');
   const wanted=new Set(skillIds),eligible=bank.questions.filter(question=>wanted.has(skillFor(question)));if(!eligible.length)throw Error('No review questions match those skills.');return bank.sample(eligible,count,seen);
  }
  if(!['economics','finance'].includes(track))throw Error('Choose a Quiz Bowl challenge.');
  const history={ids:boundedStrings(input.historyIds||[],240)||[],families:boundedStrings(input.historyFamilies||[],120)||[]};
  return competition.selectQuizQuestions(bank,track,count,Math.random,history);
 };
 return async function handle(request,env){
  if(!env.DB)return json({error:'Question service is temporarily unavailable.'},503);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!isAllowedWriteOrigin(request))return json({error:'Cross-origin requests are not allowed.'},403);
  try{
   const userId=studentIdentity(await resolveIdentity(request,env));if(!userId)return json({error:'Sign in to start practice.'},401);
   const url=new URL(request.url),reveal=/^\/api\/question-sessions\/([a-f0-9-]{36})\/reveal$/i.exec(url.pathname);
   if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return json({error:'JSON required'},415);
   const parsed=await readJson(request);if(parsed.error)return parsed.error;const input=parsed.input;
   if(reveal){
    const index=Number(input?.index);if(!Number.isInteger(index)||index<0||index>=MAX_QUESTIONS)return json({error:'Invalid question index.'},400);
    const row=await env.DB.prepare('SELECT mode, question_ids, last_revealed, expires_at FROM question_sessions WHERE id = ? AND user_id = ?').bind(reveal[1],userId).first();
    if(!row||row.expires_at<=Date.now())return json({error:'This Quiz Bowl round has expired. Start a new round.'},404);
    if(row.mode!=='quiz'||index>row.last_revealed+1)return json({error:'Reveal questions in round order.'},409);
    const ids=JSON.parse(row.question_ids),question=byId.get(ids[index]);if(!question)return json({error:'Question unavailable.'},404);
    await env.DB.prepare('UPDATE question_sessions SET last_revealed = MAX(last_revealed, ?) WHERE id = ? AND user_id = ?').bind(index,reveal[1],userId).run();
    return json({questionId:question.id,answer:question.answer,answerText:question.choices[question.answer],explanation:question.explanation});
   }
   if(url.pathname!=='/api/question-sessions')return json({error:'Not found'},404);
   const now=Date.now(),limit=await consumeAuthAttempt(env.DB,'question-sessions:'+userId,now,now+60*60*1000);if(limit.count>40)return json({error:'Too many new practice sets. Continue an existing set or try again later.'},429,{'Retry-After':String(Math.max(1,Math.ceil((limit.expires_at-now)/1000)))});
   let questions;try{questions=choose(input||{})}catch(error){return json({error:error.message},400)}
   if(!questions.length||questions.length>MAX_QUESTIONS)return json({error:'No questions are available for this set.'},400);
   const id=crypto.randomUUID(),mode=input.mode,track=input.track||'all';
   await env.DB.prepare('INSERT INTO question_sessions (id, user_id, mode, track, question_ids, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id,userId,mode,track,JSON.stringify(questions.map(question=>question.id)),now,now+SESSION_MS).run();
   await env.DB.prepare('DELETE FROM question_sessions WHERE expires_at <= ?').bind(now).run();
   return json({id,mode,track,questions:questions.map(safeQuestion)},201);
  }catch(error){console.error('Question session failed',error.name);return json({error:'Question service is unavailable. Please retry.'},503)}
 };
}

export function createQuestionSessionValidator(){
 return async ({db,userId,attempt})=>{
  const row=await db.prepare('SELECT mode, track, question_ids, expires_at FROM question_sessions WHERE id = ? AND user_id = ?').bind(attempt.id,userId).first();
  if(!row||row.expires_at<=Date.now())return false;
  const ids=JSON.parse(row.question_ids);
  return row.mode===(attempt.mode||'practice')&&row.track===(attempt.track||'all')&&ids.join('|')===attempt.questionIds.join('|');
 };
}
