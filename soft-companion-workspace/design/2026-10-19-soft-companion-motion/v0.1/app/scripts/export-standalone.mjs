import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist/client');
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)];
for(const match of scripts){let js=await fs.readFile(path.join(root,match[1].replace(/^\//,'')),'utf8');
 for(const file of await fs.readdir(path.join(root,'assets'))){if(!file.endsWith('.png'))continue;const data=await fs.readFile(path.join(root,'assets',file));js=js.replaceAll('/assets/'+file,'data:image/png;base64,'+data.toString('base64'));}
 html=html.replace(match[0],()=>'<script type="module">'+js.replaceAll('</script','<\\/script')+'</script>');}
for(const match of [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){const css=await fs.readFile(path.join(root,match[1].replace(/^\//,'')),'utf8');html=html.replace(match[0],()=>'<style>'+css+'</style>');}
const bundle=path.resolve('../bundle');await fs.mkdir(bundle,{recursive:true});await fs.writeFile(path.join(bundle,'index.html'),html);
await fs.mkdir('public',{recursive:true});await fs.writeFile('public/standalone.html',html);
console.log(JSON.stringify({standalone:path.join(bundle,'index.html'),bytes:Buffer.byteLength(html),externalAssetReferences:/["']\/assets\//.test(html)}));
