// ======================= Меню паузы, «Об игре», энциклопедия-книга, салют победы =======================
const gameWrapEl = document.getElementById('gameWrap');
function uiSync(){ const st = gameState; if(gameWrapEl.dataset.st!==st) gameWrapEl.dataset.st = st; }
setInterval(uiSync, 120); uiSync();

// ---------- меню паузы ----------
const pauseScreen = document.createElement('div');
pauseScreen.id = 'pauseScreen'; pauseScreen.className = 'overlay hidden'; gameWrapEl.appendChild(pauseScreen);
let pauseOpen = false;
function closePause(){ if(!pauseOpen) return; pauseOpen = false; pauseScreen.classList.add('hidden'); if(gameState==='dialog') gameState = 'playing'; for(const k in keys) keys[k] = false; }
function openPause(){
  if(gameState!=='playing' || pauseOpen) return;
  pauseOpen = true; for(const k in keys) keys[k] = false; gameState = 'dialog';
  pauseScreen.innerHTML = '<h2>Меню</h2>';
  const grid = document.createElement('div'); grid.className = 'btnRow menuGrid';
  const add = (label, fn, cls)=>{ const b = document.createElement('button'); b.className = 'startBtn'+(cls||''); b.textContent = label; b.addEventListener('click', ()=>{ closePause(); fn(); }); grid.appendChild(b); };
  add('▶ Продолжить', ()=>{});
  add('📜 Журнал', ()=>questBtn.click());
  add('🎒 Герой'+(player.sp>0 ? ' ★' : ''), ()=>heroBtn.click());
  add('📖 Энциклопедия', ()=>codexBtn.click());
  add(SFX.muted ? '🔇 Звук выкл.' : '🔊 Звук вкл.', ()=>soundBtn.click());
  add(document.fullscreenElement || document.webkitFullscreenElement ? '🗗 Окно' : '⛶ Полный экран', ()=>fullscreenBtn.click());
  add('🚪 Выйти в меню', ()=>menuBtn.click());
  pauseScreen.appendChild(grid); pauseScreen.classList.remove('hidden');
}
document.getElementById('pauseBtn').addEventListener('click', openPause);
window.addEventListener('keydown', e=>{ if(e.code==='Escape'){ if(gameState==='playing') openPause(); else if(pauseOpen) closePause(); } });

// ---------- «Об игре» ----------
const aboutScreen = document.createElement('div');
aboutScreen.id = 'aboutScreen'; aboutScreen.className = 'overlay hidden'; gameWrapEl.appendChild(aboutScreen);
document.getElementById('aboutBtn').addEventListener('click', ()=>{
  startScreenEl.classList.add('hidden');
  aboutScreen.innerHTML = '<div class="scroll"><div class="scrollIn"><h2>Об игре</h2><div id="aboutBody">'+document.getElementById('introText').innerHTML+'</div><div class="btnRow"><button class="startBtn" id="aboutBack">Назад</button></div></div></div>';
  aboutScreen.classList.remove('hidden');
  document.getElementById('aboutBack').addEventListener('click', ()=>{ aboutScreen.classList.add('hidden'); startScreenEl.classList.remove('hidden'); });
});

// ---------- энциклопедия: раскрытая книга ----------
let codexSpread = 0;
function codexEntries(){
  const c = codexEnsure(), out = [];
  if(codexTab==='enemies'){
    for(const k of Object.keys(ENEMY_INFO)) if(c.e[k]){
      const I = ENEMY_INFO[k], B = ENEMY_BASE[k];
      out.push({i:I[0], t:I[1], d:I[3], w:'Где: '+I[2], s:'Здоровье ≈'+B.hp+' · урон ≈'+B.dmg+(B.shoot ? ' · стреляет' : '')+' · побеждено: '+(c.k[k]||0), col:BOSS_TYPES.includes(k) ? '#a02a10' : null});
    }
  } else {
    for(const k of Object.keys(ARTIFACT_INFO)) if(c.a[k]) out.push({i:c.a[k].i, t:c.a[k].n, d:c.a[k].d, w:'', s:'', col:null});
    for(const k of Object.keys(c.a)) if(!ARTIFACT_INFO[k]) out.push({i:c.a[k].i, t:c.a[k].n, d:c.a[k].d, w:'', s:'', col:c.a[k].c});
  }
  return out;
}
function renderCodex(dir){
  const c = codexEnsure(), enemyKeys = Object.keys(ENEMY_INFO), artKeys = Object.keys(ARTIFACT_INFO);
  const eN = enemyKeys.filter(k=>c.e[k]).length, dyn = Object.keys(c.a).filter(k=>!ARTIFACT_INFO[k]), aN = artKeys.filter(k=>c.a[k]).length + dyn.length;
  codexTabsEl.innerHTML = '';
  [['enemies','👾 Враги ('+eN+'/'+enemyKeys.length+')'],['arts','✦ Артефакты ('+aN+(dyn.length?'':'/'+artKeys.length)+')']].forEach(([id,label])=>{
    const t = document.createElement('button'); t.className = 'tabBtn'+(codexTab===id?' active':''); t.textContent = label;
    t.addEventListener('click', ()=>{ codexTab = id; codexSpread = 0; renderCodex(); }); codexTabsEl.appendChild(t);
  });
  const list = codexEntries(), spreads = Math.max(1, Math.ceil(list.length/2));
  codexSpread = Math.min(Math.max(0, codexSpread), spreads-1);
  document.getElementById('codexInfo').textContent = 'Открыто записей: '+(codexTab==='enemies' ? eN+' из '+enemyKeys.length : aN);
  const book = document.getElementById('codexBook'); book.innerHTML = '';
  const page = (e, side, n)=>{
    const p = document.createElement('div'); p.className = 'pg '+side+(dir ? (dir>0 ? (side==='r' ? ' flipR' : '') : (side==='l' ? ' flipL' : '')) : '');
    if(e){
      p.innerHTML = '<div class="ic"></div><div class="tt"></div><div class="ds"></div>'+(e.w ? '<div class="ds" style="font-style:italic"></div>' : '')+(e.s ? '<div class="st"></div>' : '')+'<div class="pn"></div>';
      const q = p.children; q[0].textContent = e.i; q[1].textContent = e.t; if(e.col) q[1].style.color = e.col; q[2].textContent = e.d;
      let k = 3; if(e.w) q[k++].textContent = e.w; if(e.s) q[k++].textContent = e.s; q[k].textContent = '— '+n+' —';
    } else p.innerHTML = '<div class="ic" style="opacity:.35">'+(list.length ? '✒' : '📖')+'</div><div class="ds" style="opacity:.6">'+(list.length ? 'Страница ждёт новых записей.' : 'Книга пока пуста — исследуйте мир, и записи появятся здесь.')+'</div>';
    return p;
  };
  const sp = document.createElement('div'); sp.className = 'spine';
  book.append(page(list[codexSpread*2], 'l', codexSpread*2+1), sp, page(list[codexSpread*2+1], 'r', codexSpread*2+2));
  let nav = document.getElementById('codexNav');
  if(!nav){ nav = document.createElement('div'); nav.id = 'codexNav'; book.after(nav); }
  nav.innerHTML = '';
  const mk = (txt, d, off)=>{ const b = document.createElement('button'); b.className = 'tabBtn'; b.textContent = txt; b.disabled = off; if(off) b.style.opacity = '.4'; else b.addEventListener('click', ()=>{ codexSpread += d; renderCodex(d); SFX.play('click'); }); return b; };
  const lab = document.createElement('span'); lab.style.cssText = 'color:#e0c23a;font-weight:bold;font-size:13px'; lab.textContent = (codexSpread+1)+' / '+spreads;
  nav.append(mk('◀ Назад', -1, codexSpread<=0), lab, mk('Вперёд ▶', 1, codexSpread>=spreads-1));
}
(function swipe(){
  let x0 = null; const book = document.getElementById('codexBook');
  book.addEventListener('pointerdown', e=>{ x0 = e.clientX; });
  book.addEventListener('pointerup', e=>{ if(x0===null) return; const dx = e.clientX-x0; x0 = null; if(Math.abs(dx)>50){ const nav = document.getElementById('codexNav'); if(nav){ const bs = nav.querySelectorAll('button'); (dx<0 ? bs[1] : bs[0]).click(); } } });
})();

// ---------- салют на экране победы ----------
const fwCanvas = document.createElement('canvas'); fwCanvas.id = 'fireworks';
const winEl = document.getElementById('winScreen'); winEl.insertBefore(fwCanvas, winEl.firstChild);
let fwRun = false, fwParts = [], fwT = 0;
function fwBurst(x, y){
  const hue = Math.random()*360, n = 46+((Math.random()*24)|0), kind = Math.random();
  for(let i=0;i<n;i++){
    const a = i/n*Math.PI*2 + Math.random()*0.1, sp = (kind<0.3 ? 120 : 70+Math.random()*130);
    fwParts.push({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1.2+Math.random()*0.8, t:0, hue:(hue+(kind>0.7 ? Math.random()*80 : 0))%360, sz:1.6+Math.random()*1.6});
  }
  fwParts.push({x, y, vx:0, vy:0, life:0.25, t:0, hue:50, sz:14, flash:true});
}
function fwLoop(){
  if(winEl.classList.contains('hidden')){ fwRun = false; fwParts.length = 0; return; }
  requestAnimationFrame(fwLoop);
  const r = winEl.getBoundingClientRect(), W = Math.max(1, r.width|0), H = Math.max(1, r.height|0);
  if(fwCanvas.width!==W || fwCanvas.height!==H){ fwCanvas.width = W; fwCanvas.height = H; }
  const g = fwCanvas.getContext('2d'), dt = 1/60; fwT -= dt;
  if(fwT<=0){ fwT = 0.35+Math.random()*0.55; fwBurst(W*(0.12+Math.random()*0.76), H*(0.12+Math.random()*0.5)); if(Math.random()<0.35) fwBurst(W*Math.random(), H*(0.1+Math.random()*0.4)); }
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0,0,W,H);
  g.globalCompositeOperation = 'lighter';
  for(let i=fwParts.length-1;i>=0;i--){
    const p = fwParts[i]; p.t += dt; if(p.t>=p.life){ fwParts.splice(i,1); continue; }
    const k = 1-p.t/p.life;
    if(p.flash){ g.fillStyle = 'rgba(255,240,200,'+(0.28*k)+')'; g.beginPath(); g.arc(p.x,p.y,p.sz*(0.8+p.t*14),0,6.283); g.fill(); continue; }
    p.vy += 90*dt; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx*dt; p.y += p.vy*dt;
    g.fillStyle = 'hsla('+p.hue+',100%,'+(55+20*k)+'%,'+k+')'; g.beginPath(); g.arc(p.x,p.y,p.sz*(0.5+k*0.7),0,6.283); g.fill();
  }
}
new MutationObserver(()=>{ if(!winEl.classList.contains('hidden') && !fwRun){ fwRun = true; fwT = 0; requestAnimationFrame(fwLoop); } }).observe(winEl, {attributes:true, attributeFilter:['class']});
