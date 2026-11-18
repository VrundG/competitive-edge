import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from '../scripts/sqlite-adapter.mjs';
import {createHealthApi} from '../server/health.mjs';
const api=createHealthApi({questionCount:1017,originalCount:57,version:'2026.10'});
test('health confirms database and question-bank availability without private data',async()=>{const response=await api(new Request('https://example.test/api/health'),{DB:database()});assert.equal(response.status,200);const data=await response.json();assert.equal(data.status,'ok');assert.equal(data.database,'ok');assert.deepEqual(data.questionBank,{version:'2026.10',total:1017,original:57});assert.equal(JSON.stringify(data).includes('username'),false);});
test('health reports degraded dependencies and rejects writes',async()=>{assert.equal((await api(new Request('https://example.test/api/health'))).status,503);assert.equal((await api(new Request('https://example.test/api/health',{method:'POST'}),{DB:database()})).status,405);});
