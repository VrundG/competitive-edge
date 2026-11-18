const test=require('node:test');
const assert=require('node:assert/strict');
const flow=require('../public/practice-flow.js');

const questions=[{id:'one'},{id:'two'},{id:'three'}];

test('diagnostic progress identifies every unanswered question in display order',()=>{
 assert.deepEqual(flow.unansweredIndexes(questions,{one:0,three:2}),[1]);
 assert.equal(flow.answeredCount(questions,{one:0,three:2}),2);
});

test('choice zero counts as answered and invalid values do not',()=>{
 assert.deepEqual(flow.unansweredIndexes(questions,{one:0,two:'1',three:null}),[1,2]);
 assert.equal(flow.answeredCount(questions,{one:0,two:'1',three:null}),1);
});
