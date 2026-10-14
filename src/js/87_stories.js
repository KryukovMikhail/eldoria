// ---------- Мини-истории: жители просят о помощи ----------
// steps: find — поговорить с персонажем в локации; collect — подобрать предметы; return — вернуться к тому, кто просил.
const STORIES = {
  lost_boy:{ title:'Пропавший мальчишка', need:0, rumor:'В городе кто-то тревожно ищет пропавшего ребёнка…',
    giver:{name:'Горан Железнорук', col:'#8a5a3a'},
    offer:['— Эй, путник! Тебе не встречался мальчишка лет двенадцати? Мой Тиль ушёл за светящимися грибами в Грот Шорохов и не вернулся.','Третий день не сплю. Сходи туда, найди его — а я уж не поскуплюсь: кую хорошие вещи.'],
    waiting:'Нашёл Тиля? Грот Шорохов, дальше логова Мортракса…',
    steps:[ {kind:'find', loc:'dungeon1', npc:{name:'Тиль', col:'#d6a93a'}, hint:'Найдите мальчика Тиля в Гроте Шорохов.', talk:['— Ой! Вы от папы? Я… заплутал, а факел погас.','Скажите отцу, что со мной всё хорошо. Я выберусь следом, честно!']},
            {kind:'return', hint:'Вернитесь к Горану Железноруку в городе.', talk:['— Тиль дома?! Слава предкам…','Держи, это не плата — благодарность. И обломки хорошей стали: пригодятся у кузнеца.']} ],
    reward:{gold:160, mats:{scrap:6}, gear:1}, doneText:'Горан получил сына обратно и щедро отблагодарил вас.' },
  letter:{ title:'Письмо в Пустошь', need:1, rumor:'У аптекарши есть письмо, которое некому отнести…',
    giver:{name:'Мариэль Травница', col:'#7a4a9a'},
    offer:['— Ах, как кстати! У меня письмо для старого друга, караванщика Брама. Он торгует где-то в Пустоши Зарахаб.','Донесёшь? Он расплатится — он всегда держит слово.'],
    waiting:'Письмо всё ещё у тебя? Брам ждёт в Пустоши Зарахаб.',
    steps:[ {kind:'find', loc:'desert', npc:{name:'Брам-караванщик', col:'#b8742e'}, hint:'Передайте письмо Браму в Пустоши Зарахаб.', talk:['— Письмо от Мариэль? Ха! Давно от неё вестей не было.','Прочту потом. А тебе — за труды. Бери, не стесняйся.']} ],
    reward:{gold:260, elix:1, mats:{scrap:4}}, doneText:'Письмо доставлено, Брам рассчитался сполна.' },
  ore:{ title:'Алая руда', need:3, rumor:'Угольщик жалуется, что остался без руды…',
    giver:{name:'Тарн Угольщик', col:'#5a5a64'},
    offer:['— Горнило стынет! Мне нужна алая руда из Кузней Гхарраш — пять кусков. В тех пещерах жарко, а твари злые.','Принесёшь — перекую твоё снаряжение так, что враги заплачут.'],
    waiting:'Алой руды ещё не хватает? Кузни Гхарраш, пять кусков.',
    steps:[ {kind:'collect', loc:'lava', n:5, item:'Алая руда', hint:'Соберите алую руду в Кузнях Гхарраш.'},
            {kind:'return', hint:'Отнесите руду Тарну Угольщику в город.', talk:['— Ха! Горит как надо! Вот это руда.','Бери награду и эти заготовки. Заходи ещё.']} ],
    reward:{gold:420, mats:{scrap:8, essence:3}, gear:1}, doneText:'Тарн снова раздул горнило — и не остался в долгу.' },
  locket:{ title:'Медальон на погосте', need:6, rumor:'Вдова с погоста просит найти фамильную вещь…',
    giver:{name:'Эйра Вдовица', col:'#6a6a8a'},
    offer:['— Мой муж лежит на Погосте Увядших Звёзд. Я обронила там медальон — единственное, что от него осталось.','Принеси его, умоляю. Там неспокойно, береги себя.'],
    waiting:'Медальон всё ещё на Погосте Увядших Звёзд…',
    steps:[ {kind:'collect', loc:'grave', n:1, item:'Серебряный медальон', hint:'Найдите серебряный медальон на Погосте Увядших Звёзд.'},
            {kind:'return', hint:'Верните медальон Эйре Вдовице в городе.', talk:['— Он… он самый! Спасибо тебе.','Пусть это поможет тебе в пути.']} ],
    reward:{gold:700, mats:{essence:4, crystal:1}, gear:2}, doneText:'Эйра вновь держит память о муже в руках.' }
};
function storyState(id){
  const S = STORIES[id], st = player.stories && player.stories[id];
  if(st) return st.done ? 'done' : 'active';
  return S.need<=storyStage() ? 'avail' : 'locked';
}
function curStep(id){ const st = player.stories[id]; return st && !st.done ? STORIES[id].steps[st.step] : null; }
function npcsOf(L){ return L.npcs || (L.npcs = []); }
function findNpc(L, sid, role){ return npcsOf(L).find(n=>n.sid===sid && n.role===role); }
function storySpot(L, town){
  const T = TILE, W = L.width, H = L.height, bad = L.type==='overworld' ? '~^#SBo' : '#LSBo';
  const sx = Math.floor(L.spawn.x/T), sy = Math.floor(L.spawn.y/T);
  const seen = floodFrom(L.grid, sx, sy, bad), P = town && townPaths ? townPaths(L) : null;
  const used = npcsOf(L).map(n=>[n.x,n.y]);
  for(let tries=0; tries<1500; tries++){
    const x = rnd(3,W-4), y = rnd(3,H-4);
    if(L.grid[y][x]!=='.' || !seen[x+y*W]) continue;
    if(P && !P[y][x]) continue;
    if(!town && Math.hypot(x-sx,y-sy)<(tries<700 ? 10 : 6)) continue;
    if(L.exit && Math.hypot(x-L.exit.tx,y-L.exit.ty)<5) continue;
    let ok = true; for(let dy=-1;dy<=1&&ok;dy++) for(let dx=-1;dx<=1;dx++){ const t = L.grid[y+dy] && L.grid[y+dy][x+dx]; if(!t || bad.includes(t)){ ok = false; break; } }
    if(!ok && tries<1100) continue;
    if(used.some(u=>Math.hypot(u[0]-x*T,u[1]-y*T)<TILE*3)) continue;
    if((L.props && L.props.some(q=>Math.hypot(q.x-(x*T+9),q.y-(y*T+9))<30)) || (L.traps && L.traps.some(q=>Math.hypot(q.x-(x*T+9),q.y-(y*T+9))<30))) continue;
    return {x:x*T+9, y:y*T+9};
  }
  return {x:L.spawn.x, y:L.spawn.y};
}
function addNpc(L, sid, role, def, town){
  const p = storySpot(L, town);
  npcsOf(L).push({sid, role, name:def.name, col:def.col, x:p.x, y:p.y, w:14, h:14, face:1});
}
function storiesEnsure(){
  if(!player.stories || !world.town) return;
  for(const id of Object.keys(STORIES)){
    const S = STORIES[id], state = storyState(id), st = player.stories[id];
    if(state==='avail' || (state==='active' && curStep(id) && curStep(id).kind==='return')){
      if(!findNpc(world.town, id, 'giver')) addNpc(world.town, id, 'giver', S.giver, true);
    }
    if(state==='active'){
      const step = curStep(id), L = step && step.loc && world[step.loc];
      if(step && step.kind==='find' && L && !findNpc(L, id, 'target')) addNpc(L, id, 'target', step.npc, false);
      if(step && step.kind==='collect' && L){
        const have = L.items.filter(i=>i.type==='sitem' && i.sid===id).length, need = step.n - (st.n||0);
        for(let i=have;i<need;i++){ const p = storySpot(L,false); L.items.push({type:'sitem', sid:id, name:step.item, x:p.x-8, y:p.y-8, w:16, h:16}); }
      }
    }
    if(state==='done') for(const L of Object.values(world)){ if(L.npcs) L.npcs = L.npcs.filter(n=>n.sid!==id); if(L.items) L.items = L.items.filter(i=>i.sid!==id); }
  }
}
function storyTarget(id){
  const step = curStep(id); if(!step) return null;
  const S = STORIES[id], here = loc;
  if(step.kind==='return'){
    if(currentLocId==='town'){ const n = findNpc(world.town, id, 'giver'); if(n) return {loc:'town', x:n.x+7, y:n.y, label:S.giver.name}; }
    return {loc:'town', label:S.giver.name};
  }
  if(currentLocId===step.loc){
    if(step.kind==='find'){ const n = findNpc(loc, id, 'target'); if(n) return {loc:step.loc, x:n.x+7, y:n.y, label:n.name}; }
    else { const pcx = player.x, pcy = player.y; let b = null, bd = 1e9; for(const i of loc.items) if(i.type==='sitem' && i.sid===id){ const d = Math.hypot(i.x-pcx,i.y-pcy); if(d<bd){ bd = d; b = i; } } if(b) return {loc:step.loc, x:b.x+8, y:b.y+8, label:step.item}; }
    return {loc:step.loc, label:locLabel(step.loc)};
  }
  return {loc:step.loc};
}
function storyJournalText(id){
  const step = curStep(id), st = player.stories[id]; if(!step) return '';
  const where = step.loc ? locLabel(step.loc) : locLabel('town');
  return step.hint+(step.kind==='collect' ? ' Собрано: '+(st.n||0)+'/'+step.n+'.' : '')+' Место: '+where+'.';
}
function giveReward(R){
  const out = [];
  if(R.gold){ player.gold += R.gold; out.push('+'+R.gold+' ◆'); }
  if(R.mats) for(const k in R.mats){ player.mats[k] = (player.mats[k]||0)+R.mats[k]; out.push('+'+R.mats[k]+' '+MAT_INFO[k].n.toLowerCase()); }
  if(R.elix){ const k = ELIX_KEYS[rnd(0,4)]; player.elix[k] = Math.min(ELIX_MAX, player.elix[k]+R.elix); out.push(ELIX[k].name.toLowerCase()); }
  if(R.gear!==undefined){
    if(player.bag.length<BAG_MAX){ const g = makeGear(Math.max(3,storyStage()+1), R.gear); player.bag.push(g); out.push(g.name+' ('+RAR[g.rar].n.toLowerCase()+')'); }
    else { player.gold += 80; out.push('+80 ◆ вместо снаряжения'); }
  }
  return out.join(', ');
}
function finishStory(id){
  const S = STORIES[id], st = player.stories[id]; st.done = true;
  const txt = giveReward(S.reward);
  addNote('✔ История завершена: «'+S.title+'». '+txt, '#7fe07f'); SFX.play('levelup');
  storiesEnsure(); saveGame();
}
function advanceStory(id){
  const S = STORIES[id], st = player.stories[id]; st.step++; st.n = 0;
  if(st.step>=S.steps.length){ finishStory(id); return; }
  addNote('📜 «'+S.title+'»: '+S.steps[st.step].hint, '#9ad0ff'); SFX.play('pickup');
  storiesEnsure(); saveGame();
}
function talkNpc(n){
  const S = STORIES[n.sid], st = player.stories[n.sid];
  if(!S) return;
  if(n.role==='giver'){
    if(!st){
      showDialog(n.name, S.offer, 'Принять', ()=>{ player.stories[n.sid] = {step:0, n:0}; player.track = 'story:'+n.sid; addNote('📜 Новая история: «'+S.title+'». Она в журнале (J)', '#9ad0ff'); SFX.play('levelup'); storiesEnsure(); saveGame(); });
    } else if(!st.done){
      const step = S.steps[st.step];
      if(step.kind==='return') showDialog(n.name, step.talk, 'Спасибо', ()=>advanceStory(n.sid));
      else showDialog(n.name, ['— '+S.waiting], 'Хорошо');
    }
  } else if(n.role==='target'){
    const step = curStep(n.sid);
    if(step && step.kind==='find') showDialog(n.name, step.talk, 'Дальше', ()=>advanceStory(n.sid));
  }
}
function storiesTick(dt){
  if(!player.stories) return;
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(const n of (loc.npcs||[])){
    const d = Math.hypot(pcx-(n.x+7), pcy-(n.y+7));
    if(d>120) n.lock = false;
    else if(d<46 && !n.lock){ n.lock = true; talkNpc(n); return; }
  }
  let picked = false;
  loc.items = loc.items.filter(it=>{
    if(it.type!=='sitem' || !overlap(it, {x:player.x,y:player.y,w:player.w,h:player.h})) return true;
    const st = player.stories[it.sid], step = curStep(it.sid); if(!st || !step){ return false; }
    st.n = (st.n||0)+1; picked = true; SFX.play('pickup');
    if(st.n>=step.n){ addNote('📜 '+it.name+': собрано '+st.n+'/'+step.n+'. Возвращайтесь к просившему.', '#9ad0ff'); advanceStory(it.sid); }
    else addNote('📜 '+it.name+': '+st.n+'/'+step.n, '#9ad0ff');
    return false;
  });
  if(picked) saveGame();
}
function drawStoryNpc(n, camX, camY){
  const x = n.x-camX+7, y = n.y-camY+14;
  if(x<-40||y<-60||x>canvas.width+40||y>canvas.height+40) return;
  const t = Date.now()/1000, st = player.stories && player.stories[n.sid];
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,1,7,2.4); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-4,-4,3,5); ctx.fillRect(1,-4,3,5);
  ctx.fillStyle = n.col; rrect(-5.5,-14,11,12,3); ctx.fill(); ctx.stroke();
  ctx.fillRect(-7.5,-13,2.4,8); ctx.fillRect(5.1,-13,2.4,8);
  ctx.fillStyle = '#e0b890'; circ(0,-19,5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a3220'; ctx.beginPath(); ctx.arc(0,-20,5.2,Math.PI,0); ctx.fill();
  ctx.fillStyle = '#2a1a10'; circ(1.6,-19,0.8); ctx.fill();
  const hasTalk = n.role==='giver' ? (!st || (!st.done && curStep(n.sid) && curStep(n.sid).kind==='return')) : true;
  if(hasTalk){
    const bob = Math.sin(t*4+n.x)*2; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    const mark = n.role==='giver' && st ? '?' : '!'; ctx.strokeText(mark,0,-30+bob); ctx.fillStyle = '#ffd34a'; ctx.fillText(mark,0,-30+bob);
  }
  const pd = Math.hypot(player.x+11-(n.x+7), player.y+11-(n.y+7));
  if(pd<130){ ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText(n.name,0,-40); ctx.fillStyle = '#fff'; ctx.fillText(n.name,0,-40); }
  ctx.restore();
}
function drawStoryItem(it, camX, camY){
  const sx = it.x-camX, sy = it.y-camY; if(sx<-30||sy<-30||sx>canvas.width+30||sy>canvas.height+30) return;
  const t = Date.now()/1000, bob = Math.sin(t*3+it.x)*1.5, locket = it.name.indexOf('едальон')>=0;
  const gl = ctx.createRadialGradient(sx+8,sy+8,1,sx+8,sy+8,17); gl.addColorStop(0,locket?'rgba(220,230,255,0.8)':'rgba(255,120,60,0.8)'); gl.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx+8,sy+8+bob,17,0,6.283); ctx.fill();
  ctx.save(); ctx.translate(sx+8,sy+8+bob); ctx.lineWidth = 1.4; ctx.strokeStyle = '#2a1208';
  if(locket){ ctx.strokeStyle = '#8a92a8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4,-9); ctx.quadraticCurveTo(0,-3,4,-9); ctx.stroke(); ctx.strokeStyle = '#3a4258'; ctx.fillStyle = '#d8dee8'; circ(0,1,5.6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8aa0d8'; circ(0,1,2.6); ctx.fill(); }
  else { ctx.fillStyle = '#c0391c'; ctx.beginPath(); ctx.moveTo(-6,3); ctx.lineTo(-3,-6); ctx.lineTo(3,-7); ctx.lineTo(7,0); ctx.lineTo(4,6); ctx.lineTo(-2,7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff9a4a'; ctx.beginPath(); ctx.moveTo(-3,-4); ctx.lineTo(1,-5); ctx.lineTo(2,-1); ctx.lineTo(-2,0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
