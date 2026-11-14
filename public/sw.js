const C='yaad-v8',CORE=['/','manifest.webmanifest','icon.svg','styles.css','i18n.js','app.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).pathname.startsWith('/api/')) return;
  e.respondWith(caches.open(C).then(async c=>{ const hit=await c.match(e.request);
    const net=fetch(e.request).then(r=>{ if(r&&(r.ok||r.type==='opaque')) c.put(e.request,r.clone()); return r; }).catch(()=>hit);
    return hit||net; }));
});
