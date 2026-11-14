// Minimal family-code sync. No accounts: whoever holds the 8-character code can read and write that family's data.
// Fine for a demo; for real users add accounts + encryption before storing health-related data.
const fs=require('fs'),path=require('path');
const FILE=process.env.DATA_FILE||path.join(__dirname,'data.json');
let store={}; try{ store=JSON.parse(fs.readFileSync(FILE,'utf8')); }catch(e){}
let timer=null; const save=()=>{ clearTimeout(timer); timer=setTimeout(()=>fs.writeFile(FILE,JSON.stringify(store),()=>{}),1000); };
const CODE=/^[A-Z2-9]{8}$/;
const ALLOWED=/^(elder|care|inbox|mems|voice|answers|moods|stats|routine|contacts|appts|chips|done:\d{4}-\d{2}-\d{2})$/;
const MAX_VAL=2e6, MAX_FAMILY=10e6;
const hits=new Map();
function limited(ip){ const now=Date.now(),a=(hits.get(ip)||[]).filter(t=>now-t<3.6e6); a.push(now); hits.set(ip,a); return a.length>3000; }
function handle(req,send){
  const u=new URL(req.url,'http://x'), parts=u.pathname.split('/').filter(Boolean);
  const code=parts[2], key=parts[3]?decodeURIComponent(parts[3]):null;
  if(!CODE.test(code||'')) return send(400,{error:'Bad family code'});
  if(limited(req.socket.remoteAddress)) return send(429,{error:'Too many requests'});
  if(req.method==='GET'&&!key){
    const since=+u.searchParams.get('since')||0, fam=store[code]||{}, items={};
    for(const k in fam) if(fam[k].ts>=since) items[k]=fam[k];
    return send(200,{items,now:Date.now()});
  }
  if(req.method==='PUT'&&key&&ALLOWED.test(key)){
    let body=''; req.on('data',c=>{ body+=c; if(body.length>MAX_VAL+1000) req.destroy(); });
    req.on('end',()=>{ try{
      const {v}=JSON.parse(body); if(typeof v!=='string'||v.length>MAX_VAL) return send(413,{error:'Value too large'});
      const fam=store[code]=store[code]||{};
      const others=Object.keys(fam).filter(k=>k!==key).reduce((a,k)=>a+fam[k].v.length,0);
      if(others+v.length>MAX_FAMILY) return send(413,{error:'Storage limit reached'});
      const ts=Math.max(Date.now(),fam[key]?fam[key].ts+1:0); fam[key]={v,ts}; save(); send(200,{ts});
    }catch(e){ send(400,{error:'Bad request'}); } });
    return;
  }
  send(404,{error:'Not found'});
}
module.exports={handle};
