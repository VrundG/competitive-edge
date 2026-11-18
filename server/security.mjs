export const PUBLIC_APP_ORIGINS=new Set(['https://vrundg.github.io']);

export function requestOrigin(request){return request.headers.get('Origin')||'';}

export function isPublicAppOrigin(request){return PUBLIC_APP_ORIGINS.has(requestOrigin(request));}

export function isAllowedWriteOrigin(request){
 const origin=requestOrigin(request);
 return origin===new URL(request.url).origin||PUBLIC_APP_ORIGINS.has(origin);
}

export function corsPreflight(request){
 if(request.method!=='OPTIONS'||!new URL(request.url).pathname.startsWith('/api/'))return null;
 const origin=requestOrigin(request);
 if(!PUBLIC_APP_ORIGINS.has(origin))return new Response(null,{status:403});
 return new Response(null,{status:204,headers:{
  'Access-Control-Allow-Origin':origin,
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, OPTIONS',
  'Access-Control-Max-Age':'86400',
  'Vary':'Origin'
 }});
}

export function withSecurityHeaders(response){
 const headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 headers.set('Permissions-Policy','camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');
 headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://competitive-edge.lebronbron99.chatgpt.site; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export function withPublicCors(request,response){
 const origin=requestOrigin(request);
 if(!PUBLIC_APP_ORIGINS.has(origin))return withSecurityHeaders(response);
 const headers=new Headers(response.headers);
 headers.set('Access-Control-Allow-Origin',origin);
 headers.append('Vary','Origin');
 return withSecurityHeaders(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
}
