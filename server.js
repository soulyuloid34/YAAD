// Run: ANTHROPIC_API_KEY=... node server.js   (Node 18+, no npm install needed)
const http=require('http'),fs=require('fs'),path=require('path');
try{ fs.readFileSync(path.join(__dirname,'.env'),'utf8').split('\n').forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if(m&&!process.env[m[1]]) process.env[m[1]]=m[2];}); }catch(e){}
const {generate}=require('./generate');
const sync=require('./sync');
const hits=new Map(); // naive per-IP limit: 20 requests per hour
function limited(ip){const now=Date.now(),a=(hits.get(ip)||[]).filter(t=>now-t<3.6e6);a.push(now);hits.set(ip,a);return a.length>20;}
http.createServer(async(req,res)=>{
  const send=(c,o,t='application/json')=>{res.writeHead(c,{'content-type':t,'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,OPTIONS','access-control-allow-headers':'content-type'});res.end(typeof o==='string'||Buffer.isBuffer(o)?o:JSON.stringify(o));};
  if(req.method==='OPTIONS') return send(204,'');
  if(req.url.startsWith('/api/sync/')) return sync.handle(req,send);
  if(req.method==='POST'&&req.url==='/api/activity'){
    if(limited(req.socket.remoteAddress)) return send(429,{error:'Too many requests. Try again later.'});
    let body='';
    for await(const c of req){ body+=c; if(body.length>10000) return send(413,{error:'Request too large'}); }
    try{ send(200,await generate(JSON.parse(body||'{}'))); }
    catch(e){ send(e.status||500,{error:e.message}); }
    return;
  }
  if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html'))
    return send(200,fs.readFileSync(path.join(__dirname,'public','index.html')),'text/html; charset=utf-8');
  const f={'/manifest.webmanifest':['application/manifest+json'],'/icon.svg':['image/svg+xml'],'/sw.js':['text/javascript'],'/app.js':['text/javascript'],'/i18n.js':['text/javascript'],'/styles.css':['text/css']}[req.url];
  if(f) return send(200,fs.readFileSync(path.join(__dirname,'public',req.url.slice(1))),f[0]);
  send(404,{error:'Not found'});
}).listen(process.env.PORT||3000,()=>console.log('YAAD running on http://localhost:'+(process.env.PORT||3000)));
