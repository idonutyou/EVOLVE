'use strict';
const base=new URL('./',self.registration.scope),NAME='evolve-original-assets-v1:'+base.pathname;
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==base.origin||!u.pathname.startsWith(base.pathname+'assets/')||!/\/[a-f0-9]{64}\.[a-z0-9]+$/.test(u.pathname))return;
  e.respondWith((async()=>{let cache;try{cache=await caches.open(NAME);const old=await cache.match(r);if(old)return old;}catch(_){}const result=await fetch(r);if(cache&&result.ok&&result.status===200)e.waitUntil(cache.put(r,result.clone()).catch(()=>{}));return result;})());
});
