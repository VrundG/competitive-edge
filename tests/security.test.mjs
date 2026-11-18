import test from 'node:test';
import assert from 'node:assert/strict';
import {corsPreflight,isAllowedWriteOrigin,withPublicCors,withSecurityHeaders} from '../server/security.mjs';

const request=(method='GET',origin='https://vrundg.github.io')=>new Request('https://competitive-edge.lebronbron99.chatgpt.site/api/progress',{method,headers:{Origin:origin}});

test('GitHub Pages is the only approved cross-origin frontend',()=>{
 assert.equal(isAllowedWriteOrigin(request('PUT')),true);
 assert.equal(isAllowedWriteOrigin(request('PUT','https://malicious.example')),false);
 assert.equal(isAllowedWriteOrigin(request('PUT','https://competitive-edge.lebronbron99.chatgpt.site')),true);
});

test('browser security headers restrict framing, referrers, and unnecessary device access',()=>{
 const response=withSecurityHeaders(new Response('ok'));
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
 assert.equal(response.headers.get('Referrer-Policy'),'strict-origin-when-cross-origin');
 assert.match(response.headers.get('Permissions-Policy'),/geolocation=\(\)/);
 assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
 assert.match(response.headers.get('Content-Security-Policy'),/connect-src 'self' https:\/\/competitive-edge\.lebronbron99\.chatgpt\.site/);
});

test('API preflight and responses expose narrowly scoped CORS headers',async()=>{
 const preflight=corsPreflight(request('OPTIONS'));
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://vrundg.github.io');
 assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);
 const response=withPublicCors(request(),new Response('ok',{headers:{Vary:'Cookie'}}));
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://vrundg.github.io');
 assert.match(response.headers.get('Vary'),/Cookie/);
 assert.match(response.headers.get('Vary'),/Origin/);
 assert.equal(await response.text(),'ok');
 assert.equal(corsPreflight(request('OPTIONS','https://malicious.example')).status,403);
});
