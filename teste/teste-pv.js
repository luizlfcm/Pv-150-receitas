const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
// Teste de ponta a ponta da PV (Playwright, celular 390x844). Uso: NODE_PATH=$(npm root -g) node teste/teste-pv.js [pasta-das-capturas]
// Le pixel, WhatsApp e mensagem de window.PULSO (index.html): serve para qualquer produto que use este modelo.
const os = require('os'); const ROOT = path.resolve(__dirname, '..'); const SC = process.argv[2] || path.join(os.tmpdir(), 'pv-teste'); fs.mkdirSync(SC, { recursive: true });
const mime = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml' };
const recebidos = [];
const srv = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/ref') { let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ recebidos.push(b); res.writeHead(200,{'access-control-allow-origin':'*'}); res.end('ok'); }); return; }
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; else if (!path.extname(p)) p += '.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let falhas = 0; const ok = (c, m) => { console.log((c?'OK   ':'FALHOU ')+m); if(!c) falhas++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port; const base = 'http://localhost:' + port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1' });
  const pg = await ctx.newPage();
  const eventos = [];
  await pg.route('**/connect.facebook.net/**', r => r.fulfill({ status:200, contentType:'text/javascript', body:'window.__fb_loaded=1;' }));
  await pg.route('**/www.facebook.com/**', r => r.fulfill({ status:200, body:'' }));
  await pg.route('https://wa.me/**', r => r.fulfill({ status:200, contentType:'text/html', body:'<html>wa</html>' }));
  await pg.addInitScript(() => { window.__ev = []; const orig = null; Object.defineProperty(window, 'fbq', { configurable:true, set(v){ window.__fbq = v; }, get(){ return function(){ window.__ev.push(Array.from(arguments)); return window.__fbq && window.__fbq.apply(this, arguments); }; } }); });
  const erros = []; pg.on('pageerror', e => erros.push(String(e))); pg.on('console', m => { if (m.type()==='error') erros.push(m.text()); });
  await pg.goto(base + '/?fbclid=TESTE123&utm_source=fb&ad_id=999', { waitUntil:'networkidle' });
  await new Promise(r => setTimeout(r, 2200)); await pg.screenshot({ path: SC + '/m-dobra.png' });
  await pg.screenshot({ path: SC + '/m-full.png', fullPage:true });
  const w = await pg.evaluate(() => document.documentElement.scrollWidth); ok(w <= 390, 'sem rolagem horizontal no celular (largura ' + w + ')');
  const cfg = await pg.evaluate(() => ({ pixelId: window.PULSO.pixelId, whatsapp: window.PULSO.whatsapp, mensagem: window.PULSO.mensagem }));
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const btn = await pg.$eval('[data-wa]', a => { const r = a.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, href:a.href }; });
  ok(btn.bottom < 844, 'botão aparece na primeira dobra (fundo em ' + Math.round(btn.bottom) + 'px de 844)');
  const m = btn.href.match(new RegExp('^https://wa\\.me/' + cfg.whatsapp + '\\?text=(.+)$')); ok(!!m, 'link do WhatsApp correto');
  const txt = decodeURIComponent(m[1]); ok(new RegExp('^' + esc(cfg.mensagem) + ' \\(ref [A-HJ-NP-Z2-9]{5}\\)$').test(txt), 'mensagem pronta com código: ' + txt);
  const code = txt.match(/ref (\w{5})/)[1];
  const evAntes = await pg.evaluate(() => window.__ev.map(e => e.slice(0,2).join(':')));
  ok(evAntes.includes('init:' + cfg.pixelId) && evAntes.includes('track:PageView') && evAntes.includes('track:ViewContent'), 'pixel: init, PageView e ViewContent ao abrir');
  await pg.evaluate((u) => { window.PULSO.refEndpoint = u; document.cookie = '_fbp=fb.1.111.222'; }, base + '/ref');
  await Promise.all([ pg.waitForURL('https://wa.me/**'), pg.click('[data-wa]') ]);
  await new Promise(r => setTimeout(r, 500));
  ok(recebidos.length === 1, 'código enviado ao endpoint no clique (' + recebidos.length + ')');
  const q = new URLSearchParams(recebidos[0] || '');
  ok(q.get('code') === code && q.get('fbp') === 'fb.1.111.222' && /^fb\.1\.\d+\.TESTE123$/.test(q.get('fbc')) && q.get('utm_source') === 'fb' && q.get('ad_id') === '999' && q.get('fbclid') === 'TESTE123', 'dados do clique: code, fbp, fbc (de fbclid), utm, ad_id');
  // pixel de clique: lido antes da navegação
  const pg2 = await ctx.newPage(); await pg2.route('**/connect.facebook.net/**', r => r.fulfill({ status:200, contentType:'text/javascript', body:'' })); await pg2.route('https://wa.me/**', r => r.fulfill({ status:200, body:'wa' }));
  await pg2.addInitScript(() => { window.__ev = []; Object.defineProperty(window,'fbq',{configurable:true,set(v){window.__q=v;},get(){return function(){window.__ev.push(JSON.stringify(Array.from(arguments)));};}}); });
  await pg2.goto(base + '/', { waitUntil:'networkidle' });
  await pg2.evaluate(() => { document.querySelector('[data-wa]').addEventListener('click', e => e.preventDefault(), true); });
  await pg2.click('[data-wa]');
  const evs = await pg2.evaluate(() => window.__ev);
  const cod2 = (await pg2.$eval('[data-wa]', a => decodeURIComponent(a.href))).match(/ref (\w{5})/)[1];
  ok(evs.some(e => e.includes('"Lead"') && e.includes('lead-' + cod2)) && evs.some(e => e.includes('"Contact"') && e.includes('contact-' + cod2)), 'pixel: Lead e Contact com eventID ligado ao código');
  // sem endpoint: botão funciona e não envia nada
  const n0 = recebidos.length; ok(await pg2.evaluate(()=>{const o=document.getElementById('abrindo');return !o.hidden && o.classList.contains('is-on');}), 'tela "Abrindo o seu WhatsApp" aparece no clique'); await pg2.click('#abrindo-voltar'); ok(await pg2.evaluate(()=>document.getElementById('abrindo').hidden), 'botão Voltar fecha a tela'); await pg2.evaluate(()=>{ window.PULSO.refEndpoint=''; }); await pg2.click('[data-wa]'); ok(recebidos.length === n0, 'sem endpoint configurado: nada é enviado');
  ok(erros.filter(e => !/facebook|ERR_|Failed to load resource/.test(e)).length === 0, 'sem erros de JavaScript (' + erros.join(' | ') + ')');
  // desktop e privacidade
  const d = await b.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:1 }); const pd = await d.newPage(); await pd.route('**/connect.facebook.net/**', r => r.abort());
  await pd.goto(base + '/', { waitUntil:'networkidle' }); await new Promise(r => setTimeout(r, 2200)); await pd.screenshot({ path: SC + '/d-dobra.png' }); await pd.screenshot({ path: SC + '/d-full.png', fullPage:true });
  await pd.goto(base + '/privacidade', { waitUntil:'networkidle' }); ok((await pd.title()).includes('privacidade'), 'página de privacidade abre em /privacidade'); await pd.screenshot({ path: SC + '/d-priv.png' });
  await b.close(); srv.close(); console.log(falhas ? '\nFALHOU ' + falhas : '\nTUDO OK'); process.exit(falhas?1:0);
})();
