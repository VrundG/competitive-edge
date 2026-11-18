const test=require('node:test'),assert=require('node:assert/strict');
const print=require('../public/print-sheet.js'),outlines=require('../public/concept-outlines.js');
const resources=[{id:'supply-demand',title:'Supply and demand',url:'https://econedlink.org/'},{id:'saving',title:'Saving'},{id:'reference',title:'Reference <guide>',description:'Read A & B',source:'CEE',url:'https://example.test/'}];
test('print and download expand only selected concepts and retain references',()=>{
 const html=print.html(resources.slice(0,1)),text=print.text(resources.slice(0,1));
 for(const section of outlines['supply-demand'].sections){assert.ok(text.includes(section.title));for(const point of section.points)assert.ok(text.includes(point));}
 assert.ok(html.includes('<svg'));assert.ok(!html.includes('<h2>Saving</h2>'));assert.ok(html.includes('https://econedlink.org/resources/ms-supply-and-mr-demand/'));
 const fallback=print.html(resources.slice(2));assert.ok(fallback.includes('Reference &lt;guide&gt;'));assert.ok(fallback.includes('no concept outline included'));assert.ok(!fallback.includes('<svg'));
});
test('all ten supported topics contain subtopics and primary learning sources',()=>{assert.equal(Object.keys(outlines).length,10);for(const o of Object.values(outlines)){assert.ok(o.sections.length>=2);assert.ok(o.sections.every(s=>s.title&&s.points.length));assert.ok(o.sources.every(s=>/^https:\/\/(www\.)?(councilforeconed.org|econedlink.org)\//.test(s.url)));}});
