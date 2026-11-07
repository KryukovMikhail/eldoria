// ======================= Опасности местности =======================
// Каждая местность опасна по-своему: гейзеры в Кузнях, зыбучие пески в пустыне, мороз во льдах (греться у костров),
// руки мертвецов на погосте, ядовитые топи в джунглях, камнепады в Провале. Опасность всегда заранее подсвечена.
const BH = {
  geyser:   {note:'🌋 Земля дрожит: оранжевый круг — сейчас ударит огненный гейзер. Отойдите!', col:'255,110,30'},
  quicksand:{note:'🏜 Тёмные воронки — зыбучие пески: в них вязнут ноги, а если стоять, засосёт.', col:'150,110,50'},
  frost:    {note:'❄ Лютый мороз: шкала холода растёт. Грейтесь у костров, иначе начнёте замерзать.', col:'150,210,255'},
  hands:    {note:'🪦 Из могил тянутся руки мертвецов: фиолетовый круг — они хватают за ноги.', col:'170,120,220'},
  bog:      {note:'🐸 Зелёные топи ядовиты: обходите их, иначе отравитесь.', col:'90,200,60'},
  rocks:    {note:'🪨 С потолка сыплются камни: тёмная тень — место, куда сейчас упадёт глыба.', col:'60,50,40'}
};
const BH_BY_LOC = { lava:'geyser', desert:'quicksand', ice:'frost', grave:'hands', jungle:'bog', dungeon3:'rocks' };
const BH_BY_BIOME = { ash:'geyser', desert:'quicksand', ice:'frost', grave:'hands', jungle:'bog' };
const bev = [];                 // всплески: {x,y,r,t,dur,kind,hit}; t<0 — предупреждение
let bhCd = 4, bhNoteCd = 0;
function bhKind(L, id){
  if(!L || L.safe || L.arena) return null;
  if(L.wild) return BH_BY_BIOME[L.wild.biome] || null;
  return BH_BY_LOC[id] || null;
}
function bhLevel(){ return loc.wild ? 2+loc.wild.dist*1.2 : (loc.level||1); }
function bhSafe(x, y){                         // у выхода, у лавки и у костра опасности не возникают
  const T = TILE;
  if(loc.exit && Math.hypot(x-(loc.exit.tx+0.5)*T, y-(loc.exit.ty+0.5)*T) < 6*T) return true;
  if(loc.shop && Math.hypot(x-(loc.shop.tx+0.5)*T, y-(loc.shop.ty+0.5)*T) < 6*T) return true;
  if(loc.wildGates && loc.wildGates.some(g=>Math.hypot(x-(g.tx+0.5)*T, y-(g.ty+0.5)*T) < 5*T)) return true;
  return false;
}
// статичные зоны (пески, топи) и костры — создаются один раз и живут в карте
function ensureBiomeHazards(L, id){
  const k = bhKind(L, id); if(!k || L.bz) return;
  L.bz = [];
  const W = L.width, H = L.height, T = TILE;
  const keep = [];
  if(L.exit) keep.push([L.exit.tx, L.exit.ty]); if(L.portal) keep.push([L.portal.tx, L.portal.ty]); if(L.shop) keep.push([L.shop.tx, L.shop.ty]);
  for(const g of (L.wildGates||[])) keep.push([g.tx, g.ty]);
  const sx = Math.floor(L.spawn.x/T), sy = Math.floor(L.spawn.y/T); keep.push([sx, sy]);
  const free = (x,y,r)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const row = L.grid[y+dy]; if(!row || row[x+dx]!=='.') return false; } return true; };
  const far = (x,y,d)=> keep.every(p=>Math.hypot(x-p[0],y-p[1])>=d);
  if(k==='quicksand' || k==='bog'){
    const n = Math.max(6, Math.round(W*H/(k==='bog' ? 420 : 520)));
    for(let t=0; t<n*30 && L.bz.length<n; t++){
      const x = rnd(4,W-5), y = rnd(4,H-5);
      if(!free(x,y,1) || !far(x,y,8) || L.bz.some(z=>Math.hypot(z.x/T-x,z.y/T-y)<7)) continue;
      L.bz.push({x:(x+0.5)*T, y:(y+0.5)*T, r:T*(1.1+Math.random()*0.8), k, s:Math.random()*6.28});
    }
  }
  if(k==='frost'){
    L.fires = [];
    const n = Math.max(5, Math.round(W*H/900));
    for(let t=0; t<n*40 && L.fires.length<n; t++){
      const x = rnd(4,W-5), y = rnd(4,H-5);
      if(!free(x,y,1) || !far(x,y,5) || L.fires.some(f=>Math.hypot(f.x/T-x,f.y/T-y)<14)) continue;
      L.fires.push({x:(x+0.5)*T, y:(y+0.5)*T});
    }
    if(L.exit) L.fires.push({x:(L.exit.tx+2.5)*T, y:(L.exit.ty+1.5)*T, home:true});
  }
}
function ensureBiomeHazardsAll(wd){ for(const id in wd) if(wd[id]) ensureBiomeHazards(wd[id], id); }

function bhNote(k){
  if(!player.bhSeen) player.bhSeen = {};
  if(player.bhSeen[k]) return;
  player.bhSeen[k] = 1; addNote(BH[k].note, '#ffd9a0'); SFX.play('portal');
}
function bhSpawn(k){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(let tries=0; tries<12; tries++){
    const lead = tries<6 && Math.random()<0.6, a = Math.random()*6.283, r = lead ? rndf(0,40) : rndf(50,170);
    const x = pcx+Math.cos(a)*r+(lead ? (player.dir==='left' ? -50 : player.dir==='right' ? 50 : 0) : 0), y = pcy+Math.sin(a)*r+(lead ? (player.dir==='up' ? -50 : player.dir==='down' ? 50 : 0) : 0);
    const tx = Math.floor(x/TILE), ty = Math.floor(y/TILE);
    if(!loc.grid[ty] || loc.grid[ty][tx]!=='.' || bhSafe(x, y)) continue;
    const R = k==='rocks' ? 30 : k==='geyser' ? 36 : 32, warn = k==='rocks' ? 1100 : 1000;
    bev.push({x, y, r:R, t:-warn, warn, dur:k==='geyser' ? 1300 : 700, kind:k, hit:false});
    return true;
  }
  return false;
}
function bhDamage(){ return Math.round(6+bhLevel()*2.6); }
function biomeHazardsTick(dt){
  const k = bhKind(loc, currentLocId); if(!k){ bev.length = 0; player.cold = 0; return; }
  const ms = dt*1000, pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  bhNote(k);
  if(k==='geyser' || k==='hands' || k==='rocks'){
    bhCd -= dt;
    if(bhCd<=0){
      const lv = bhLevel(); bhCd = Math.max(2.2, (k==='hands' ? 5.5 : 4.6) - lv*0.12) + Math.random()*2;
      bhSpawn(k); if(lv>=6 && Math.random()<0.35) bhSpawn(k);
    }
  }
  for(let i=bev.length-1;i>=0;i--){
    const h = bev[i]; h.t += ms;
    if(h.t>=0 && !h.hit){
      h.hit = true;
      const inR = (x,y,extra)=>Math.hypot(x-h.x, y-h.y) < h.r+(extra||0);
      if(h.kind==='geyser'){ SFX.play('fire'); burst(h.x, h.y, 26, {colors:['#ff7a1a','#ffd34a','#ff4a1a','#ffffff'], sp:110, up:160, g:220, life:700, size:3}); }
      else if(h.kind==='rocks'){ SFX.play('hit'); shakeT = Math.max(shakeT, 260); burst(h.x, h.y, 18, {colors:['#7a6a5a','#4a3e34','#a89888'], sp:120, up:50, g:260, life:560, size:3}); }
      else { SFX.play('hurt'); burst(h.x, h.y, 14, {colors:['#b088e0','#5a3a7a','#d8c8ff'], sp:60, up:70, g:120, life:520, size:2.4}); }
      if(inR(pcx, pcy) && !(player.dashT>0)){
        if(hurtPlayer(bhDamage())){
          if(h.kind==='geyser') inflictStatus('burn', 2600, bhDamage());
          if(h.kind==='hands'){ player.slowT = Math.max(player.slowT, 1600); addNote('🪦 Руки мертвецов держат вас!', '#c8a8ff'); }
        }
      }
      if(h.kind!=='hands') for(const e of loc.enemies){
        if(e.hp<=0 || BOSS_TYPES.includes(e.type)) continue;
        if(inR(e.x+e.w/2, e.y+e.h/2, e.w/2)){ e.hp -= bhDamage()*1.5; e.hitFlash = 200; if(e.hp<=0) killEnemy(e); }
      }
    }
    if(h.t>=h.dur) bev.splice(i,1);
  }
  // зыбучие пески и топи
  let inZone = null;
  for(const z of (loc.bz||[])) if(Math.hypot(pcx-z.x, pcy-z.y) < z.r){ inZone = z; break; }
  if(inZone && !(player.dashT>0)){
    player.slowT = Math.max(player.slowT, inZone.k==='quicksand' ? 350 : 250);
    if(inZone.k==='bog'){ if(!(player.fx.poison>0)) inflictStatus('poison', 2600, bhDamage()*0.6); }
    else {
      player.sinkT = (player.sinkT||0)+dt;
      if(player.sinkT>1.6) hazardHurt(bhDamage()*0.5*dt);
      if(Math.random()<dt*10) burst(pcx, pcy+8, 1, {colors:['#c9a050','#8a6a30'], sp:20, up:10, g:40, life:400, size:2});
    }
  } else player.sinkT = 0;
  // мороз: шкала холода, костры греют
  if(k==='frost'){
    let warm = false;
    for(const f of (loc.fires||[])) if(Math.hypot(pcx-f.x, pcy-f.y) < 3.2*TILE){ warm = true; break; }
    if(loc.merchant && Math.hypot(pcx-loc.merchant.x, pcy-loc.merchant.y) < 4*TILE) warm = true;
    const w = wxName(), rate = (w==='blizzard' ? 2.2 : 1)*(player.buff.guard>0 ? 0.5 : 1)*(2+bhLevel()*0.08);
    player.cold = clamp((player.cold||0) + (warm ? -dt*30 : dt*rate), 0, 100);
    if(player.cold>=100){
      hazardHurt(Math.max(2, player.maxHp*0.03)*dt); player.slowT = Math.max(player.slowT, 300);
      bhNoteCd -= dt; if(bhNoteCd<=0){ bhNoteCd = 6; addNote('🥶 Вы замерзаете! Найдите костёр', '#9fd8ff'); }
    }
  } else player.cold = 0;
}

// ---------- отрисовка ----------
function drawBiomeHazards(camX, camY){
  const k = bhKind(loc, currentLocId); if(!k) return;
  const cw = canvas.width, ch = canvas.height, now = Date.now()/1000;
  const vis = (x,y,m)=>x-camX>-m && x-camX<cw+m && y-camY>-m && y-camY<ch+m;
  for(const z of (loc.bz||[])){
    if(!vis(z.x, z.y, z.r+20)) continue;
    const x = z.x-camX, y = z.y-camY;
    ctx.save(); ctx.translate(x, y);
    if(z.k==='quicksand'){
      const g = ctx.createRadialGradient(0,0,2,0,0,z.r); g.addColorStop(0,'rgba(92,64,28,0.75)'); g.addColorStop(0.7,'rgba(150,112,58,0.55)'); g.addColorStop(1,'rgba(200,160,96,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0,0,z.r,z.r*0.78,0,0,6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(70,46,18,0.55)'; ctx.lineWidth = 1.4;
      for(let i=0;i<3;i++){ const r = z.r*(0.25+i*0.22); ctx.beginPath(); ctx.ellipse(0,0,r,r*0.78,0,now*(1.2-i*0.3)+z.s+i, now*(1.2-i*0.3)+z.s+i+3.6); ctx.stroke(); }
    } else {
      const g = ctx.createRadialGradient(0,0,2,0,0,z.r); g.addColorStop(0,'rgba(70,150,20,0.95)'); g.addColorStop(0.75,'rgba(84,160,30,0.85)'); g.addColorStop(1,'rgba(40,90,20,0.2)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0,0,z.r,z.r*0.72,0,0,6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(30,60,10,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0,0,z.r,z.r*0.72,0,0,6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(150,230,90,0.35)'; ctx.beginPath(); ctx.ellipse(-z.r*0.25,-z.r*0.2,z.r*0.35,z.r*0.15,0.3,0,6.283); ctx.fill();
      for(let i=0;i<3;i++){ const ph = (now*0.8+i*0.37+z.s)%1, bx = Math.cos(z.s+i*2.1)*z.r*0.45, by = Math.sin(z.s+i*1.7)*z.r*0.3;
        ctx.strokeStyle = 'rgba(200,255,140,'+(0.7*(1-ph))+')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, 1.5+ph*4, 0, 6.283); ctx.stroke(); }
    }
    ctx.restore();
  }
  for(const f of (loc.fires||[])){
    if(!vis(f.x, f.y, 80)) continue;
    const x = f.x-camX, y = f.y-camY, fl = 0.85+0.15*Math.sin(now*11+f.x);
    const g = ctx.createRadialGradient(x,y,4,x,y,3.2*TILE); g.addColorStop(0,'rgba(255,170,60,0.28)'); g.addColorStop(1,'rgba(255,140,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,3.2*TILE,0,6.283); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(x, y+6, 13, 4); ctx.fill();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x-10,y+5); ctx.lineTo(x+10,y-1); ctx.moveTo(x-10,y-1); ctx.lineTo(x+10,y+5); ctx.stroke(); ctx.lineCap = 'butt';
    for(let i=0;i<5;i++){ ctx.fillStyle = ['#7a7066','#8a8076','#6a6058'][i%3]; circ(x-11+i*5.5, y+7, 2.6); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,90,20,0.9)'; ctx.beginPath(); ctx.moveTo(x-7,y+2); ctx.quadraticCurveTo(x-6,y-10*fl,x,y-16*fl); ctx.quadraticCurveTo(x+6,y-10*fl,x+7,y+2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,80,0.95)'; ctx.beginPath(); ctx.moveTo(x-4,y+2); ctx.quadraticCurveTo(x-3,y-6*fl,x,y-10*fl); ctx.quadraticCurveTo(x+3,y-6*fl,x+4,y+2); ctx.closePath(); ctx.fill();
    if(Math.random()<0.15) burst(f.x+rndf(-4,4), f.y-8, 1, {colors:['#ffd34a','#ff8a2a'], sp:10, up:40, g:-30, life:600, size:1.6});
  }
  for(const h of bev){
    if(!vis(h.x, h.y, h.r+30)) continue;
    const x = h.x-camX, y = h.y-camY, col = BH[h.kind].col;
    if(h.t<0){
      const p = 1+h.t/h.warn;
      if(h.kind==='rocks'){ ctx.fillStyle = 'rgba(0,0,0,'+(0.15+0.35*p)+')'; ctx.beginPath(); ctx.ellipse(x,y,h.r*(0.4+0.6*p),h.r*(0.3+0.45*p),0,0,6.283); ctx.fill(); }
      ctx.fillStyle = 'rgba('+col+','+(0.1+0.15*p)+')'; ctx.beginPath(); ctx.arc(x,y,h.r,0,6.283); ctx.fill();
      ctx.strokeStyle = 'rgba('+col+',0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(x,y,h.r,0,6.283); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x,y,h.r*(1-p*0.85),0,6.283); ctx.stroke();
      if(h.kind==='rocks'){ const fy = y-140*(1-p); ctx.fillStyle = '#6a5c4e'; ctx.strokeStyle = '#2a221a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x-9,fy); ctx.lineTo(x-3,fy-9); ctx.lineTo(x+8,fy-6); ctx.lineTo(x+10,fy+5); ctx.lineTo(x-2,fy+9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else {
      const fade = 1-h.t/h.dur;
      if(h.kind==='geyser'){
        const hh = 70*Math.min(1, h.t/180)*fade;
        const g = ctx.createLinearGradient(x, y-hh, x, y); g.addColorStop(0,'rgba(255,230,120,0)'); g.addColorStop(0.3,'rgba(255,160,40,'+(0.85*fade)+')'); g.addColorStop(1,'rgba(255,70,20,'+(0.9*fade)+')');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x-12,y); ctx.quadraticCurveTo(x-16,y-hh*0.6,x-4,y-hh); ctx.lineTo(x+4,y-hh); ctx.quadraticCurveTo(x+16,y-hh*0.6,x+12,y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(40,20,10,'+(0.5*fade)+')'; ctx.beginPath(); ctx.ellipse(x,y,h.r*0.6,h.r*0.3,0,0,6.283); ctx.fill();
      } else if(h.kind==='hands'){
        ctx.fillStyle = 'rgba(30,20,40,'+(0.5*fade)+')'; ctx.beginPath(); ctx.ellipse(x,y,h.r*0.8,h.r*0.4,0,0,6.283); ctx.fill();
        for(let i=0;i<4;i++){
          const hx = x+Math.cos(i*1.6+h.x)*h.r*0.45, hy = y+Math.sin(i*1.6+h.x)*h.r*0.22, up = 16*Math.min(1,h.t/150)*fade;
          ctx.strokeStyle = 'rgba(190,200,170,'+fade+')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx,hy-up); ctx.stroke();
          ctx.lineWidth = 1.4; for(let f=-1;f<=1;f++){ ctx.beginPath(); ctx.moveTo(hx,hy-up); ctx.lineTo(hx+f*3,hy-up-4); ctx.stroke(); }
          ctx.lineCap = 'butt';
        }
      } else {
        ctx.fillStyle = 'rgba(70,58,46,'+fade+')'; ctx.strokeStyle = 'rgba(30,24,18,'+fade+')'; ctx.lineWidth = 1.5;
        for(let i=0;i<3;i++){ const rx = x+Math.cos(i*2.1+h.y)*10, ry = y+Math.sin(i*2.1+h.y)*6; ctx.beginPath(); ctx.moveTo(rx-7,ry); ctx.lineTo(rx-2,ry-7); ctx.lineTo(rx+6,ry-4); ctx.lineTo(rx+7,ry+4); ctx.lineTo(rx-1,ry+6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
    }
  }
}
function drawColdHUD(){
  if(!(player.cold>0) || bhKind(loc, currentLocId)!=='frost') return;
  const w = 120, x = canvas.width/2-w/2, y = canvas.height-UI.b-150, c = player.cold/100;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x-2, y-2, w+4, 12);
  const g = ctx.createLinearGradient(x,0,x+w,0); g.addColorStop(0,'#cfeaff'); g.addColorStop(1,'#2a7ad8');
  ctx.fillStyle = g; ctx.fillRect(x, y, w*c, 8);
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  const t = c>=1 ? '🥶 Замерзаете!' : '❄ Холод '+Math.round(c*100)+'%';
  ctx.strokeText(t, canvas.width/2, y-4); ctx.fillStyle = c>=1 ? '#ff8a8a' : '#cfeaff'; ctx.fillText(t, canvas.width/2, y-4); ctx.restore();
}
