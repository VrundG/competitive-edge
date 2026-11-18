import {readDiagnosticCompletions,readProgress,recordDiagnosticCompletions,writeProgress} from './database.mjs';
import {isAllowedWriteOrigin} from './security.mjs';
const emptyProgress=()=>({sheet:[],attempt:null,history:[]});
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie'}});
export function createProgressApi({questions,resourceIds,diagnosticBlueprint=[],diagnosticTracks={},resolveIdentity=async request=>request.headers.get('oai-authenticated-user-id'),validateQuestionSession=async()=>true}){
 const allowedResources=new Set(resourceIds), bank=new Map(questions.map(q=>[q.id,q]));
 const publicQuestion=({answer,explanation,params,...question})=>question;
 const publicState=state=>({...state,attempt:state.attempt?{...state.attempt,questions:state.attempt.submitted?state.attempt.questions:state.attempt.questions.map(publicQuestion)}:null});
 async function validate(input,previous,db,userId){
  if(!Array.isArray(input.sheet)||input.sheet.length>resourceIds.length)throw Error('Invalid study sheet');
  const seen=new Set();const sheet=input.sheet.map(pair=>{if(!Array.isArray(pair)||pair.length!==2||!allowedResources.has(pair[0])||typeof pair[1]!=='boolean'||seen.has(pair[0]))throw Error('Invalid study sheet resource');seen.add(pair[0]);return pair;});
  let attempt=null;let history=previous.history||[];
  if(input.attempt!==null){const a=input.attempt;if(!a||typeof a.id!=='string'||!/^[a-f0-9-]{36}$/i.test(a.id)||!Array.isArray(a.questionIds)||!a.questionIds.length||a.questionIds.length>40||new Set(a.questionIds).size!==a.questionIds.length||!a.answers||typeof a.answers!=='object'||Array.isArray(a.answers)||typeof a.submitted!=='boolean'||!Number.isInteger(a.index)||a.index<0||a.index>=a.questionIds.length)throw Error('Invalid practice attempt');
   const same=previous.attempt?.id===a.id;const mode=a.mode||'practice';if(!['practice','diagnostic','review'].includes(mode))throw Error('Invalid practice mode');if(same&&mode!==(previous.attempt.mode||'practice'))throw Error('An active practice mode cannot be changed');const track=a.track||'all';if(!['all','economics','finance'].includes(track))throw Error('Invalid challenge');if(same&&track!==(previous.attempt.track||'all'))throw Error('An active challenge cannot be changed');const blueprint=track==='all'?diagnosticBlueprint:diagnosticTracks[track]||[];if(!same&&mode==='diagnostic'&&(!blueprint.length||a.questionIds.length!==blueprint.length||blueprint.some(group=>a.questionIds.filter(id=>group.includes(id)).length!==1)))throw Error('Diagnostic must include one question per available skill');if(!same&&!await validateQuestionSession({db,userId,attempt:a}))throw Error('Start this question set from Competitive Edge before saving it');const source=bank;
   if(same&&a.questionIds.join('|')!==previous.attempt.questions.map(q=>q.id).join('|'))throw Error('An active question set cannot be changed');
   const items=a.questionIds.map(id=>{const q=source.get(id);if(!q)throw Error('Unknown question');return q;});
   const answers={};for(const [id,value] of Object.entries(a.answers)){const q=items.find(q=>q.id===id);if(!q||!Number.isInteger(value)||value<0||value>=q.choices.length)throw Error('Invalid answer');answers[id]=value;}
   if(a.submitted&&items.some(q=>!Number.isInteger(answers[q.id])))throw Error('Answer every question before submitting');
   attempt=same&&previous.attempt.submitted?previous.attempt:{id:a.id,mode,track,questions:items,answers,index:a.index,submitted:a.submitted};
   if(attempt.submitted&&!history.some(x=>x.id===attempt.id)){history=[{id:attempt.id,mode:attempt.mode||'practice',track:attempt.track||'all',completedAt:new Date().toISOString(),correct:attempt.questions.filter(q=>attempt.answers[q.id]===q.answer).length,total:items.length,topics:[...new Set(items.map(q=>q.topic))],questions:attempt.questions,answers:attempt.answers},...history].slice(0,20);}
  }
  return {sheet,attempt,history};
 }
 return async function handle(request,env){
  if(!env.DB)return response({error:'Progress storage is temporarily unavailable.'},503);
  if(!['GET','PUT'].includes(request.method))return response({error:'Method not allowed'},405);
  if(request.method==='PUT'&&!isAllowedWriteOrigin(request))return response({error:'Cross-origin writes are not allowed.'},403);
  try{
   const userId=await resolveIdentity(request,env);if(!userId||userId.length>200)return response({error:'Sign in to save and load your progress.'},401);
   const saved=await readProgress(env.DB,userId);const previous=saved?JSON.parse(saved.payload):emptyProgress();
   if(request.method==='GET'){await recordDiagnosticCompletions(env.DB,userId,previous);return response({revision:saved?.revision||0,state:publicState(previous),diagnostics:await readDiagnosticCompletions(env.DB,userId)});}
   if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return response({error:'JSON required'},415);
   const raw=await request.text();if(raw.length>50000)return response({error:'Request too large'},413);
   let input;try{input=JSON.parse(raw);}catch{return response({error:'Invalid JSON'},400);}
   if(!input||typeof input!=='object'||!Number.isInteger(input.revision)||input.revision<0||typeof input.writeId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.writeId))return response({error:'Invalid save request'},400);
   if(saved?.last_write_id===input.writeId){await recordDiagnosticCompletions(env.DB,userId,previous);return response({revision:saved.revision,state:publicState(previous),diagnostics:await readDiagnosticCompletions(env.DB,userId)});}
   if(input.revision!==(saved?.revision||0))return response({error:'Progress changed in another tab. Reload saved progress before continuing.'},409);
   let next;try{next=await validate(input.state,previous,env.DB,userId);}catch(e){return response({error:e.message},400);}
   const updated=await writeProgress(env.DB,userId,input.revision,next,input.writeId);
   if(!updated)return response({error:'Progress changed in another tab. Reload saved progress before continuing.'},409);
   await recordDiagnosticCompletions(env.DB,userId,next);
   return response({revision:updated.revision,state:publicState(next),diagnostics:await readDiagnosticCompletions(env.DB,userId)});
  }catch(error){console.error('Progress storage failed',error.name);return response({error:'Progress could not be saved or loaded. Please retry.'},503);}
 };
}
