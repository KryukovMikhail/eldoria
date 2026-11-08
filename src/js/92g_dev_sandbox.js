// ======================= Панель производительности (F3) и режим песочницы =======================
// F3 (или «Панель FPS» в настройках) показывает FPS, время обновления и отрисовки кадра и число объектов.
// Песочница (в настройках): герой бессмертен, всё снаряжение открыто, в меню паузы — кнопки для проверки уровней.
const PERF_N = 90;
const PERF = { on:false, i:0, n:0, fr:new Float32Array(PERF_N), up:new Float32Array(PERF_N), dr:new Float32Array(PERF_N) };
if(SET.perf===undefined) SET.perf = false;
if(SET.sandbox===undefined) SET.sandbox = false;
(function(){ try{ const o = JSON.parse(localStorage.getItem(SET_KEY)); if(o){ if(typeof o.perf==='boolean') SET.perf = o.perf; if(typeof o.sandbox==='boolean') SET.sandbox = o.sandbox; } }catch(e){} })();
function perfShown(){ return PERF.on || !!SET.perf; }
function perfRec(frameMs, upMs, drMs){
  const i = PERF.i; PERF.fr[i] = frameMs; PERF.up[i] = upMs; PERF.dr[i] = drMs;
  PERF.i = (i+1)%PERF_N; PERF.n = Math.min(PERF_N, PERF.n+1);
}
function perfStats(){
  const n = PERF.n; if(!n) return {fps:0, low:0, up:0, dr:0};
  let fr = 0, up = 0, dr = 0, worst = 0;
  for(let i=0;i<n;i++){ fr += PERF.fr[i]; up += PERF.up[i]; dr += PERF.dr[i]; if(PERF.fr[i]>worst) worst = PERF.fr[i]; }
  return { fps: fr>0 ? 1000*n/fr : 0, low: worst>0 ? 1000/worst : 0, up: up/n, dr: dr/n };
}
function perfCounts(){
  const alive = loc ? loc.enemies.filter(e=>e.hp>0).length : 0;
  return { enemies:alive, shots:eshots.length+arrows.length, parts:particles.length, items:loc ? loc.items.length : 0, party:partyAlive().length };
}
function drawPerf(){
  if(!perfShown() || gameState==='start' || !loc) return;
  const s = perfStats(), c = perfCounts();
  const lines = [
    ['FPS '+s.fps.toFixed(0)+'  (мин. '+s.low.toFixed(0)+')', s.fps>=50 ? '#7fe07f' : s.fps>=30 ? '#ffd34a' : '#ff6a5a'],
    ['Обновление '+s.up.toFixed(2)+' мс', s.up<4 ? '#cfe8ff' : '#ffb08a'],
    ['Отрисовка '+s.dr.toFixed(2)+' мс', s.dr<10 ? '#cfe8ff' : '#ffb08a'],
    ['Враги '+c.enemies+' · снаряды '+c.shots, '#e8dcc0'],
    ['Частицы '+c.parts+' · предметы '+c.items, '#e8dcc0'],
    ['Карта '+loc.width+'×'+loc.height+' · '+currentLocId+(loc.wild ? ' '+loc.wild.rx+','+loc.wild.ry : ''), '#e8dcc0'],
    ['Качество: '+(QLEVELS[quality] ? QLEVELS[quality].name : quality)+(autoQ ? ' (авто)' : '')+' · отряд '+c.party, '#e8dcc0']
  ];
  const x = UI.l+8, w = 214, lh = 14, h = lines.length*lh+10, y = Math.max(UI.t+hudH()+26, Math.round(canvas.height*0.45)-h/2);
  ctx.save(); ctx.fillStyle = 'rgba(8,10,14,0.72)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(160,200,255,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
  ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((l,i)=>{ ctx.fillStyle = l[1]; ctx.fillText(l[0], x+6, y+5+i*lh); });
  // график времени кадра: зелёная линия — 60 FPS
  const gx = x+w+4, gw = 90, gh = 40;
  ctx.fillStyle = 'rgba(8,10,14,0.6)'; ctx.fillRect(gx, y, gw, gh);
  ctx.strokeStyle = 'rgba(127,224,127,0.6)'; ctx.beginPath(); ctx.moveTo(gx, y+gh-16.7*gh/50); ctx.lineTo(gx+gw, y+gh-16.7*gh/50); ctx.stroke();
  ctx.strokeStyle = '#ffd34a'; ctx.beginPath();
  for(let k=0;k<PERF.n;k++){ const i = (PERF.i-PERF.n+k+PERF_N)%PERF_N, px = gx+k*gw/PERF_N, py = y+gh-Math.min(50,PERF.fr[i])*gh/50; if(k) ctx.lineTo(px,py); else ctx.moveTo(px,py); }
  ctx.stroke(); ctx.restore();
}
window.addEventListener('keydown', e=>{ if(e.code==='F3'){ e.preventDefault(); PERF.on = !PERF.on; } });

// ---------- песочница ----------
function sandboxOn(){ return !!SET.sandbox; }
function devTick(dt){
  if(!sandboxOn()) return;
  if(player.hp<player.maxHp) player.hp = player.maxHp;
  player.fx.burn = 0; player.fx.poison = 0;
}
function drawSandboxTag(){
  if(!sandboxOn() || gameState==='start') return;
  ctx.save(); ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const t = '🧪 ПЕСОЧНИЦА', w = ctx.measureText(t).width+14, x = UI.l+10, y = UI.t+hudH()+2;
  ctx.fillStyle = 'rgba(60,20,90,0.75)'; ctx.fillRect(x, y, w, 16); ctx.fillStyle = '#e8c8ff'; ctx.fillText(t, x+7, y+2); ctx.restore();
}
const sandboxScreen = document.createElement('div');
sandboxScreen.id = 'sandboxScreen'; sandboxScreen.className = 'overlay hidden'; gameWrapEl.appendChild(sandboxScreen);
function closeSandbox(){ sandboxScreen.classList.add('hidden'); if(gameState==='sandbox') gameState = 'playing'; for(const k in keys) keys[k] = false; }
const SANDBOX_ACTS = [
  ['◆ +1000 золота', ()=>{ player.gold += 1000; return '+1000 золота'; }],
  ['★ +1 уровень', ()=>{ player.xp = player.xpNext; while(player.xp>=player.xpNext) playerLevelUp(); return 'Уровень '+player.level; }],
  ['⚔ Всё оружие и броня', ()=>{ for(const k in WEAPONS) player.owned[k] = true; for(const k in ARMORS) player.ownedArmor[k] = true; return 'Всё оружие и броня в инвентаре — выбирайте в лавке'; }],
  ['⚗ Эликсиры и зелья', ()=>{ player.potions = POTION_MAX; for(const k of ELIX_KEYS) player.elix[k] = ELIX_MAX; return 'Сумка эликсиров и зелий полна'; }],
  ['☠ Победить врагов вокруг', ()=>{ let n = 0; const pcx = player.x+player.w/2, pcy = player.y+player.h/2; for(const e of loc.enemies.slice()) if(e.hp>0 && Math.hypot(e.x-pcx, e.y-pcy)<700){ e.hp = 0; killEnemy(e); n++; } return 'Побеждено врагов: '+n; }],
  ['🗺 В Дикие земли', ()=>{ wildEnter(); return null; }],
  ['🏠 На поверхность', ()=>{ const ow = world.overworld; goTo('overworld', ow.spawn.x, ow.spawn.y, 'Вы на поверхности'); return null; }]
];
function openSandbox(msg){
  if(gameState!=='playing' && gameState!=='sandbox') return;
  gameState = 'sandbox'; for(const k in keys) keys[k] = false;
  sandboxScreen.innerHTML = '<h2>🧪 Песочница</h2><p style="font-size:13px;color:#cbb8e8;max-width:440px;margin:0 0 8px">Герой бессмертен, всё снаряжение открыто. Режим выключается в настройках главного меню.</p>';
  if(msg){ const m = document.createElement('p'); m.style.cssText = 'color:#ffd34a;font-size:13px;margin:0 0 6px'; m.textContent = msg; sandboxScreen.appendChild(m); }
  const grid = document.createElement('div'); grid.className = 'btnRow menuGrid';
  for(const [label, fn] of SANDBOX_ACTS){
    const b = document.createElement('button'); b.className = 'startBtn'; b.textContent = label;
    b.addEventListener('click', ()=>{ const r = fn(); saveGame(); if(r===null) closeSandbox(); else openSandbox(r); });
    grid.appendChild(b);
  }
  const back = document.createElement('button'); back.className = 'startBtn'; back.textContent = '▶ Продолжить'; back.addEventListener('click', closeSandbox); grid.appendChild(back);
  sandboxScreen.appendChild(grid); sandboxScreen.classList.remove('hidden');
}
