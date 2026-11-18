const test=require('node:test'),assert=require('node:assert/strict'),bank=require('../server/question-bank.cjs');
// Independent exact rational oracle: decimal inputs become integers before arithmetic.
const rat=n=>{const [a,b='']=String(n).split('.');return [BigInt(a+b),10n**BigInt(b.length)];};
const add=(a,b)=>[a[0]*b[1]+b[0]*a[1],a[1]*b[1]];
const neg=a=>[-a[0],a[1]],sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>[a[0]*b[0],a[1]*b[1]],div=(a,b)=>[a[0]*b[1],a[1]*b[0]];
const cents=a=>Number((a[0]*200n/a[1]+1n)/2n); // round half up, all exercise values nonnegative
const r=rat,percent=(a,b)=>mul(div(a,b),r(100));
const oracle={
 'tradeoff':p=>div(p.chairs,p.tables),
 'forgone-pay':p=>mul(p.hours,p.wage),
 'real-gdp':p=>percent(p.nominal,p.deflator),
 'inflation':p=>percent(sub(p.after,p.before),p.before),
 'euros-to-dollars':p=>div(mul(p.euros,p.centsPerEuro),r(100)),
 'dollars-to-euros':p=>div(mul(p.dollars,r(100)),p.centsPerEuro),
 'exchange-change':p=>div(mul(p.euros,sub(p.before,p.after)),r(100)),
 'gross-pay':p=>mul(p.hours,p.wage),
 'net-pay':p=>sub(sub(p.gross,p.tax),p.benefits),
 'budget':p=>sub(sub(p.income,p.spending),p.saving),
 'unit-price':p=>div(p.total,p.count),
 'discount':p=>sub(p.price,div(mul(p.price,p.discount),r(100))),
 'simple-saving':p=>div(mul(mul(p.principal,p.rate),p.years),r(100)),
 'compound-saving':p=>{let balance=p.principal;for(let y=0;y<Number(p.years[0]);y++)balance=add(balance,div(mul(balance,p.rate),r(100)));return balance;},
 'saving-goal':p=>div(sub(p.goal,p.saved),p.months),
 'borrowing-cost':p=>sub(mul(p.payments,p.payment),p.principal),
 'compare-loans':p=>sub(mul(p.payments,p.b),mul(p.payments,p.a)),
 'simple-loan':p=>div(mul(mul(p.principal,p.rate),p.months),r(1200)),
 'total-return':p=>percent(sub(add(p.final,p.income),p.initial),p.initial),
 'investment-gain':p=>sub(add(mul(p.shares,p.sold),mul(p.shares,p.dividend)),mul(p.shares,p.paid)),
 'portfolio-share':p=>percent(p.holding,p.total),
 'deductible':p=>{const net=sub(p.loss,p.deductible);return net[0]>0n?net:r(0);},
 'coverage-limit':p=>sub(p.loss,p.limit)[0]>0n?p.limit:p.loss,
 'annual-premium':p=>mul(p.monthly,r(12))
};
test('all 960 variants have exactly one correct displayed answer under exact rational arithmetic',()=>{
 const variants=bank.questions.filter(q=>q.kind==='numerical-variant');assert.equal(variants.length,960);
 assert.equal(new Set(variants.map(q=>q.stem)).size,960);
 for(const q of variants){const params=Object.fromEntries(Object.entries(q.params).map(([k,v])=>[k,r(v)]));const expected=cents(oracle[q.family](params));
 const values=q.choices.map(c=>Math.round(Number(c.replace(/[^\d.-]/g,''))*100));
 assert.equal(values[q.answer],expected,q.id);assert.equal(values.filter(v=>v===expected).length,1,q.id);assert.ok(values.every(v=>v>=0&&Number.isFinite(v)),q.id);
 assert.ok(q.alignment&&q.source&&q.explanation);assert.equal(q.version,1);
 }
 assert.deepEqual(bank.inventory(),{original:57,variants:960,families:24});
});
test('hand-worked anchors, zero payouts, payout caps and fractional-cent rounding',()=>{
 const anchors={'calc-tradeoff-01':'2 chairs','calc-real-gdp-01':'200 billion dollars','calc-inflation-01':'1%','calc-dollars-to-euros-01':'€30.00','calc-compound-saving-01':'$208.08','calc-simple-loan-02':'$10.00','calc-simple-loan-06':'$60.00','calc-simple-loan-13':'$49.58','calc-deductible-01':'$0.00','calc-coverage-limit-01':'$500.00','calc-coverage-limit-21':'$1000.00','calc-total-return-01':'3%'};
 for(const [id,expected] of Object.entries(anchors)){const q=bank.questions.find(q=>q.id===id);assert.equal(q.choices[q.answer],expected,id);}
 // $700 at 6% for 5 months -> $17.50; $900 at 8% for 7 months -> $42.
 for(const [id,value] of [['calc-simple-loan-03','$17.50'],['calc-simple-loan-05','$42.00']]){const q=bank.questions.find(q=>q.id===id);assert.equal(q.choices[q.answer],value);}
});
test('sampling limits session size, varies skills, avoids recent items and never mutates the bank',()=>{
 const original=bank.questions.map(q=>q.id),first=bank.sample(bank.questions,40,[],()=>.25);
 assert.equal(first.length,40);assert.equal(new Set(first.map(q=>q.family||q.id)).size,40);
 for(const count of [10,20,40,1000]){const items=bank.sample(bank.questions,count,first.map(q=>q.id),()=>.5);assert.equal(items.length,Math.min(count,40));assert.ok(items.every(q=>!first.some(p=>p.id===q.id)));assert.equal(new Set(items.map(q=>q.id)).size,items.length);}
 const small=bank.questions.slice(0,3);assert.equal(bank.sample(small,40,small.map(q=>q.id)).length,3);assert.deepEqual(bank.sample([],10),[]);
 assert.deepEqual(bank.questions.map(q=>q.id),original);
 const saving=bank.sample(bank.eligible(['saving']),20);assert.equal(saving.length,20);assert.ok(saving.every(q=>q.topic==='saving'));
});
test('sampling delays recently used question families when fresh families are available',()=>{
 const economics=bank.questions.filter(q=>['micro','macro','trade'].includes(q.topic));
 const first=bank.sample(economics,20,[],()=>.37),historyFamilies=first.map(q=>q.family||q.id);
 const second=bank.sample(economics,20,first.map(q=>q.id),()=>.61,historyFamilies);
 assert.equal(new Set(first.map(q=>q.family||q.id)).size,20);
 assert.equal(new Set(second.map(q=>q.family||q.id)).size,20);
 assert.equal(second.filter(q=>!historyFamilies.includes(q.family||q.id)).length,20);
 assert.ok(second.every(q=>!first.some(previous=>previous.id===q.id)));
});
test('all original pilot records retain IDs, versions and answers for saved attempts',()=>{assert.deepEqual(bank.questions.slice(0,18).map(q=>[q.id,q.version,q.answer]),[1,2,3,0,2,1,0,3,1,2,3,0,2,1,0,3,1,2].map((a,i)=>[`pilot-${String(i+1).padStart(2,'0')}`,1,a]));});
