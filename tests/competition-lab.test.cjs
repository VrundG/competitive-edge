'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),model=require('../public/competition-lab-model.js'),bank=require('../server/question-bank.cjs');

test('each challenge has a complete original presentation case library',()=>{
 for(const track of ['economics','finance']){
  assert.equal(model.prompts[track].length,6);
  assert.equal(new Set(model.prompts[track].map(item=>item.id)).size,6);
  for(const item of model.prompts[track]){assert.ok(item.title&&item.brief);assert.equal(item.task.length,3);assert.equal(item.followUps.length,3);}
 }
});

test('quiz bowl draws unique questions only from the selected challenge',()=>{
 const economics=model.selectQuizQuestions(bank,'economics',40,()=>.42),finance=model.selectQuizQuestions(bank,'finance',40,()=>.42);
 assert.equal(economics.length,40);assert.equal(finance.length,40);
 assert.equal(new Set(economics.map(item=>item.id)).size,40);assert.equal(new Set(finance.map(item=>item.id)).size,40);
 assert.ok(economics.every(item=>['micro','macro','trade'].includes(item.topic)));
 assert.ok(finance.every(item=>['income','spending','saving','credit','investing','risk'].includes(item.topic)));
 for(const item of [...economics,...finance])assert.ok(Number.isInteger(item.answer)&&item.choices[item.answer]);
});

test('standard Quiz Bowl rounds do not repeat a question family and rotate across rounds',()=>{
 const firstEconomics=model.selectQuizQuestions(bank,'economics',20,()=>.23),econHistory={ids:[],families:[]};
 econHistory.ids=firstEconomics.map(item=>item.id);econHistory.families=firstEconomics.map(item=>item.family||item.id);
 const secondEconomics=model.selectQuizQuestions(bank,'economics',20,()=>.71,econHistory);
 const firstFinance=model.selectQuizQuestions(bank,'finance',20,()=>.31),financeHistory={ids:firstFinance.map(item=>item.id),families:firstFinance.map(item=>item.family||item.id)};
 const secondFinance=model.selectQuizQuestions(bank,'finance',20,()=>.83,financeHistory);
 for(const round of [firstEconomics,secondEconomics,firstFinance,secondFinance])assert.equal(new Set(round.map(item=>item.family||item.id)).size,20);
 assert.equal(secondEconomics.filter(item=>!econHistory.families.includes(item.family||item.id)).length,20);
 assert.ok(secondEconomics.every(item=>!econHistory.ids.includes(item.id)));
 assert.ok(secondFinance.every(item=>!financeHistory.ids.includes(item.id)&&!financeHistory.families.includes(item.family||item.id)));
});

test('voice answers match answer text, equivalent numeric phrasing, and choice letters cautiously',()=>{
 assert.equal(model.evaluateVoiceAnswer('I think it would increase','Increase',1).status,'match');
 assert.equal(model.evaluateVoiceAnswer('The answer is 220 billion dollars','220 billion dollars',2).status,'match');
 assert.equal(model.evaluateVoiceAnswer('option C','220 billion dollars',2).status,'match');
 assert.equal(model.evaluateVoiceAnswer('option B','220 billion dollars',2).status,'review');
 assert.equal(model.evaluateVoiceAnswer('contact my bank through the official number, not the link','Contact the bank through a known official channel without using the link',2).status,'match');
 assert.equal(model.evaluateVoiceAnswer('I am not sure','Contact the bank through a known official channel without using the link',2).status,'review');
 assert.equal(model.evaluateVoiceAnswer('','Increase',0).status,'empty');
});

test('national practice timing matches the 2026 CEE rules for each challenge',()=>{
 assert.deepEqual(
  {quiz:model.competitionRules.economics.quizSeconds,prep:model.competitionRules.economics.prepMinutes,present:model.competitionRules.economics.presentMinutes,qa:model.competitionRules.economics.qaMinutes},
  {quiz:20,prep:25,present:12,qa:8}
 );
 assert.deepEqual(
  {quiz:model.competitionRules.finance.quizSeconds,prep:model.competitionRules.finance.prepMinutes,present:model.competitionRules.finance.presentMinutes,qa:model.competitionRules.finance.qaMinutes},
  {quiz:20,prep:75,present:8,qa:7}
 );
});

test('narration chooses a natural US English voice and rejects novelty voices',()=>{
 const voices=[
  {name:'Zarvox',lang:'en-US',localService:true},
  {name:'Samantha',lang:'en-US',localService:true},
  {name:'Basic English',lang:'en-GB',localService:true,default:true},
  {name:'Microsoft Aria Online (Natural)',lang:'en-US',localService:false}
 ];
 assert.equal(model.selectNarrationVoice(voices).name,'Microsoft Aria Online (Natural)');
 assert.deepEqual(model.narrationDelivery(model.selectNarrationVoice(voices)),{rate:.98,pitch:1});
 assert.ok(model.narrationVoiceScore(voices[1])>model.narrationVoiceScore(voices[2]));
 assert.equal(model.selectNarrationVoice([]),null);
});
