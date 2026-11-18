const test=require('node:test'),assert=require('node:assert/strict'),profile=require('../public/learning-profile.js'),map=require('../public/learning-map-model.js'),resources=(()=>{global.window={};require('../public/resources.js');return window.RESOURCES;})();

test('learning map groups each challenge into its official preparation areas',()=>{
 const economics=map.groups(profile.skillsFor('economics'),'economics'),finance=map.groups(profile.skillsFor('finance'),'finance');
 assert.deepEqual(economics.map(group=>group.name),['Microeconomics','Macroeconomics','International Economics']);
 assert.deepEqual(finance.map(group=>group.name),['Earning income','Spending','Saving','Managing credit','Investing','Managing risk']);
 assert.equal(economics.flatMap(group=>group.skills).length,8);assert.equal(finance.flatMap(group=>group.skills).length,23);
});

test('international economics headings use title capitalization',()=>{
 const international=map.groups(profile.skillsFor('economics'),'economics').find(group=>group.id==='trade');
 assert.equal(international.name,'International Economics');
 assert.deepEqual(international.skills.map(skill=>skill.label),['Currency Conversion to Dollars','Currency Conversion to Euros','Exchange-Rate Price Changes']);
 assert.equal(resources.find(item=>item.id==='exchange').title,'Exchange Rates: How Money Affects Trade');
});

test('diagnostic gate unlocks only the completed challenge, including a just-submitted attempt',()=>{
 assert.equal(map.hasDiagnostic({economics:null,finance:null},'economics'),false);
 assert.equal(map.hasDiagnostic({economics:'2026-10-06',finance:null},'economics'),true);
 assert.equal(map.hasDiagnostic({economics:'2026-10-06',finance:null},'finance'),false);
 assert.equal(map.hasDiagnostic({},'finance',{mode:'diagnostic',track:'finance',submitted:true}),true);
 assert.equal(map.hasDiagnostic({},'finance',{mode:'review',track:'finance',submitted:true}),false);
 assert.equal(map.hasDiagnostic({},'finance',null,[{mode:'diagnostic',track:'finance'}]),true);
 assert.equal(map.hasDiagnostic({},'economics',null,[{mode:'diagnostic',track:'finance'}]),false);
});

test('evidence states use transparent labels without claiming mastery',()=>{
 assert.deepEqual(map.displayState({state:'review'}),{key:'needs-review',label:'Needs review'});
 assert.deepEqual(map.displayState({state:'check'}),{key:'needs-review',label:'Needs review'});
 assert.deepEqual(map.displayState({state:'positive'}),{key:'strong',label:'Strong recent evidence'});
 assert.equal(map.displayState({state:'unseen'}).label,'Not started');
});

test('skill resources stay within the selected challenge and include official preparation links',()=>{
 const economics=map.relatedResources(profile.skillsFor('economics')[0],'economics',resources),finance=map.relatedResources(profile.skillsFor('finance')[0],'finance',resources);
 assert.ok(economics.length>=4&&economics.every(item=>['economics','both'].includes(item.track)));
 assert.ok(finance.length>=4&&finance.every(item=>['finance','both'].includes(item.track)));
 assert.ok(economics.some(item=>item.type==='Practice'));assert.ok(finance.some(item=>item.type==='Practice'));
});
