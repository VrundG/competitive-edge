import {readProgress} from './database.mjs';
import {isAllowedWriteOrigin} from './security.mjs';

const categories=new Set(['answer','wording','duplicate','other']);
const response=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});

async function boundedJson(request){
 let size=0,chunks=[];const reader=request.body?.getReader();if(!reader)throw Object.assign(new Error('Invalid request'),{status:400});
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw Object.assign(new Error('Request too large'),{status:413});}chunks.push(value);}
 const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(raw));}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}
}

export function createQuestionReportApi({resolveIdentity=async request=>request.headers.get('oai-authenticated-user-id'),authorizeManagement=async()=>false,questions=[]}){
 const bank=new Map(questions.map(question=>[`${question.id}:${question.version}`,question]));
 return async function handle(request,env){
  if(!env.DB)return response({error:'Question reporting is temporarily unavailable.'},503);
  const url=new URL(request.url),review=/^\/api\/question-reports\/([a-f0-9-]{36})$/i.exec(url.pathname);
  if(request.method==='GET'){
   if(!await authorizeManagement(request,env))return response({error:'Editorial review is restricted.'},403);
   try{const selected=url.searchParams.get('status')||'open';if(!['open','reviewed','resolved','all'].includes(selected))return response({error:'Invalid status filter.'},400);const where=selected==='all'?'':'WHERE status = ?',query=`SELECT id, question_id, question_version, category, note, status, created_at, reviewed_at, reviewed_by, resolution_note FROM question_reports ${where} ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END, created_at DESC LIMIT 100`,result=selected==='all'?await env.DB.prepare(query).bind().all():await env.DB.prepare(query).bind(selected).all(),counts=await env.DB.prepare(`SELECT status, COUNT(*) AS count FROM question_reports GROUP BY status`).bind().all();const items=(result.results||[]).map(row=>{const question=bank.get(`${row.question_id}:${row.question_version}`);return {id:row.id,questionId:row.question_id,version:row.question_version,category:row.category,note:row.note,status:row.status,createdAt:row.created_at,reviewedAt:row.reviewed_at,reviewedBy:row.reviewed_by,resolutionNote:row.resolution_note,question:question?{topic:question.topic,skill:question.skill,stem:question.stem,choices:question.choices,answer:question.answer,explanation:question.explanation,source:question.source,sourceLabel:question.sourceLabel,reviewStatus:question.reviewStatus}:null};});return response({items,counts:Object.fromEntries((counts.results||[]).map(row=>[row.status,Number(row.count)||0])),generatedAt:new Date().toISOString()});}catch(error){console.error('Editorial queue failed',error.name);return response({error:'The editorial queue could not be loaded.'},503);}
  }
  if(request.method==='PATCH'&&review){
   if(!isAllowedWriteOrigin(request))return response({error:'Cross-origin reviews are not allowed.'},403);
   if(!await authorizeManagement(request,env))return response({error:'Editorial review is restricted.'},403);
   if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return response({error:'JSON required'},415);
   try{const input=await boundedJson(request),status=input?.status,note=typeof input?.resolutionNote==='string'?input.resolutionNote.trim():'';if(!['open','reviewed','resolved'].includes(status)||[...note].length>500)return response({error:'Choose a valid status and keep notes under 500 characters.'},400);const reviewer=await resolveIdentity(request,env),now=status==='open'?null:Date.now(),updated=await env.DB.prepare('UPDATE question_reports SET status = ?, reviewed_at = ?, reviewed_by = ?, resolution_note = ? WHERE id = ? RETURNING id, status, reviewed_at, resolution_note').bind(status,now,status==='open'?null:reviewer,note,review[1]).first();if(!updated)return response({error:'Report not found.'},404);return response({report:{id:updated.id,status:updated.status,reviewedAt:updated.reviewed_at,resolutionNote:updated.resolution_note}});}catch(error){if(error.status)return response({error:error.message},error.status);console.error('Editorial update failed',error.name);return response({error:'The report could not be updated.'},503);}
  }
  if(request.method!=='POST'||url.pathname!=='/api/question-reports')return response({error:'Method not allowed'},405);
  if(!isAllowedWriteOrigin(request))return response({error:'Cross-origin reports are not allowed.'},403);
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return response({error:'JSON required'},415);
  try{
   const userId=await resolveIdentity(request,env);if(!userId||userId.length>200)return response({error:'Sign in before reporting a question.'},401);
   const input=await boundedJson(request);if(!input||typeof input!=='object')return response({error:'Invalid report'},400);
   const {attemptId,questionId,version,category}=input,note=typeof input.note==='string'?input.note.trim():'';
   if(typeof attemptId!=='string'||!/^[a-f0-9-]{36}$/i.test(attemptId)||typeof questionId!=='string'||questionId.length>100||!Number.isInteger(version)||version<1||!categories.has(category)||[...note].length>500)return response({error:'Choose a valid issue and keep notes under 500 characters.'},400);
   const saved=await readProgress(env.DB,userId);if(!saved)return response({error:'Submit the practice set before reporting a question.'},400);
   let state;try{state=JSON.parse(saved.payload);}catch{return response({error:'Saved progress could not be read.'},503);}
   const attempts=[state.attempt?.submitted?state.attempt:null,...(state.history||[])].filter(Boolean),attempt=attempts.find(item=>item.id===attemptId),question=attempt?.questions?.find(item=>item.id===questionId&&item.version===version);
   if(!question)return response({error:'This question was not found in a submitted set for your account.'},400);
   const now=Date.now(),since=now-24*60*60*1000,recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM question_reports WHERE user_id = ? AND created_at >= ?').bind(userId,since).first();
   if(Number(recent?.count||0)>=25)return response({error:'You have submitted several reports today. Try again tomorrow.'},429,{'Retry-After':'86400'});
   const report=await env.DB.prepare(`INSERT INTO question_reports (id, user_id, attempt_id, question_id, question_version, category, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?) ON CONFLICT(user_id, attempt_id, question_id, question_version, category) DO UPDATE SET note = excluded.note, status = 'open', created_at = excluded.created_at RETURNING id, status, created_at`).bind(crypto.randomUUID(),userId,attemptId,questionId,version,category,note,now).first();
   return response({report:{id:report.id,status:report.status,questionId,version},message:'Report received for editorial review.'});
  }catch(error){if(error.status)return response({error:error.message},error.status);console.error('Question report failed',error.name);return response({error:'The report could not be saved. Please try again.'},503);}
 };
}
