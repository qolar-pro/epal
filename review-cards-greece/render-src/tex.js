const { chromium } = require('/opt/node-tools/node_modules/playwright');
const store = require('/home/user/epal/review-cards-greece/config.js');
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1800,height:2600},deviceScaleFactor:1});
 await p.goto('http://localhost:4173/'); await p.waitForTimeout(500);
 await p.addStyleTag({content:`body{background:#fff;margin:0} .ribbon,.gnav,main,footer{display:none!important}
  #texhost{position:fixed;left:0;top:0;z-index:99}
  #texhost .prod3d{transform:none!important;box-shadow:none!important;border-radius:0!important;transition:none!important;aspect-ratio:auto!important;margin:0!important;overflow:hidden;background:var(--bg)!important}
  #texhost .sheen{display:none!important}
  #texhost .p-stand .panel{inset:0!important;border-radius:0!important;box-shadow:none!important;background:var(--bg)!important;padding:9% 9% 7%!important}
  #texhost .p-stand .base{display:none!important}
  #texhost .p-sticker{border-radius:0!important;padding:8%!important}`});
 const sizes={card:[1370,864],stand:[1680,2368],sticker:[800,800]};
 for (const [sku,[w,h]] of Object.entries(sizes)) for (const c of store.colors) {
   await p.evaluate(({sku,w,h,c})=>{ let host=document.getElementById('texhost'); if(host) host.remove(); host=document.createElement('div'); host.id='texhost'; document.body.appendChild(host);
     const n=document.createElement('div'); host.appendChild(n); n.style.width=w+'px'; n.style.height=h+'px';
     Designer.paint(n,sku,{name:'Καφέ Αστέρι',color:c.id,qr:Designer.encode('https://search.google.com/local/writereview?placeid=ChIJExample123')}); n.style.width=w+'px'; n.style.height=h+'px'; },{sku,w,h,c});
   await p.waitForTimeout(80);
   await p.locator('#texhost .prod3d').screenshot({path:`tex/${sku}-${c.id}.png`});
 }
 // phone screen UI (generic, no logos)
 await p.evaluate(()=>{ let host=document.getElementById('texhost'); if(host) host.remove(); host=document.createElement('div'); host.id='texhost'; document.body.appendChild(host);
   host.innerHTML='<div style="width:1080px;height:2340px;background:#f6f7f9;font-family:Segoe UI,Arial,sans-serif;color:#1d1d1f;padding:150px 80px;box-sizing:border-box;text-align:center;display:flex;flex-direction:column;align-items:center;gap:36px"><div style="width:180px;height:180px;border-radius:50%;background:#0f3d2e;color:#fff;font-size:92px;display:grid;place-items:center;font-weight:700">Κ</div><div style="font-size:64px;font-weight:700">Καφέ Αστέρι</div><div style="font-size:44px;color:#6e6e73">Πώς ήταν η εμπειρία σου;</div><div style="font-size:120px;letter-spacing:16px;color:#f5b301;margin-top:30px">★★★★★</div><div style="margin-top:50px;width:100%;height:260px;border-radius:30px;background:#fff;border:3px solid #d9dbe0;font-size:42px;color:#9a9aa0;text-align:left;padding:36px">Γράψε μια κριτική…</div><div style="margin-top:40px;background:#0071e3;color:#fff;font-size:50px;font-weight:600;padding:36px 120px;border-radius:999px">Δημοσίευση</div></div>'; });
 await p.locator('#texhost > div').screenshot({path:'tex/screen.png'});
 await b.close(); console.log('textures done');})();
