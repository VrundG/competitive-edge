import {NC_REGIONS,REGION_OPTIONS} from './regions.mjs';

const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie'}});
const number=value=>Number(value)||0;

export function canViewRegionalReach(request,env,student=null){
 if(student)return student.role==='management';
 const userId=request.headers.get('oai-authenticated-user-id');
 const allowed=String(env.ANALYTICS_ADMIN_USER_IDS||'').split(',').map(value=>value.trim()).filter(Boolean);
 return Boolean(userId&&allowed.includes(userId));
}

export async function readRegionalReach(db){
 const result=await db.prepare(`SELECT
   a.region AS region,
   COUNT(*) AS registrations,
   SUM(CASE WHEN p.user_id IS NOT NULL THEN 1 ELSE 0 END) AS active_learners,
   SUM(CASE WHEN json_array_length(json_extract(p.payload, '$.sheet')) > 0 THEN 1 ELSE 0 END) AS study_planners,
   SUM(CASE WHEN e.user_id IS NOT NULL OR f.user_id IS NOT NULL THEN 1 ELSE 0 END) AS diagnostic_learners,
   SUM(CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END) AS economics_diagnostics,
   SUM(CASE WHEN f.user_id IS NOT NULL THEN 1 ELSE 0 END) AS finance_diagnostics
  FROM student_accounts a
  LEFT JOIN learner_progress p ON p.user_id = 'student:' || a.id
  LEFT JOIN diagnostic_completions e ON e.user_id = 'student:' || a.id AND e.track = 'economics'
  LEFT JOIN diagnostic_completions f ON f.user_id = 'student:' || a.id AND f.track = 'finance'
  WHERE a.role = 'student'
  GROUP BY a.region`).bind().all();
 const rows=new Map((result.results||[]).map(row=>[row.region||'Region not provided',{
  region:row.region||'Region not provided',registrations:number(row.registrations),activeLearners:number(row.active_learners),studyPlanners:number(row.study_planners),diagnosticLearners:number(row.diagnostic_learners),economicsDiagnostics:number(row.economics_diagnostics),financeDiagnostics:number(row.finance_diagnostics)
 }]));
 const empty=region=>({region,registrations:0,activeLearners:0,studyPlanners:0,diagnosticLearners:0,economicsDiagnostics:0,financeDiagnostics:0});
 const regions=NC_REGIONS.map(region=>rows.get(region)||empty(region));
 const otherLabels=[...REGION_OPTIONS.filter(region=>!NC_REGIONS.includes(region)),'Region not provided'];
 const other=otherLabels.map(region=>rows.get(region)).filter(Boolean).reduce((total,row)=>{for(const key of Object.keys(total))if(key!=='region')total[key]+=row[key];return total;},empty('Other responses'));
 const totals=[...regions,other].reduce((total,row)=>{for(const key of Object.keys(total))if(key!=='region')total[key]+=row[key];return total;},empty('All students'));
 return {regions,other,totals};
}

export function createRegionalReachApi({authorize=async(request,env)=>canViewRegionalReach(request,env)}={}){
 return async function handle(request,env){
  if(request.method!=='GET')return response({error:'Method not allowed'},405);
  if(!env.DB)return response({error:'Regional reporting is unavailable.'},503);
  if(!await authorize(request,env))return response({error:'Regional reporting is restricted.'},403);
  try{return response({...await readRegionalReach(env.DB),generatedAt:new Date().toISOString()});}
  catch(error){console.error('Regional reach reporting failed',error.name);return response({error:'Regional reporting could not be loaded.'},503);}
 };
}
