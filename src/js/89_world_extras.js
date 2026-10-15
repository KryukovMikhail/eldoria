// ======================= Мир: погода влияет на игру, бочки и ящики, ловушки, мосты и броды, зоны боссов =======================
const hazards = [];                       // круги на земле: {x,y,r,t,dur,dps,kind}; t<0 — предупреждение
const bolts = [];                         // молнии грозы: {x,y,r,t,dur}
const wxNoted = {};
let hazAcc = 0;

// ---------- погода ----------
function wxName(){
  if(!OUTDOOR[currentLocId]) return 'clear';
  const b = env.b[currentLocId];
  return b && b.amt>0.5 ? b.name : 'clear';
}
function weatherSpeedMul(){ const w = wxName(); return w==='snow' ? 0.92 : w==='blizzard' ? 0.82 : w==='sand' ? 0.9 : 1; }
function weatherAggroMul(){ const w = wxName(); return ({fog:0.7, rain:0.9, storm:0.85, blizzard:0.85, sand:0.8})[w] || 1; }
function weatherShootMul(){ const w = wxName(); return ({fog:0.6, rain:0.9, storm:0.85, blizzard:0.8, sand:0.8})[w] || 1; }
const WX_NOTE = {
  rain:'🌧 Дождь гасит огонь: горение быстро проходит, огненные круги тают',
  storm:'⛈ Гроза: красные круги на земле — удар молнии. Отойдите, пока она не ударила',
  fog:'🌫 Туман скрывает вас: враги замечают с меньшего расстояния, стрелки бьют ближе',
  snow:'❄ Снег замедляет шаг',
  blizzard:'🌨 Метель: тяжело идти, враги вас почти не видят',
  sand:'🌪 Песчаная буря: шаг медленнее, враги видят хуже'
};
let wxBoltCd = 6;
function weatherTick(dt){
  const w = wxName(); if(w==='clear') return;
  if(!wxNoted[w] && WX_NOTE[w]){ wxNoted[w] = 1; addNote(WX_NOTE[w], '#9fd0ff'); }
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(w==='rain' || w==='storm'){
    if(player.fx.burn>0 && (player.fx.burn -= dt*1000*3) <= 0){ player.fx.burn = 0; addNote('🌧 Дождь потушил огонь', '#9fd8ff'); }
    for(const e of loc.enemies){
      if(e.dot && e.dot.fire && e.hp>0){ e.dot = null; burst(e.x+e.w/2, e.y+e.h/2, 6, {colors:['#dfe8f0','#aab8c8','#ffffff'], sp:40, up:30, g:-50, life:520, size:2.4}); }
    }
  }
  if(w==='storm'){
    wxBoltCd -= dt;
    if(wxBoltCd<=0){
      wxBoltCd = 7+Math.random()*8;
      let x, y;
      const near = loc.enemies.filter(e=>e.hp>0 && Math.hypot(e.x-pcx,e.y-pcy)<360);
      if(near.length && Math.random()<0.4){ const e = near[rnd(0,near.length-1)]; x = e.x+e.w/2; y = e.y+e.h/2; }
      else { const a = Math.random()*6.283, r = 40+Math.random()*150; x = pcx+Math.cos(a)*r; y = pcy+Math.sin(a)*r; }
      bolts.push({x, y, r:40, t:-1000, dur:0});
    }
  }
}
function boltsTick(dt){
  const ms = dt*1000;
  for(let i=bolts.length-1;i>=0;i--){
    const b = bolts[i]; b.t += ms;
    if(!b.hit && b.t>=0){
      b.hit = true; env.flash = 1; env.thunderIn = 0.12; SFX.play('bolt');
      shakeT = Math.max(shakeT, 240);
      burst(b.x, b.y, 22, {colors:['#ffffff','#cfe4ff','#ffe89a'], sp:160, up:40, g:80, life:480, size:3});
      const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
      if(Math.hypot(pcx-b.x, pcy-b.y) < b.r) hurtPlayer(Math.max(8, Math.round(player.maxHp*0.12)));
      for(const e of loc.enemies){
        if(e.hp<=0) continue;
        if(Math.hypot(e.x+e.w/2-b.x, e.y+e.h/2-b.y) < b.r+e.w/2){ e.hp -= Math.max(30, e.maxHp*0.2); e.hitFlash = 200; if(e.hp<=0) killEnemy(e); }
      }
    }
    if(b.t>=260) bolts.splice(i,1);
  }
}

// ---------- зоны на земле ----------
function hazardHurt(d){
  if(player.dashT>0 || gameState!=='playing') return;
  hazAcc += d;
  if(hazAcc>=1){
    const n = Math.floor(hazAcc); hazAcc -= n;
    player.hp -= Math.max(1, Math.round(n*(player.shield>0 ? 0.3 : 1)*(player.buff.guard>0 ? 0.6 : 1)));
    player.hitFlash = Math.max(player.hitFlash||0, 90);
    if(player.hp<=0){ player.hp = 0; onPlayerDeath(); }
  }
}
function hazardsTick(dt){
  const ms = dt*1000, w = wxName(), rain = w==='rain' || w==='storm';
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(let i=hazards.length-1;i>=0;i--){
    const h = hazards[i];
    h.t += ms*(h.kind==='fire' && rain && h.t>=0 ? 2.2 : 1);
    if(h.t>=h.dur){ hazards.splice(i,1); continue; }
    if(h.t<0) continue;
    if(Math.random()<dt*8){
      const a = Math.random()*6.283, r = Math.sqrt(Math.random())*h.r;
      burst(h.x+Math.cos(a)*r, h.y+Math.sin(a)*r, 1, {colors:HZ_COL[h.kind]||HZ_COL.fire, sp:12, up:28, g:-50, life:520, size:2.2});
    }
    if(Math.hypot(pcx-h.x, pcy-h.y) < h.r){
      if(h.kind==='fire'){ hazardHurt(h.dps*dt); inflictStatus('burn', 1800, h.dps*6); }
      else if(h.kind==='poison'){ hazardHurt(h.dps*dt*0.7); inflictStatus('poison', 2500, h.dps*6); }
      else if(h.kind==='ice'){ hazardHurt(h.dps*dt*0.5); player.slowT = Math.max(player.slowT, 450); }
      else if(h.kind==='sand'){ hazardHurt(h.dps*dt*0.4); player.slowT = Math.max(player.slowT, 600); }
    }
  }
}
const HZ_COL = { fire:['#ff7a1a','#ffd34a','#ff4a1a'], poison:['#8aff4a','#4a9a1a'], ice:['#bfeaff','#7ad4ff','#ffffff'], sand:['#e8c878','#c9a050'] };
const HZ_FILL = { fire:'255,90,30', poison:'110,210,60', ice:'140,210,255', sand:'214,176,96' };

// ---------- генерация: бочки, ящики, ловушки, мосты ----------
const PROP_R = 9;
function specialNear(L, x, y, rad){
  for(let dy=-rad;dy<=rad;dy++) for(let dx=-rad;dx<=rad;dx++){
    const r = L.grid[y+dy]; if(!r) continue; const t = r[x+dx];
    if(t && t!=='.' && t!=='#' && t!=='~' && t!=='^') return true;
  }
  return false;
}
function openTile(L, x, y){
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const r = L.grid[y+dy]; if(!r || r[x+dx]!=='.') return false; }
  return true;
}
function ensureMapExtras(wd){
  for(const id in wd){
    const L = wd[id];
    if(!L || L.extras || !L.grid) continue;
    L.extras = 1;
    if(L.type==='overworld'){ makeBridges(L); continue; }
    if(L.type!=='dungeon' || L.safe || L.arena || L.biome==='town' || L.biome==='house') continue;
    const T = TILE, W = L.width, H = L.height, lair = !!LAIR[id], lv = L.level||1;
    L.props = []; L.traps = [];
    const sx = L.spawn.x/T, sy = L.spawn.y/T;
    const keyPts = []; if(L.portal) keyPts.push([L.portal.tx,L.portal.ty]); if(L.exit) keyPts.push([L.exit.tx,L.exit.ty]); for(const d of (L.doors||[])) keyPts.push([d.tx,d.ty]);
    const nProps = Math.min(16, Math.max(4, Math.floor(W*H/200))), nTraps = lair ? 0 : Math.min(8, Math.max(2, Math.floor(W*H/450)));
    let tries = 0;
    while((L.props.length<nProps || L.traps.length<nTraps) && tries++<2500){
      const x = rnd(2,W-3), y = rnd(2,H-3);
      if(!openTile(L,x,y) || Math.hypot(x-sx,y-sy)<6 || specialNear(L,x,y,3)) continue;
      if(keyPts.some(k=>Math.hypot(x-k[0],y-k[1])<6)) continue;
      const cx = x*T+T/2, cy = y*T+T/2;
      if(L.enemies.some(e=>Math.hypot(e.x+e.w/2-cx, e.y+e.h/2-cy)<44)) continue;
      if(L.items.some(i=>Math.hypot(i.x-cx,i.y-cy)<40)) continue;
      if(L.props.some(p=>Math.hypot(p.x-cx,p.y-cy)<T*3) || L.traps.some(p=>Math.hypot(p.x-cx,p.y-cy)<T*3)) continue;
      if(L.props.length<nProps && (L.traps.length>=nTraps || Math.random()<0.65)) L.props.push({x:cx, y:cy, k:Math.random()<0.55 ? 'barrel' : 'crate', hp:1});
      else if(L.traps.length<nTraps){
        if(Math.random()<0.6) L.traps.push({k:'spikes', x:cx, y:cy, ph:rnd(0,2999)});
        else L.traps.push({k:'plate', x:cx, y:cy, cd:0});
      }
    }
  }
}
function makeBridges(L){
  L.bridges = [];
  const W = L.width, H = L.height, G = L.grid, ok = (x,y)=>G[y] && G[y][x]==='.' ;
  const far = (x,y)=>L.bridges.every(b=>Math.hypot(b.x0-x,b.y0-y)>18);
  const tryRun = (x0,y0,dx,dy,k)=>{
    let n = 0; while(G[y0+dy*n] && G[y0+dy*n][x0+dx*n]==='~' && n<10) n++;
    if(n<3 || n>8) return false;
    if(!ok(x0-dx,y0-dy) || !ok(x0+dx*n,y0+dy*n)) return false;
    for(let i=0;i<n;i++){                      // это переправа через озеро, а не лужа: по бокам тоже вода или берег
      const sx = x0+dx*i+dy, sy = y0+dy*i+dx, ex = x0+dx*i-dy, ey = y0+dy*i-dx;
      if(!G[sy] || !G[ey] || G[sy][sx]!=='~' || G[ey][ex]!=='~') return false;
    }
    if(!far(x0,y0)) return false;
    for(let i=0;i<n;i++) G[y0+dy*i][x0+dx*i] = '.';
    L.bridges.push({x0, y0, dx, dy, n, k:n>=5 ? 'bridge' : 'ford'});
    return true;
  };
  let guard = 0;
  for(let y=3;y<H-3 && L.bridges.length<7 && guard<4000;y+=1){
    for(let x=3;x<W-3;x++){
      guard++;
      if(G[y][x]==='~' && ok(x-1,y) && Math.random()<0.35 && tryRun(x,y,1,0)) { x += 12; }
      else if(G[y][x]==='~' && ok(x,y-1) && Math.random()<0.35 && tryRun(x,y,0,1)) { x += 3; }
    }
  }
}
function fordAt(x,y){
  const B = loc.bridges; if(!B || !B.length) return false;
  const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
  for(const b of B) if(b.k==='ford'){ const i = b.dx ? tx-b.x0 : ty-b.y0; if(i>=0 && i<b.n && (b.dx ? ty===b.y0 : tx===b.x0)) return true; }
  return false;
}

// ---------- столкновения с бочками и ящиками ----------
function propBlocks(L, x, y, w, h){
  const P = L.props;
  for(let i=0;i<P.length;i++){
    const p = P[i];
    if(x < p.x+PROP_R && x+w > p.x-PROP_R && y < p.y+PROP_R && y+h > p.y-PROP_R) return true;
  }
  return false;
}
function breakProp(i){
  const p = loc.props[i]; if(!p) return;
  loc.props.splice(i,1);
  SFX.play('barrel'); bump('barrels');
  burst(p.x, p.y, 14, {colors:p.k==='barrel' ? ['#8a5a2a','#c28a4a','#5a3a1a'] : ['#b88a4a','#d8b070','#6a4a24'], sp:110, up:40, g:240, life:520, size:2.6, shape:'r'});
  const lv = loc.level||1, r = Math.random();
  const mk = o=>Object.assign({x:p.x-7+rnd(-8,8), y:p.y-7+rnd(-8,8), w:14, h:14}, o);
  if(r<0.5){ loc.items.push(mk({type:'gold', value:Math.max(2, Math.round(rnd(3,9)*(1+lv*0.35)))})); }
  else if(r<0.62 && player.potions<8){ loc.items.push(mk({type:'potion', value:1})); }
  else if(r<0.68){ const ks = ['speed','might','guard']; loc.items.push(mk({type:'elixir', kind:ks[rnd(0,2)]})); }
  else if(r<0.8 && player.mats){ player.mats.scrap = (player.mats.scrap||0)+1; addNote('+1 ⚙ Лом', '#c9d3dd'); }
}
function propsStrike(hb){
  const P = loc.props; if(!P || !P.length) return;
  for(let i=P.length-1;i>=0;i--){ const p = P[i]; if(p.x+PROP_R > hb.x && p.x-PROP_R < hb.x+hb.w && p.y+PROP_R > hb.y && p.y-PROP_R < hb.y+hb.h) breakProp(i); }
}
function breakPropsRadius(cx, cy, R){
  const P = loc.props; if(!P || !P.length) return;
  for(let i=P.length-1;i>=0;i--) if(Math.hypot(P[i].x-cx, P[i].y-cy) < R+PROP_R) breakProp(i);
}

// ---------- ловушки ----------
const SPIKE_CYCLE = 3200;
function spikeState(tr, now){
  const t = (now+tr.ph) % SPIKE_CYCLE;
  return t < 1900 ? 0 : t < 2500 ? 1 : 2;           // 0 — убраны, 1 — предупреждение, 2 — подняты
}
function trapsTick(dt){
  const T = loc.traps; if(!T || !T.length) return;
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, now = Date.now(), lv = loc.level||1;
  for(const tr of T){
    if(Math.abs(tr.x-pcx)>TILE*1.2 || Math.abs(tr.y-pcy)>TILE*1.2){ if(tr.cd>0) tr.cd = Math.max(0,tr.cd-dt*1000); continue; }
    const d = Math.hypot(tr.x-pcx, tr.y-pcy);
    if(tr.k==='spikes'){
      const st = spikeState(tr, now);
      if(st===2 && d<17 && hurtPlayer(8+lv*2)){ burst(tr.x, tr.y, 8, {colors:['#d02a2a','#ffffff'], sp:80, up:30, g:200, life:360, size:2}); SFX.play('spikes'); if(!wxNoted.spikes){ wxNoted.spikes = 1; addNote('⚠ Шипы в полу! Следите за плитами с дырочками', '#ff9f4a'); } }
    } else {
      tr.cd = Math.max(0, (tr.cd||0)-dt*1000);
      if(d<14 && !(tr.cd>0)){
        tr.cd = 9000; tr.on = 380; SFX.play('plate');
        for(let i=0;i<3;i++){ const a = i*2.094+Math.random(), r = i ? 62 : 0; aoes.push({x:pcx+Math.cos(a)*r, y:pcy+Math.sin(a)*r, r:44, t:0, dur:1000+i*180, dmg:10+lv*3, col:'#ff8a3a'}); }
        if(!wxNoted.plate){ wxNoted.plate = 1; addNote('🔻 Плита-нажим! Скорее прочь от красных кругов', '#ff9f4a'); }
      }
      if(tr.on>0) tr.on -= dt*1000;
    }
  }
}

// ---------- общий тик и отрисовка ----------
function worldExtrasTick(dt){
  weatherTick(dt); boltsTick(dt); hazardsTick(dt); trapsTick(dt);
}
function clearWorldFx(){ hazards.length = 0; bolts.length = 0; }
function drawWorldExtras(camX, camY){
  const cw = canvas.width, ch = canvas.height, t = Date.now(), now = t;
  const vis = (x,y,m)=>x-camX>-m && x-camX<cw+m && y-camY>-m && y-camY<ch+m;
  // мосты и броды
  if(loc.bridges) for(const b of loc.bridges){
    const x0 = b.x0*TILE, y0 = b.y0*TILE, L = b.n*TILE;
    if(!vis(x0+(b.dx?L/2:0), y0+(b.dy?L/2:0), L+40)) continue;
    const sx = x0-camX, sy = y0-camY;
    ctx.save(); ctx.translate(sx, sy);
    if(b.dy){ ctx.translate(TILE,0); ctx.rotate(Math.PI/2); }       // вертикальный мост: поворот
    if(b.k==='bridge'){
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-2, 4, L+4, TILE-2);
      ctx.fillStyle = '#8a5e32'; ctx.fillRect(-4, 2, L+8, TILE-4);
      for(let i=0;i<L;i+=8){ ctx.fillStyle = (i/8)%2 ? '#a97a46' : '#b98a52'; ctx.fillRect(i, 3, 7, TILE-6); }
      ctx.fillStyle = '#5a3a1c'; ctx.fillRect(-4, 0, L+8, 3); ctx.fillRect(-4, TILE-3, L+8, 3);
      for(let i=0;i<=L;i+=TILE){ ctx.fillRect(i-2, -2, 4, 6); ctx.fillRect(i-2, TILE-4, 4, 6); }
    } else {
      for(let i=0;i<b.n;i++){
        for(let k=0;k<2;k++){
          const cx = i*TILE+10+k*14+((i*7+k*3)%5), cy = 8+k*14+((i*5+k)%4);
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(cx+1, cy+3, 9, 5, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = k ? '#8d96a0' : '#a5adb6'; ctx.beginPath(); ctx.ellipse(cx, cy, 8.5, 5.5, 0, 0, 6.283); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  // ловушки
  if(loc.traps) for(const tr of loc.traps){
    if(!vis(tr.x, tr.y, 30)) continue;
    const x = tr.x-camX, y = tr.y-camY;
    if(tr.k==='spikes'){
      const st = spikeState(tr, now);
      ctx.fillStyle = 'rgba(30,24,20,0.8)'; ctx.fillRect(x-14, y-14, 28, 28);
      ctx.fillStyle = '#15110e'; for(let a=0;a<3;a++) for(let c=0;c<3;c++){ ctx.beginPath(); ctx.arc(x-8+a*8, y-8+c*8, 1.8, 0, 6.283); ctx.fill(); }
      if(st>0){
        const h = st===2 ? 11 : 4+2*Math.sin(now/60);
        ctx.fillStyle = st===2 ? '#d7dce2' : '#8f949b';
        for(let a=0;a<3;a++) for(let c=0;c<3;c++){ const px = x-8+a*8, py = y-8+c*8; ctx.beginPath(); ctx.moveTo(px-3, py+3); ctx.lineTo(px, py+3-h); ctx.lineTo(px+3, py+3); ctx.closePath(); ctx.fill(); }
        if(st===1){ ctx.strokeStyle = 'rgba(255,80,50,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(x-14, y-14, 28, 28); }
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x-13, y-11, 26, 24);
      const on = tr.on>0 || tr.cd>0;
      ctx.fillStyle = on ? '#4a4038' : '#7c6e5c'; ctx.fillRect(x-13, y-13, 26, 24);
      ctx.strokeStyle = on ? '#2e2620' : '#a3937c'; ctx.lineWidth = 1.5; ctx.strokeRect(x-11.5, y-11.5, 23, 21);
      ctx.fillStyle = on ? '#3a3028' : '#c25a3a'; ctx.beginPath(); ctx.arc(x, y-2, 4, 0, 6.283); ctx.fill();
    }
  }
  // зоны
  for(const h of hazards){
    if(!vis(h.x, h.y, h.r+10)) continue;
    const x = h.x-camX, y = h.y-camY, col = HZ_FILL[h.kind] || HZ_FILL.fire;
    if(h.t<0){
      const p = 1+h.t/900;
      ctx.fillStyle = 'rgba('+col+','+(0.08+0.12*p)+')'; ctx.beginPath(); ctx.arc(x, y, h.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba('+col+',0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(x, y, h.r*(0.5+0.5*p), 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, h.r, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    } else {
      const fade = Math.min(1, (h.dur-h.t)/700), pul = 0.5+0.5*Math.sin(now/180);
      ctx.fillStyle = 'rgba('+col+','+((0.28+0.1*pul)*fade)+')'; ctx.beginPath(); ctx.arc(x, y, h.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba('+col+','+(0.85*fade)+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, h.r-1, 0, 6.283); ctx.stroke();
    }
  }
  // бочки и ящики
  if(loc.props) for(const p of loc.props){
    if(!vis(p.x, p.y, 24)) continue;
    const x = p.x-camX, y = p.y-camY;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x, y+9, 11, 4.5, 0, 0, 6.283); ctx.fill();
    if(p.k==='barrel'){
      ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.ellipse(x, y, 10, 12, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#a97440'; ctx.beginPath(); ctx.ellipse(x-2.5, y-1, 4.5, 10, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 10, 12, 0, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-10, y-4); ctx.lineTo(x+10, y-4); ctx.moveTo(x-10, y+4); ctx.lineTo(x+10, y+4); ctx.stroke();
    } else {
      ctx.fillStyle = '#b88a4a'; ctx.fillRect(x-10, y-10, 20, 20);
      ctx.strokeStyle = '#5a3c1c'; ctx.lineWidth = 2; ctx.strokeRect(x-9, y-9, 18, 18);
      ctx.beginPath(); ctx.moveTo(x-9, y-9); ctx.lineTo(x+9, y+9); ctx.moveTo(x+9, y-9); ctx.lineTo(x-9, y+9); ctx.stroke();
    }
  }
  // истории: NPC и предметы
  if(typeof drawStoryItem==='function') for(const it of loc.items) if(it.type==='sitem' && vis(it.x, it.y, 30)) drawStoryItem(it, camX, camY);
  if(typeof drawStoryNpc==='function' && loc.npcs) for(const n of loc.npcs) if(vis(n.x, n.y, 40)) drawStoryNpc(n, camX, camY);
  // молнии
  for(const b of bolts){
    const x = b.x-camX, y = b.y-camY;
    if(b.t<0){
      const p = 1+b.t/1000;
      ctx.strokeStyle = 'rgba(200,225,255,'+(0.5+0.4*Math.sin(now/50))+')'; ctx.lineWidth = 2; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(210,230,255,'+(0.08+0.2*p)+')'; ctx.beginPath(); ctx.arc(x, y, b.r*p, 0, 6.283); ctx.fill();
    } else {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.shadowColor = '#9fc8ff'; ctx.shadowBlur = 14;
      ctx.beginPath(); let px = x+rnd(-6,6), py = y-ch; ctx.moveTo(px, py);
      for(let i=1;i<=9;i++){ px = x+rnd(-14,14)*(i<9 ? 1 : 0); py = y-ch+(ch*i/9); ctx.lineTo(px, py); }
      ctx.stroke(); ctx.shadowBlur = 0;
    }
  }
}
