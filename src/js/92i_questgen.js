// ======================= Генератор заданий: поручения гильдии, которые никогда не кончаются =======================
// У торговца на вкладке «Задания» всегда есть три поручения, собранные из шаблонов под уровень героя и открытые места.
// Взять можно одно задание за раз (сюжетное или поручение). Выполненное поручение заменяется новым.
const GQ_ADJ = ['Срочная','Тайная','Опасная','Дерзкая','Суровая','Ночная','Лютая','Отчаянная'];   // охота, зачистка, вылазка — женский род
const GQ_KINDS = {
  kill:  {w:5, title:'охота'},
  hunt:  {w:3, title:'зачистка'},
  herb:  {w:2, title:'сбор трав'},
  fish:  {w:1, title:'улов'},
  arena: {w:1, title:'испытание'},
  wild:  {w:2, title:'вылазка'},
  wildb: {w:1, title:'охота на зверя'}
};
const GQ_LOCS = ['overworld','dungeon1','dungeon3','lava','desert','ice','grave','jungle','city','manor'];
const GQ_REFRESH = 15;
function gqEnsure(){
  if(!player.genq || !Array.isArray(player.genq.offers)) player.genq = {seq:0, done:0, offers:[]};
  while(player.genq.offers.length<3) player.genq.offers.push(gqMake());
  const q = player.quest;
  if(q && q.gen && q.def && !QUESTS[q.id]) QUESTS[q.id] = q.def;
  return player.genq;
}
function gqLocLevel(id){ return id==='overworld' ? 0 : (world[id] && world[id].level) || 1; }
function gqPlaces(){
  const v = player.visited || {overworld:1};
  const ids = GQ_LOCS.filter(id=>(v[id] || id==='overworld') && world[id]);
  return ids.length ? ids : ['overworld'];
}
function gqPick(arr){ return arr[rnd(0, arr.length-1)]; }
function gqKindOk(k){
  if(k==='herb') return (player.stat && player.stat.herbs>0) || !!(player.visited||{}).jungle || storyStage()>=1;
  if(k==='fish') return storyStage()>=1;
  if(k==='arena') return !!world.arena && !!(player.visited||{}).town;
  if(k==='wild' || k==='wildb') return wildUnlocked() && !!player.wild;
  return true;
}
function gqMake(kindForce){
  const G = player.genq || (player.genq = {seq:0, done:0, offers:[]});
  const kinds = Object.keys(GQ_KINDS).filter(gqKindOk), tot = kinds.reduce((a,k)=>a+GQ_KINDS[k].w,0);
  let kind = kindForce;
  if(!kind){ let r = Math.random()*tot; for(const k of kinds){ r -= GQ_KINDS[k].w; if(r<=0){ kind = k; break; } } kind = kind || 'kill'; }
  const places = gqPlaces();
  const deep = places.slice().sort((a,b)=>gqLocLevel(b)-gqLocLevel(a));
  const place = Math.random()<0.6 ? deep[0] : gqPick(places);
  const lv = Math.max(gqLocLevel(place), Math.floor(player.level/2)), lvlK = 1+player.level*0.08;
  const id = 'g'+(++G.seq), adj = gqPick(GQ_ADJ);
  const d = {id, gen:true, kind, potions:1, xp:0};
  if(kind==='kill'){
    const ro = (LEVEL_ROSTER[gqLocLevel(place)] || LEVEL_ROSTER[0]).filter(t=>ENEMY_INFO[t] && ENEMY_BASE[t]);
    const t = gqPick(ro.length ? ro : ['wolf']), I = ENEMY_INFO[t];
    d.type = t; d.target = rnd(4,7)+Math.floor(player.level/5);
    d.name = adj+' '+GQ_KINDS.kill.title+': '+I[1];
    d.desc = 'Победите врагов «'+I[1]+'» ('+d.target+'). Они водятся здесь: '+getLocName(world[place])+'.';
    d.loc = place; d.gold = Math.round((8+ENEMY_BASE[t].xp*0.6)*d.target*lvlK/2);
  } else if(kind==='hunt'){
    d.loc = place; d.target = rnd(10,16)+Math.floor(player.level/3);
    d.name = adj+' '+GQ_KINDS.hunt.title+': '+getLocName(world[place]);
    d.desc = 'Победите любых '+d.target+' врагов в месте «'+getLocName(world[place])+'».';
    d.gold = Math.round((6+lv*4)*d.target*lvlK/2.5);
  } else if(kind==='herb'){
    d.target = rnd(4,8); d.name = 'Травы для лекаря'; d.desc = 'Соберите '+d.target+' лечебных трав (растут на поверхности и в джунглях).';
    d.gold = Math.round((10+player.level*2)*d.target);
  } else if(kind==='fish'){
    d.target = rnd(3,6); d.name = 'Улов для трактира'; d.desc = 'Поймайте '+d.target+' рыб: подойдите к воде и закиньте удочку (F).';
    d.gold = Math.round((12+player.level*2)*d.target);
  } else if(kind==='arena'){
    d.target = clamp(3+Math.floor(player.level/2)+rnd(0,2), 3, 25); d.name = 'Слава арены: волна '+d.target;
    d.desc = 'На арене Лиссарена продержитесь до волны '+d.target+' за одно испытание.';
    d.gold = Math.round((20+8*d.target)*d.target*0.5); d.potions = 2;
  } else if(kind==='wild'){
    d.target = rnd(2,4); d.name = adj+' '+GQ_KINDS.wild.title+' в Дикие земли';
    d.desc = 'Разведайте '+d.target+' новых краёв в Диких землях (проходы на краях каждой земли ведут дальше).';
    d.gold = Math.round((30+player.level*10)*d.target);
  } else {
    d.target = 1; d.type = null; d.name = 'Зверь Диких земель';
    d.desc = 'Победите хозяина любого логова в Диких землях (отмечено на карте Диких земель черепом).';
    d.gold = Math.round(160+player.level*45); d.potions = 3;
  }
  d.gold = Math.max(25, d.gold); d.xp = Math.round(d.gold*0.6); if(d.target>=10 || d.gold>400) d.potions++;
  return d;
}
function gqBase(d){
  const s = player.stat || {};
  if(d.kind==='herb') return s.herbs||0;
  if(d.kind==='fish') return s.fish||0;
  if(d.kind==='wild') return wildSeenCount();
  if(d.kind==='wildb') return (player.wild && player.wild.bosses)||0;
  return 0;
}
function gqTake(d){
  if(player.quest) return false;
  QUESTS[d.id] = d;
  player.quest = {id:d.id, progress:0, done:false, gen:true, def:d, base:gqBase(d)};
  return true;
}
function gqSet(n){
  const q = player.quest, d = q && q.def; if(!d || q.done) return;
  n = Math.min(d.target, Math.max(0, n)); if(n===q.progress) return;
  q.progress = n;
  if(n>=d.target){ q.done = true; addNote('📜 Поручение выполнено: «'+d.name+'». Вернитесь к торговцу!', '#7fe07f'); SFX.play('levelup'); saveGame(); }
  else addNote('📜 '+d.name+': '+n+'/'+d.target, '#e0c96a');
}
function genQuestKill(type){
  const q = player.quest; if(!q || !q.gen || q.done) return;
  const d = q.def;
  if(d.kind==='kill' && d.type===type) gqSet(q.progress+1);
  else if(d.kind==='hunt' && d.loc===currentLocId) gqSet(q.progress+1);
}
let gqAcc = 0;
function genQuestTick(dt){
  gqAcc += dt; if(gqAcc<0.5) return; gqAcc = 0;
  const q = player.quest; if(!q || !q.gen) return;
  if(!QUESTS[q.id]) QUESTS[q.id] = q.def;
  if(q.done) return;
  const d = q.def, s = player.stat || {};
  if(d.kind==='herb') gqSet((s.herbs||0)-q.base);
  else if(d.kind==='fish') gqSet((s.fish||0)-q.base);
  else if(d.kind==='wild') gqSet(wildSeenCount()-q.base);
  else if(d.kind==='wildb') gqSet(((player.wild && player.wild.bosses)||0)-q.base);
  else if(d.kind==='arena' && world.arena && world.arena.run && currentLocId==='arena'){ const R = world.arena.run; const w = R.state==='rest' ? R.wave : R.wave-1; if(w>=d.target) gqSet(d.target); }
}
function gqClaim(){
  const q = player.quest, d = q && q.def; if(!d || !q.done) return null;
  const R = {gold:d.gold};
  const r = Math.random();
  if(r<0.3) R.mats = {scrap:rnd(2,4)+Math.floor(player.level/4)}; else if(r<0.5) R.elix = 1; else if(r<0.62) R.gear = Math.random()<0.25 ? 2 : 1;
  const txt = giveReward(R);
  player.potions = Math.min(POTION_MAX, player.potions + d.potions);
  player.xp += d.xp; while(player.xp>=player.xpNext) playerLevelUp();
  const G = gqEnsure(); G.done++; bump('genq');
  G.offers = G.offers.filter(o=>o.id!==d.id); delete QUESTS[d.id];
  player.quest = null; gqEnsure();
  addNote('📜 Награда за поручение: '+txt+', +'+d.xp+' опыта', '#e0c96a'); SFX.play('levelup'); saveGame();
  return txt;
}
function gqDrop(){
  const q = player.quest; if(!q || !q.gen) return;
  delete QUESTS[q.id]; player.quest = null; saveGame();
}
function gqRefresh(){
  const G = gqEnsure(), active = player.quest && player.quest.gen ? player.quest.id : null;
  if(player.gold<GQ_REFRESH) return false;
  player.gold -= GQ_REFRESH;
  G.offers = G.offers.filter(o=>o.id===active);
  gqEnsure(); saveGame(); return true;
}
function renderGenQuests(){
  const G = gqEnsure(), act = player.quest;
  const h = document.createElement('div'); h.style.cssText = 'width:100%;text-align:left;color:#e0c23a;font-weight:bold;font-size:13px;margin:8px 0 2px';
  h.textContent = '🛡 Поручения гильдии — выполнено: '+G.done; shopList.appendChild(h);
  for(const d of G.offers){
    const reward = 'Награда: '+d.gold+' ◆, '+d.xp+' опыта, '+d.potions+' эликс.'+' и шанс на трофей.';
    let btns;
    if(act && act.id===d.id){
      btns = act.done
        ? [shopButton('Получить Вознаграждение', ()=>{ const t = gqClaim(); renderShop('Поручение выполнено: '+t+'. Появилось новое поручение.'); })]
        : [shopButton('В процессе '+act.progress+'/'+d.target, null, true), shopButton('Отменить', ()=>{ gqDrop(); renderShop('Поручение «'+d.name+'» отменено.'); })];
    } else btns = [shopButton('Взять', ()=>{ if(gqTake(d)){ saveGame(); renderShop('Поручение принято: «'+d.name+'».'); } }, !!act)];
    shopRow('📜 '+d.name, d.desc+' '+reward+(act && act.id!==d.id ? ' (сначала завершите текущее задание)' : ''), btns);
  }
  shopRow('🔄 Новые поручения', 'Торговец найдёт другие поручения. Стоимость '+GQ_REFRESH+' ◆. Взятое задание остаётся.', [shopButton('Обновить — '+GQ_REFRESH+' ◆', ()=>{ renderShop(gqRefresh() ? 'Список поручений обновлён.' : 'Не хватает золота: нужно '+GQ_REFRESH+' ◆.'); }, player.gold<GQ_REFRESH)]);
}
