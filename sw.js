/* Cache sendiri: kunjungan kedua terasa instan & bisa offline. Ganti V saat kamu update file. */
const V='myzulll-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(['./','lentera-bg.js','manifest.webmanifest','icon-192.png'].map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||(u.origin!==location.origin&&!/fonts\.(googleapis|gstatic)\.com$/.test(u.host)))return;
 e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r),net=fetch(r).then(res=>{if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}).catch(()=>hit);return hit||net}))});
