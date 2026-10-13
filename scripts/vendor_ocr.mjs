// Run after npm ci. All OCR runtime and language assets are served from this app.
import {mkdir,copyFile,readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'frontend/public/vendor/ocr');
const manifest=[];
async function copy(source,target){const data=await readFile(path.join(root,'node_modules',source));const output=path.join(dest,target);await mkdir(path.dirname(output),{recursive:true});await copyFile(path.join(root,'node_modules',source),output);manifest.push({file:target,sha256:createHash('sha256').update(data).digest('hex')});}
for(const file of ['tesseract.esm.min.js','worker.min.js'])await copy(`tesseract.js/dist/${file}`,file);
await copy('tesseract.js/LICENSE.md','TESSERACT-LICENSE.md');
for(const file of await readdir(path.join(root,'node_modules/tesseract.js-core')))if(file.endsWith('.wasm.js')||file.endsWith('.wasm')||file==='LICENSE')await copy(`tesseract.js-core/${file}`,`core/${file}`);
for(const lang of ['chi_sim','eng'])await copy(`@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,`lang/${lang}.traineddata.gz`);
await writeFile(path.join(dest,'manifest.json'),JSON.stringify({tesseract:JSON.parse(await readFile(path.join(root,'node_modules/tesseract.js/package.json'),'utf8')).version,languages:'@tesseract.js-data/chi_sim@1.0.0 and eng@1.0.0',source:'https://github.com/naptha/tesseract.js',files:manifest},null,2));
await writeFile(path.join(dest,'LANGUAGE-NOTICE.txt'),'Tesseract language data, Apache License 2.0. Distributed by @tesseract.js-data, derived from tesseract-ocr/tessdata. https://github.com/naptha/tessdata https://github.com/tesseract-ocr/tessdata\n');
console.log(`Vendored ${manifest.length} OCR files.`);
