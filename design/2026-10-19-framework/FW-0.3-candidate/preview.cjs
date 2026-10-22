const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'bundle');
const allow={'/':'index.html','/index.html':'index.html','/assets/styles.css':'assets/styles.css','/assets/app.js':'assets/app.js'};
http.createServer((req,res)=>{const file=allow[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');fs.createReadStream(path.join(root,file)).pipe(res);}).listen(4176,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4176/ (bundle files only)'));
