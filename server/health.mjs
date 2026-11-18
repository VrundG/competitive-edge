const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function createHealthApi({questionCount,originalCount,version='1'}){return async function health(request,env={}){
 if(request.method!=='GET'&&request.method!=='HEAD')return response({error:'Method not allowed'},405);
 if(!env.DB)return response({status:'degraded',database:'unavailable',questionBank:{version,total:questionCount,original:originalCount}},503);
 try{const result=await env.DB.prepare('SELECT 1 AS ok').bind().first();if(Number(result?.ok)!==1)throw new Error('Database check failed');const body={status:'ok',database:'ok',questionBank:{version,total:questionCount,original:originalCount},checkedAt:new Date().toISOString()};return request.method==='HEAD'?new Response(null,{status:200,headers:{'Cache-Control':'no-store'}}):response(body);}
 catch(error){console.error('Health check failed',error.name);return response({status:'degraded',database:'unavailable',questionBank:{version,total:questionCount,original:originalCount}},503);}
};}
