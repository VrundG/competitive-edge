import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const bank=require('../server/question-bank.cjs');
const safeQuestions=bank.questions.map(({id,version,topic,family,kind,skill,alignment,resource})=>({id,version,topic,family,kind,skill,alignment,resource}));
const payload=JSON.stringify({topics:bank.topics,mapping:bank.mapping,families:bank.families,questions:safeQuestions});
const source=`/* Generated public metadata. Prompts, choices, answers, and explanations remain server-side. */\n(function(root){'use strict';const data=${payload};const shuffle=(items,random=Math.random)=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};const eligible=resourceIds=>{const topics=new Set(resourceIds.flatMap(id=>data.mapping[id]||[]));return data.questions.filter(q=>topics.has(q.topic));};const inventory=(items=data.questions)=>({original:items.filter(q=>q.kind!=='numerical-variant').length,variants:items.filter(q=>q.kind==='numerical-variant').length,families:new Set(items.filter(q=>q.family).map(q=>q.family)).size});const grade=(items,answers)=>items.map(q=>({question:q,correct:Number.isInteger(q.answer)&&answers[q.id]===q.answer}));root.PracticeBank={...data,shuffle,eligible,inventory,grade};})(window);\n`;
fs.writeFileSync('public/practice-catalog.js',source);
console.log(`Generated public question metadata for ${safeQuestions.length} items.`);
