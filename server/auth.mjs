import {scryptAsync} from '@noble/hashes/scrypt.js';
import * as authDb from './auth-database.mjs';
import {canViewRegionalReach} from './regional-reach.mjs';
import {NC_REGIONS,REGION_OPTIONS} from './regions.mjs';
import {isAllowedWriteOrigin,isPublicAppOrigin} from './security.mjs';
export {NC_REGIONS,REGION_OPTIONS};
const SESSION_COOKIE='__Host-student_session',SESSION_SECONDS=86400;
const AUTH_COST={N:16384,r:8,p:5,dkLen:32,maxmem:64*1024*1024};
const utf8=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=value=>Uint8Array.from(value.match(/../g)||[],b=>parseInt(b,16));
const randomHex=length=>hex(crypto.getRandomValues(new Uint8Array(length)));
const digest=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8.encode(value))));
const authResponse=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie',...headers}});
const sessionCookie=(token,seconds=SESSION_SECONDS)=>`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
const publicStudent=student=>student?{id:student.id,username:student.username,role:student.role||'student',region:student.region||null,profileImage:student.profile_image||null,recoveryReady:Boolean(student.recovery_hash)}:null;
const validRegion=value=>typeof value==='string'&&REGION_OPTIONS.includes(value);
function readToken(request){
 const entries=(request.headers.get('Cookie')||'').split(';').map(c=>c.trim()).filter(c=>c.startsWith(SESSION_COOKIE+'='));
 if(entries.length){if(entries.length!==1)return '';const value=entries[0].slice(SESSION_COOKIE.length+1);return /^[a-f0-9]{64}$/.test(value)?value:'';}
 const authorization=request.headers.get('Authorization');if(!authorization)return null;
 const match=/^Bearer ([a-f0-9]{64})$/.exec(authorization);return match?match[1]:'';
}
async function readJson(request,maxBytes=4096){
 let size=0,chunks=[];const reader=request.body?.getReader();if(!reader)return {error:authResponse({error:'Invalid request'},400)};
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return {error:authResponse({error:'Request too large'},413)};}chunks.push(value);}
 const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
 try{return {input:JSON.parse(new TextDecoder().decode(raw))};}catch{return {error:authResponse({error:'Invalid JSON'},400)};}
}
export async function hashPassword(password){const salt=randomHex(16);const value=await scryptAsync(utf8.encode(password),unhex(salt),AUTH_COST);return `scrypt:16384:8:5:${salt}:${hex(value)}`;}
export async function verifyPassword(password,encoded){const parts=encoded.split(':');if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:16384:8:5'||!/^[a-f0-9]{32}$/.test(parts[4])||!/^[a-f0-9]{64}$/.test(parts[5]))return false;const value=await scryptAsync(utf8.encode(password),unhex(parts[4]),AUTH_COST);const expected=unhex(parts[5]);let diff=0;for(let i=0;i<32;i++)diff|=value[i]^expected[i];return diff===0;}
const recoveryCode=()=>randomHex(16).toUpperCase().match(/.{1,4}/g).join('-');
const recoveryDigest=code=>digest(String(code||'').replace(/[^a-f0-9]/gi,'').toLowerCase());
const sameHex=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
export async function resolveStudentSession(request,env){const token=readToken(request);if(!token)return null;const tokenHash=await digest(token),student=await authDb.findSession(env.DB,tokenHash,Date.now());return student?{student,tokenHash}:null;}
export async function resolveStudentIdentity(request,env){const token=readToken(request);if(token!==null){const session=await resolveStudentSession(request,env);return session?'student:'+session.student.id:null;}return request.headers.get('oai-authenticated-user-id');}
export async function canAccessRegionalReach(request,env){const token=readToken(request);const student=token?await authDb.findSession(env.DB,await digest(token),Date.now()):null;return canViewRegionalReach(request,env,student);}
export async function handleAuth(request,env){
 if(!env.DB)return authResponse({error:'Account storage is unavailable.'},503);
 const path=new URL(request.url).pathname;
 try{
  if(path==='/api/auth/session'&&request.method==='GET'){const session=await resolveStudentSession(request,env),student=session?.student||null,count=student?Number((await authDb.countSessions(env.DB,student.id,Date.now()))?.count||0):0;return authResponse({student:publicStudent(student),regions:REGION_OPTIONS,sessionCount:count,canViewRegionalReach:canViewRegionalReach(request,env,student)});}
  if(!['/api/auth/register','/api/auth/login','/api/auth/logout','/api/auth/logout-others','/api/auth/region','/api/auth/avatar','/api/auth/recovery-code','/api/auth/recover'].includes(path))return authResponse({error:'Not found'},404);
  if(request.method!=='POST')return authResponse({error:'Method not allowed'},405);
  if(!isAllowedWriteOrigin(request))return authResponse({error:'Cross-origin requests are not allowed.'},403);
  if(path==='/api/auth/logout'){const token=readToken(request);if(token)await authDb.deleteSession(env.DB,await digest(token));return authResponse({ok:true},200,{'Set-Cookie':sessionCookie('',0)});}
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return authResponse({error:'JSON required'},415);
  // Bound the stream before decoding to avoid buffering arbitrary request sizes.
  const parsed=await readJson(request,path==='/api/auth/avatar'?230000:4096);if(parsed.error)return parsed.error;const input=parsed.input;
  if(path==='/api/auth/logout-others'){
   const session=await resolveStudentSession(request,env);if(!session)return authResponse({error:'Sign in to manage sessions.'},401);
   await authDb.deleteOtherSessions(env.DB,session.student.id,session.tokenHash);return authResponse({ok:true,sessionCount:1});
  }
  if(path==='/api/auth/recovery-code'){
   const session=await resolveStudentSession(request,env);if(!session)return authResponse({error:'Sign in to create a recovery code.'},401);
   if(typeof input?.currentPassword!=='string'||!await verifyPassword(input.currentPassword,session.student.password_hash))return authResponse({error:'The current passphrase is incorrect.'},401);
   const code=recoveryCode();await authDb.setRecoveryHash(env.DB,session.student.id,await recoveryDigest(code),Date.now());return authResponse({recoveryCode:code,student:publicStudent({...session.student,recovery_hash:'set'})});
  }
  if(path==='/api/auth/recover'){
   if(!input||typeof input.username!=='string'||typeof input.recoveryCode!=='string'||typeof input.newPassword!=='string')return authResponse({error:'Username, recovery code, and new passphrase are required.'},400);
   const username=input.username.trim().toLowerCase(),newPassword=input.newPassword;if(!/^[a-z][a-z0-9_]{2,31}$/.test(username)||[...newPassword].length<15||[...newPassword].length>128)return authResponse({error:'Recovery details are invalid.'},400);
   const now=Date.now(),limit=await authDb.consumeAuthAttempt(env.DB,'recovery:'+await digest(username),now,now+15*60*1000);if(limit.count>5)return authResponse({error:'Too many recovery attempts. Try again later.'},429,{'Retry-After':String(Math.max(1,Math.ceil((limit.expires_at-now)/1000)))});
   const student=await authDb.findStudent(env.DB,username),candidate=await recoveryDigest(input.recoveryCode);if(!student?.recovery_hash||!sameHex(candidate,student.recovery_hash))return authResponse({error:'Recovery details are invalid.'},401);
   await authDb.resetWithRecovery(env.DB,student.id,await hashPassword(newPassword));const token=randomHex(32),tokenHash=await digest(token);await authDb.insertSession(env.DB,tokenHash,student.id,now+SESSION_SECONDS*1000,now);const updated=await authDb.findStudent(env.DB,username);return authResponse({student:publicStudent(updated),recoveryCodeUsed:true,canViewRegionalReach:canViewRegionalReach(request,env,updated),...(isPublicAppOrigin(request)?{sessionToken:token}:{})},200,{'Set-Cookie':sessionCookie(token)});
  }
  if(path==='/api/auth/region'){
   const token=readToken(request);if(!token)return authResponse({error:'Sign in to update your region.'},401);
   const student=await authDb.findSession(env.DB,await digest(token),Date.now());if(!student)return authResponse({error:'Sign in to update your region.'},401);
   if(!input||!validRegion(input.region))return authResponse({error:'Choose a region from the list.'},400);
   return authResponse({student:publicStudent(await authDb.updateStudentRegion(env.DB,student.id,input.region,Date.now()))});
  }
  if(path==='/api/auth/avatar'){
   const token=readToken(request);if(!token)return authResponse({error:'Sign in to update your profile picture.'},401);
   const student=await authDb.findSession(env.DB,await digest(token),Date.now());if(!student)return authResponse({error:'Sign in to update your profile picture.'},401);
   const profileImage=input?.profileImage===null?null:input?.profileImage;
   if(profileImage!==null&&(typeof profileImage!=='string'||profileImage.length>220000||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(profileImage)))return authResponse({error:'Use a JPG, PNG, or WebP image under 8 MB.'},400);
   return authResponse({student:publicStudent(await authDb.updateStudentProfileImage(env.DB,student.id,profileImage))});
  }
  if(!input||typeof input.username!=='string'||typeof input.password!=='string')return authResponse({error:'Username and password are required.'},400);
  const username=input.username.trim().toLowerCase(),password=input.password;
  if(!/^[a-z][a-z0-9_]{2,31}$/.test(username))return authResponse({error:'Use 3–32 letters, numbers, or underscores; start with a letter.'},400);
  if([...password].length<15||[...password].length>128||utf8.encode(password).length>512)return authResponse({error:'Use a password or passphrase of 15–128 characters.'},400);
  const now=Date.now(),windowEnd=now+15*60*1000;
  const client=request.headers.get('oai-authenticated-user-id')||request.headers.get('CF-Connecting-IP')||'unknown';
  const clientLimit=await authDb.consumeAuthAttempt(env.DB,'client:'+await digest(client),now,windowEnd);
  if(clientLimit.count>20)return authResponse({error:'Too many attempts. Try again later.'},429,{'Retry-After':String(Math.max(1,Math.ceil((clientLimit.expires_at-now)/1000)))});
  const nameLimit=await authDb.consumeAuthAttempt(env.DB,'name:'+await digest(username),now,windowEnd);
  if(clientLimit.count>20||nameLimit.count>5)return authResponse({error:'Too many attempts. Try again later.'},429,{'Retry-After':String(Math.max(1,Math.ceil((Math.max(clientLimit.expires_at,nameLimit.expires_at)-now)/1000)))});
  let student;
  let progressMigrated=false;
  if(path==='/api/auth/register'){
   if(!validRegion(input.region))return authResponse({error:'Choose a region from the list.'},400);
   // Move any progress saved to the verified hosting identity in the same atomic batch
   // that creates the student. A custom-account session is never used as a migration source.
   const platformIdentity=readToken(request)===null?request.headers.get('oai-authenticated-user-id'):null;
   const sourceIdentity=platformIdentity&&platformIdentity.length<=200?platformIdentity:null;
   const code=recoveryCode(),created=await authDb.insertStudent(env.DB,crypto.randomUUID(),username,await hashPassword(password),input.region,now,sourceIdentity,await recoveryDigest(code));
   if(!created)return authResponse({error:'That username is unavailable.'},409);
   student=created.student;progressMigrated=created.progressMigrated;student.newRecoveryCode=code;
  }else{
   student=await authDb.findStudent(env.DB,username);
   // Missing users still execute the same password KDF before returning the generic failure.
  const encoded=student?.password_hash||`scrypt:16384:8:5:${'0'.repeat(32)}:${'0'.repeat(64)}`;
   const matches=await verifyPassword(password,encoded);if(!student||!matches)return authResponse({error:'Incorrect username or password.'},401);
  }
  const token=randomHex(32),tokenHash=await digest(token);
  await authDb.expireAuthRecords(env.DB,now);
  await authDb.insertSession(env.DB,tokenHash,student.id,now+SESSION_SECONDS*1000,now);
  const old=readToken(request);if(old)await authDb.deleteSession(env.DB,await digest(old));
  return authResponse({student:publicStudent(student),progressMigrated,...(student.newRecoveryCode?{recoveryCode:student.newRecoveryCode}:{}),canViewRegionalReach:canViewRegionalReach(request,env,student),...(isPublicAppOrigin(request)?{sessionToken:token}:{})},path.endsWith('/register')?201:200,{'Set-Cookie':sessionCookie(token)});
 }catch(error){console.error('Student authentication failed',error.name);return authResponse({error:'Account service is unavailable. Please try again.'},503);}
}
