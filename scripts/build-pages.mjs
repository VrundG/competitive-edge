import fs from 'node:fs';
import path from 'node:path';
import './generate-question-catalog.mjs';

const output='pages-dist';
fs.rmSync(output,{recursive:true,force:true});
fs.cpSync('public',output,{recursive:true});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
fs.copyFileSync(path.join(output,'index.html'),path.join(output,'404.html'));
console.log('Built the public GitHub Pages frontend in pages-dist/.');
