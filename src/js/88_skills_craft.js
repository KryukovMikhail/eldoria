// ---------- Ветки умений и крафт снаряжения ----------
const SKILL_BRANCH = {
  dash:  {a:{n:'Теневой разрез', d:'рывок наносит урон всем врагам на пути (70% удара)'},        b:{n:'Лёгкая поступь', d:'рывок на 25% дальше, перезарядка на 30% короче'}},
  spin:  {a:{n:'Ураган',          d:'радиус вихря +35%, враги отлетают сильнее'},                b:{n:'Кровавый вихрь', d:'каждый задетый враг (до 4) возвращает 4% здоровья'}},
  shield:{a:{n:'Шипастая аура',   d:'пока щит горит, касающиеся вас враги получают 60% вашего удара'}, b:{n:'Бастион',    d:'щит держится на 50% дольше и при создании лечит 20% здоровья'}},
  might: {a:{n:'Ярость',          d:'12% шанс критического удара (двойной урон)'},               b:{n:'Закалка',        d:'получаемый урон снижен на 12%'}}
};
let heroPick = null;
function branchOf(k){ const b = player.sb && player.sb[k]; return b ? SKILL_BRANCH[k][b] : null; }
function skillUpgrade(k){
  const l = player.skills[k];
  if(l===1 && !(player.sb && player.sb[k]) && player.sp>0){ heroPick = k; renderHero('Выберите ветку развития — выбор окончательный.'); return; }
  player.sp--; player.skills[k]++; refreshSkillUI(); saveGame(); SFX.play('levelup'); renderHero(SKILLS[k].name+': уровень '+player.skills[k]+'.');
}
function renderBranchPick(){
  const k = heroPick, S = SKILLS[k];
  const back = shopButton('← Назад', ()=>{ heroPick = null; renderHero(''); });
  heroRow(S.icon+' '+S.name+': новая ветка', 'Выберите, как будет развиваться умение на втором уровне. Это нельзя изменить позже.', [back]);
  for(const id of ['a','b']){
    const B = SKILL_BRANCH[k][id];
    heroRow((id==='a'?'🅰 ':'🅱 ')+B.n, 'Умение: '+B.d+'.', [shopButton('Выбрать — 1 ★', ()=>{
      if(player.sp<1) return;
      player.sb[k] = id; player.sp--; player.skills[k]++; heroPick = null; refreshSkillUI(); saveGame(); SFX.play('levelup'); renderHero(S.name+': ветка «'+B.n+'».');
    })], '#9ad0ff');
  }
}
// эффекты веток
function dashDamage(){
  if(!player.sb || player.sb.dash!=='a') return;
  const hit = player.dashHit || (player.dashHit = []);
  const r = {x:player.x-6, y:player.y-6, w:player.w+12, h:player.h+12};
  for(const e of loc.enemies){
    if(e.hp<=0 || hit.includes(e) || !overlap(e, r)) continue;
    hit.push(e); damageEnemy(e, Math.round(playerDamage()*0.7)); SFX.play('hit');
    burst(e.x+e.w/2, e.y+e.h/2, 6, {colors:['#cfe8ff','#ffffff','#7a8aff'], sp:100, up:20, g:100, life:300, size:2});
    if(e.hp<=0) killEnemy(e);
  }
}
function shieldReflect(e, dt){
  e.reflCd = Math.max(0, (e.reflCd||0)-dt*1000);
  if(player.shield>0 && player.sb && player.sb.shield==='a' && e.reflCd<=0 && e.hp>0 && overlap(e, {x:player.x-4,y:player.y-4,w:player.w+8,h:player.h+8})){
    e.reflCd = 600; damageEnemy(e, Math.round(playerDamage()*0.6));
    burst(e.x+e.w/2, e.y+e.h/2, 6, {colors:['#9ad0ff','#ffffff'], sp:90, up:20, g:60, life:300, size:2}); SFX.play('clang');
    if(e.hp<=0){ killEnemy(e); return true; }
  }
  return false;
}

// ---------- Материалы ----------
const MAT_INFO = {
  scrap:  {n:'Обломки',  icon:'⚙', col:'#c8c8c8'},
  essence:{n:'Эссенция', icon:'✨', col:'#7ad4ff'},
  crystal:{n:'Кристалл', icon:'🔷', col:'#c06aff'},
  herb:   {n:'Трава',    icon:'🌿', col:'#7fe07f'},
  fish:   {n:'Рыба',     icon:'🐟', col:'#9fd8ff'}
};
function matsText(){ const m = player.mats||{}; return Object.keys(MAT_INFO).map(k=>MAT_INFO[k].icon+' '+(m[k]||0)).join('  '); }
function dismantleYield(g){
  const L = g.L||0;
  return g.rar===0 ? {scrap:2+Math.floor(L/3)} : g.rar===1 ? {scrap:4+Math.floor(L/2), essence:1} : {scrap:6+L, essence:2, crystal:1};
}
function yieldText(y){ return Object.keys(y).map(k=>MAT_INFO[k].icon+y[k]).join(' '); }
function dismantleGear(i){
  const g = player.bag[i]; if(!g) return null;
  const y = dismantleYield(g); player.bag.splice(i,1);
  for(const k in y) player.mats[k] = (player.mats[k]||0)+y[k];
  return y;
}
function dropMats(e){
  if(e.minion) return;
  const boss = BOSS_TYPES.includes(e.type);
  let y = null;
  if(boss) y = {scrap:4, essence:2, crystal:1};
  else if(e.elite) y = {scrap:2, essence:1};
  else if(Math.random()<0.07) y = {scrap:rnd(1,2)};
  if(!y) return;
  for(const k in y) player.mats[k] = (player.mats[k]||0)+y[k];
  addNote('Найдено: '+yieldText(y), '#c8c8c8');
}
// ---------- Улучшение снаряжения ----------
const GEAR_UP_MAX = 3;
function rollStats(slot, rar, L){
  const S = GEAR_SLOTS[slot], stats = {}, want = RAR[rar].k; let guard = 0;
  while(Object.keys(stats).length<want && guard++<40){
    const k = S.pool[rnd(0,S.pool.length-1)]; if(stats[k]) continue;
    const I = STAT_INFO[k], raw = (I.base+I.per*L)*RAR[rar].m*(0.85+Math.random()*0.3);
    stats[k] = k==='hp' ? Math.max(1,Math.round(raw)) : Math.round(raw*10)/10;
  }
  return stats;
}
function gearEquipped(g){ return player.gear[g.slot]===g; }
function mutateGear(g, fn){
  const eq = gearEquipped(g); if(eq) applyGearHp(g,-1);
  fn(); if(eq) applyGearHp(g,1);
}
function gearUpCost(g){ const u = g.up||0; return {mats:{scrap:3+2*u}, gold:Math.round(40*(u+1)*(1+g.rar))}; }
function gearReforgeCost(g){ return {mats:{essence:2+g.rar}, gold:60*(1+g.rar)}; }
function gearAscendCost(g){ return {mats:{crystal:1+g.rar}, gold:150*(1+g.rar)}; }
function canPay(c){ if(player.gold<c.gold) return false; for(const k in c.mats) if((player.mats[k]||0)<c.mats[k]) return false; return true; }
function pay(c){ player.gold -= c.gold; for(const k in c.mats) player.mats[k] -= c.mats[k]; }
function costText(c){ return c.gold+' ◆ + '+yieldText(c.mats); }
function upgradeGear(g){
  if((g.up||0)>=GEAR_UP_MAX) return false; const c = gearUpCost(g); if(!canPay(c)) return false; pay(c);
  mutateGear(g, ()=>{ for(const k in g.stats){ const v = g.stats[k]*1.15; g.stats[k] = k==='hp' ? Math.max(g.stats[k]+1, Math.round(v)) : Math.round(v*10)/10; } g.up = (g.up||0)+1; });
  return true;
}
function reforgeGear(g){
  const c = gearReforgeCost(g); if(!canPay(c)) return false; pay(c);
  mutateGear(g, ()=>{ g.stats = rollStats(g.slot, g.rar, g.L); g.up = 0; const first = Object.keys(g.stats)[0]; g.name = GEAR_SLOTS[g.slot].names[rnd(0,GEAR_SLOTS[g.slot].names.length-1)]+' '+STAT_SUFFIX[first]; });
  return true;
}
function ascendGear(g){
  if(g.rar>=2) return false; const c = gearAscendCost(g); if(!canPay(c)) return false; pay(c);
  mutateGear(g, ()=>{ g.rar++; g.stats = rollStats(g.slot, g.rar, g.L); g.up = 0; const first = Object.keys(g.stats)[0]; g.name = GEAR_SLOTS[g.slot].names[rnd(0,GEAR_SLOTS[g.slot].names.length-1)]+' '+STAT_SUFFIX[first]; });
  return true;
}
function renderGearForge(){
  shopRow('Материалы', matsText()+'  — обломки (⚙) падают с врагов, эссенция (✨) и кристаллы (🔷) — с элитных врагов и стражей, а также при разборке снаряжения.', []);
  const pieces = [];
  for(const slot of ['helm','ring','amulet']) if(player.gear[slot]) pieces.push({g:player.gear[slot], eq:true});
  player.bag.forEach((g,i)=>pieces.push({g, eq:false, i}));
  if(!pieces.length){ shopRow('Снаряжения нет', 'Шлемы, кольца и амулеты падают из врагов. Здесь их можно улучшать, перековывать и разбирать.', []); return; }
  for(const p of pieces){
    const g = p.g, up = g.up||0;
    const bUp = shopButton(up>=GEAR_UP_MAX ? 'Макс.' : '⬆ '+costText(gearUpCost(g)), ()=>{ if(upgradeGear(g)){ saveGame(); SFX.play('buy'); renderShop('Улучшено: '+g.name+' (+'+(up+1)+').'); } else renderShop('Не хватает материалов или золота.'); }, up>=GEAR_UP_MAX || !canPay(gearUpCost(g)));
    const bRe = shopButton('♻ '+costText(gearReforgeCost(g)), ()=>{ if(reforgeGear(g)){ saveGame(); SFX.play('buy'); renderShop('Перекованы свойства: '+g.name+'.'); } }, !canPay(gearReforgeCost(g)));
    const btns = [bUp, bRe];
    if(g.rar<2) btns.push(shopButton('★ '+costText(gearAscendCost(g)), ()=>{ if(ascendGear(g)){ saveGame(); SFX.play('levelup'); renderShop('Возвышено: '+g.name+' — теперь '+RAR[g.rar].n.toLowerCase()+'.'); } }, !canPay(gearAscendCost(g))));
    if(!p.eq) btns.push(shopButton('Разобрать → '+yieldText(dismantleYield(g)), ()=>{ const idx = player.bag.indexOf(g); const y = dismantleGear(idx); if(y){ saveGame(); SFX.play('buy'); renderShop('Разобрано: '+g.name+' ('+yieldText(y)+').'); } }));
    shopRow((p.eq ? '● ' : '')+g.name+(up ? ' +'+up : '')+'  ('+GEAR_SLOTS[g.slot].n.toLowerCase()+')', RAR[g.rar].n+'. '+gearLines(g)+'. ⬆ усилить статы на 15% (до +'+GEAR_UP_MAX+'); ♻ перековать свойства; ★ повысить редкость.', btns);
  }
}
