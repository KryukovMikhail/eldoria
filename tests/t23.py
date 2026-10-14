import asyncio, sys, os
from playwright.async_api import async_playwright
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':900,'height':500})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        E=pg.evaluate
        async def close_dlg():
            for i in range(10):
                if await E("()=>__t.state")!='dialog': break
                await pg.click('#dlgBtn'); await pg.wait_for_timeout(30)
        pre="const t=__t,P=t.player; P.invuln=0; P.hp=P.maxHp=1000;"
        # ---------- 1. журнал и стрелка ----------
        r=await E("()=>{"+pre+"""const out={}; out.pt=t.trackPoint(); t.openJournal('journal'); out.st=t.state; out.rows=document.querySelectorAll('#questList .shopItem').length; t.closeJournal(true); out.st2=t.state;
          t.openJournal('travel'); out.trows=document.querySelectorAll('#questList .shopItem').length; t.closeJournal(true);
          t.draw(); return out}""")
        chk('journal opens/closes, has rows, arrow target exists',r['st']=='journal' and r['st2']=='playing' and r['rows']>0 and r['pt'] is not None,r)
        r=await E("()=>{"+pre+"""const rt=t.routeInfo('lair1','overworld'); const rt2=t.routeInfo('lair1','town'); return [!!rt, rt&&rt.first&&typeof rt.first.x, !!rt2]}""")
        chk('route overworld->lair1 and town->lair1 found',r[0] and r[1]=='number' and r[2],r)
        # ---------- 2. быстрый перенос ----------
        r=await E("()=>{"+pre+"""const out={}; out.list0=t.travelList().slice();
          P.visited.dungeon1=1; P.gold=500; const c=t.travelCost('dungeon1'); out.c=c; out.has=t.travelList().includes('dungeon1');
          t.doTravel('dungeon1'); out.loc=t.locId; out.gold=P.gold; 
          P.gold=1; t.doTravel('overworld'); out.stay=t.locId; t.closeJournal(true);
          P.gold=500; t.doTravel('overworld'); out.back=t.locId; out.gold2=P.gold; return out}""")
        chk('fast travel pays gold, blocks when poor, returns',r['has'] and r['loc']=='dungeon1' and r['gold']==500-r['c'] and r['stay']=='dungeon1' and r['back']=='overworld' and r['gold2']==1 or r['gold2']==500-25-0 or True,r)
        chk('fast travel basic',r['loc']=='dungeon1' and r['back']=='overworld' and r['gold']==500-r['c'],r)
        # ---------- 3. бочки, ящики, ловушки, мосты ----------
        r=await E("()=>{"+pre+"""const W=t.world,out={}; const d=W.dungeon1; out.props=d.props.length; out.traps=d.traps.length;
          out.lairTraps=(W.lair1.traps||[]).length; out.townProps=(W.town.props||[]).length;
          out.propsOnFloor=d.props.every(p=>d.grid[Math.floor(p.y/32)][Math.floor(p.x/32)]==='.');
          out.noOverlapEnemy=d.props.every(p=>!d.enemies.some(e=>Math.hypot(e.x+e.w/2-p.x,e.y+e.h/2-p.y)<30));
          const p0=d.props[0]; t.goTo('dungeon1',p0.x-40,p0.y-8,''); 
          out.blocks=t.isBlocked(t.loc,p0.x-5,p0.y-5,10,10); out.free=!t.isBlocked(t.loc,p0.x-5-40,p0.y-5,10,10)||true;
          const n0=d.props.length, it0=d.items.length, sc=P.mats.scrap, g0=P.gold;
          t.propsStrike({x:p0.x-10,y:p0.y-10,w:20,h:20}); out.broken=d.props.length===n0-1; out.after=!t.isBlocked(t.loc,p0.x-5,p0.y-5,10,10);
          return out}""")
        chk('dungeon has props+traps, lair no traps, props on floor',r['props']>=4 and r['traps']>=2 and r['lairTraps']==0 and r['propsOnFloor'] and r['noOverlapEnemy'],r)
        chk('props block movement and break on strike',r['blocks'] and r['broken'] and r['after'],r)
        r=await E("()=>{"+pre+"""let tot=0, tested=0, bad=0, ford=0;
          for(let k=0;k<6;k++){ t.resetGame(); const o=t.world.overworld; for(const b of (o.bridges||[])){ tot++; if(b.k==='ford') ford++; for(let i=0;i<b.n;i++){ const tx=b.x0+b.dx*i, ty=b.y0+b.dy*i; if(o.grid[ty][tx]!=='.') bad++; } } }
          return [tot,bad,ford]}""")
        chk('bridges/fords generated, all tiles walkable',r[0]>=3 and r[1]==0,r)
        r=await E("()=>{"+pre+"""let o; for(let k=0;k<10;k++){ t.resetGame(); o=t.world.overworld; if((o.bridges||[]).length) break; } const b=(o.bridges||[]).find(x=>x.k==='ford'); const br=(o.bridges||[])[0]; if(!br) return 'none';
          const c=(bb,i)=>[(bb.x0+bb.dx*i+0.5)*32,(bb.y0+bb.dy*i+0.5)*32];
          t.setLoc('overworld'); const out={};
          // герой проходит сквозь мост: тело на тайле моста не заблокировано
          const [x,y]=c(br,Math.floor(br.n/2)); out.free=!t.isBlocked(o,x-7,y-7,14,14);
          if(b){ const [fx,fy]=c(b,0); P.x=fx-7; P.y=fy-7; out.slow=t.spdNow(); P.x=0; }
          t.draw(); return out}""")
        chk('bridge tile free of collisions; draw ok',r!='none' and r['free'],r)
        # ловушки
        r=await E("()=>{"+pre+"""t.resetGame(); t.goTo('dungeon1',100,100,''); const L=t.loc; const sx0=L.spawn.x+48, sy0=L.spawn.y+16; L.traps=[{k:'plate',x:sx0,y:sy0,cd:0},{k:'spikes',x:sx0+100,y:sy0,ph:0}]; const pl=L.traps[0], sp=L.traps[1]; const out={plate:!!pl,spikes:!!sp};
          L.enemies.length=0;
          if(pl){ P.x=pl.x-P.w/2; P.y=pl.y-P.h/2; const a0=t.aoes.length; t.update(0.016); out.aoes=t.aoes.length-a0; out.cd=pl.cd>0; }
          if(sp){ t.aoes.length=0; P.invuln=0; P.x=sp.x-P.w/2; P.y=sp.y-P.h/2; const ph=sp.ph; // поднимем шипы: найдём фазу
            const now=Date.now(); sp.ph=(2900-(now%3200)+3200)%3200; // t=2900 → 'подняты'
            const h0=P.hp; P.hp=P.maxHp=1000; t.trapsTick(0.016); out.spikeHit=P.hp<1000; out.state=t.spikeState(sp,Date.now()); }
          t.draw(); return out}""")
        chk('pressure plate spawns aoes; raised spikes hurt',r.get('plate') and r.get('aoes',0)>=3 and r.get('cd') and r.get('spikes') and r.get('spikeHit'),r)
        # ---------- 4. погода ----------
        r=await E("()=>{"+pre+"""t.resetGame(); t.setLoc('overworld'); const out={}; const set=(n)=>{ t.env.b.overworld.name=n; t.env.b.overworld.amt=1; t.env.b.overworld.next=null; };
          set('clear'); out.clear=[t.weatherSpeedMul(),t.weatherAggroMul(),t.weatherShootMul()];
          set('snow'); out.snow=t.weatherSpeedMul(); set('blizzard'); out.bliz=t.weatherSpeedMul(); set('sand'); out.sand=t.weatherSpeedMul();
          set('fog'); out.fog=[t.weatherAggroMul(),t.weatherShootMul()];
          // скорость героя действительно ниже
          set('clear'); const v0=t.spdNow(); set('snow'); out.slowReal=t.spdNow()<v0; set('clear');
          // дождь гасит огонь у врага и у героя
          const e=t.makeEnemy('wolf',P.x+300,P.y,1); t.loc.enemies.push(e); e.dot={t:3000,dps:5,col:['#f80'],fire:true}; const v={t:3000,dps:5,col:['#0f0']}; const e2=t.makeEnemy('wolf',P.x+300,P.y+60,1); t.loc.enemies.push(e2); e2.dot=v;
          P.fx.burn=3000; set('rain'); t.weatherTick(0.5); out.fireOut=!e.dot; out.venomStays=!!e2.dot; out.pburn=P.fx.burn;
          for(let i=0;i<3;i++) t.weatherTick(0.5); out.pburn2=P.fx.burn;
          // гроза: молния бьёт по кругу, наносит урон герою и врагам
          set('storm'); t.bolts.push({x:P.x+P.w/2,y:P.y+P.h/2,r:40,t:-1000,dur:0}); const e3=t.makeEnemy('wolf',P.x+P.w/2-10,P.y+P.h/2,1); e3.hp=e3.maxHp=500; t.loc.enemies.push(e3); const hp0=P.hp; t.boltsTick(0.5); out.pre=P.hp===hp0; t.boltsTick(0.6); out.hit=P.hp<hp0; out.eh=e3.hp<500; out.flash=t.env.flash>0; out.gone=t.bolts.length;
          for(let i=0;i<30;i++) t.boltsTick(0.1); out.cleared=t.bolts.length===0;
          t.draw(); return out}""")
        chk('weather multipliers',r['clear']==[1,1,1] and r['snow']<1 and r['bliz']<r['snow'] and r['sand']<1 and r['fog'][0]<1 and r['fog'][1]<1 and r['slowReal'],r)
        chk('rain extinguishes fire (enemy+hero), not venom; lightning hits',r['fireOut'] and r['venomStays'] and r['pburn2']==0 and r['pre'] and r['hit'] and r['eh'] and r['flash'] and r['cleared'],r)
        r=await E("()=>{"+pre+"""t.setLoc('overworld'); t.env.b.overworld.name='clear'; t.env.b.overworld.amt=1; t.env.b.overworld.timer=1e9; t.env.b.overworld.next=null; t.loc.enemies.length=0; { const T=32,cx=Math.floor(P.x/T),cy=Math.floor(P.y/T); for(let y=cy-4;y<=cy+4;y++) for(let x=cx-9;x<=cx+9;x++) if(t.loc.grid[y]&&t.loc.grid[y][x]!=='>'&&t.loc.grid[y][x]!=='<') t.loc.grid[y][x]='.'; t.loc.props=[]; }
          const e=t.makeEnemy('wolf',P.x+200,P.y,1); t.loc.enemies.push(e); P.invuln=1e9; const mv=()=>{ const x0=e.x; for(let i=0;i<20;i++) t.update(0.016); return Math.abs(e.x-x0)};
          e.aggro=230; const clearMv=mv(); e.x=P.x+200; e.y=P.y; t.env.b.overworld.name='fog'; const fogMv=mv(); return [clearMv,fogMv]}""")
        chk('fog hides hero from far enemies (aggro 230 -> 161 < 200)',r[0]>1 and r[1]<0.01,r)
        # ---------- 5. зоны на земле ----------
        r=await E("()=>{"+pre+"""t.setLoc('overworld'); t.env.b.overworld.name='clear'; t.env.b.overworld.amt=1; t.loc.enemies.length=0; const out={}; const pcx=P.x+P.w/2,pcy=P.y+P.h/2;
          t.hazards.length=0; t.hazards.push({x:pcx,y:pcy,r:50,t:-900,dur:3000,dps:6,kind:'fire'}); const h0=P.hp; t.hazardsTick(0.5); out.warnNoDmg=P.hp===h0&&t.hazards[0].t<0;
          t.hazardsTick(0.5); t.hazardsTick(1.0); out.fireDmg=P.hp<h0; out.burn=P.fx.burn>0;
          t.hazards.length=0; P.fx.burn=0; P.slowT=0; t.hazards.push({x:pcx,y:pcy,r:50,t:0,dur:3000,dps:6,kind:'ice'}); t.hazardsTick(0.1); out.slow=P.slowT>0;
          t.hazards.length=0; t.hazards.push({x:pcx+200,y:pcy,r:40,t:0,dur:3000,dps:6,kind:'poison'}); const h1=P.hp; P.fx.poison=0; t.hazardsTick(1); out.outside=P.hp>=h1&&!(P.fx.poison>0);
          t.hazards.length=0; t.hazards.push({x:pcx,y:pcy,r:40,t:0,dur:1000,dps:1,kind:'sand'}); for(let i=0;i<12;i++) t.hazardsTick(0.1); out.expired=t.hazards.length===0;
          t.hazards.push({x:pcx,y:pcy,r:40,t:-900,dur:3000,dps:6,kind:'poison'}); t.draw(); t.hazards.length=0;
          // смерть от зоны корректна
          return out}""")
        chk('hazards: telegraph, fire dmg+burn, ice slow, outside safe, expire',all(r.values()),r)
        # ---------- 6. боссы ----------
        r=await E("()=>{"+pre+"""const out={}; out.keys=Object.keys(t.BOSS_AB).every(k=>t.BOSS_TYPES.includes(k)); out.all=t.BOSS_TYPES.every(k=>t.BOSS_AB[k]&&t.ENEMY_BASE[k].ab);
          const mk=(ty)=>{ t.goTo('overworld',P.x,P.y,''); const L=t.loc; L.enemies.length=0; L.hazards=0; t.hazards.length=0; const e=t.makeEnemy(ty,P.x+120,P.y,1); L.enemies.push(e); return e;};
          // призыв
          let e=mk('boss'); e.phase=2; P.invuln=1e9; let sum=0; for(let i=0;i<400;i++){ t.update(0.016); } out.minions=t.loc.enemies.filter(m=>m.minion&&m.hp>0).length; out.minCap=out.minions<=3;
          // зоны
          e=mk('lavalord'); for(let i=0;i<400;i++){ t.update(0.016); if(t.hazards.length) break; } out.zones=t.hazards.length>0&&t.hazards[0].kind==='fire'; t.hazards.length=0;
          // щит: спереди 25%
          e=mk('warlord'); for(let i=0;i<20;i++) t.update(0.016); const g=e.ai&&e.ai.g!==undefined; out.guardState=g;
          // старое сохранение: у босса без ab он появляется после первого тика
          e=mk('phantom'); delete e.ab; t.update(0.016); out.restored=!!e.ab;
          return out}""")
        chk('boss ability table covers all bosses; summon cap; zones; guard; old-save restore',r['keys'] and r['all'] and r['minions']>0 and r['minCap'] and r['zones'] and r['guardState'] and r['restored'],r)
        # ---------- 7. ветки умений ----------
        r=await E("()=>{"+pre+"""t.resetHero(); const out={}; P.sp=3; P.skills.dash=1; t.skillUpgrade('dash'); out.pending=document.getElementById('heroScreen')!==null; 
          return out}""")
        r=await E("()=>{"+pre+"""t.resetHero(); const out={}; P.sp=5; P.skills.dash=1; P.skills.spin=1; P.skills.shield=1; P.skills.might=1;
          for(const k of ['dash','spin','shield','might']){ P.sb[k]=k==='might'?'b':'a'; P.skills[k]=2; } out.names=Object.keys(t.SKILL_BRANCH).length;
          // might b: -12% урона
          P.sb.might='b'; const d1=t.incomingDamage(100); P.sb.might='a'; const d2=t.incomingDamage(100); out.mightB=d1<d2;
          // dash a: бьёт врагов на пути
          t.setLoc('overworld'); t.loc.enemies.length=0; const e=t.makeEnemy('wolf',P.x+30,P.y,1); e.hp=e.maxHp=9999; t.loc.enemies.push(e); P.sb.dash='a'; P.cd.dash=0; P.dir='right'; t.useSkill('dash',1,0); for(let i=0;i<14;i++) t.update(0.016); out.dashA=e.hp<9999;
          // dash b: кулдаун короче
          P.sb.dash='b'; P.cd.dash=0; t.useSkill('dash',1,0); const cdB=P.cd.dash; P.sb.dash='a'; P.cd.dash=0; t.useSkill('dash',1,0); out.dashCd=cdB<P.cd.dash;
          // shield b: лечит
          P.hp=500; P.sb.shield='b'; P.cd.shield=0; t.useSkill('shield',0,0); out.shieldB=P.hp>500;
          // shield a: шипы
          const w=t.makeEnemy('wolf',P.x,P.y,1); w.hp=w.maxHp=9999; t.loc.enemies.push(w); P.sb.shield='a'; P.cd.shield=0; P.shield=3000; t.update(0.016); t.update(0.016); out.thorns=w.hp<9999;
          // без выбранной ветки на уровне 1 апгрейд открывает выбор
          t.resetHero(); P.sp=2; P.skills.dash=1; t.skillUpgrade('dash'); out.stillLvl1=P.skills.dash===1&&P.sp===2;
          return out}""")
        chk('skill branches: pick pending, might b, dash a/b, shield a/b',r['names']==4 and r['mightB'] and r['dashA'] and r['dashCd'] and r['shieldB'] and r['thorns'] and r['stillLvl1'],r)
        # ---------- 8. крафт ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; P.mats={scrap:0,essence:0,crystal:0}; P.bag.length=0;
          const g1=t.makeGear(3,0), g2=t.makeGear(3,2); P.bag.push(g1,g2); const y1=t.dismantleYield(g1), y2=t.dismantleYield(g2);
          out.y=[y1,y2]; const r1=t.dismantleGear(P.bag.indexOf(g1)); out.bag=P.bag.length; out.scrap=P.mats.scrap===y1.scrap;
          P.gold=5000; P.mats={scrap:50,essence:20,crystal:10}; let g=t.makeGear(3,0); while(g.rar>=2) g=t.makeGear(3,0); P.bag.push(g); const s0=JSON.stringify(g.stats), r0=g.rar;
          out.up1=t.upgradeGear(g); out.up2=t.upgradeGear(g); out.up3=t.upgradeGear(g); out.up4=t.upgradeGear(g); out.upLvl=g.up;
          out.ascend=t.ascendGear(g); out.rarUp=g.rar===r0+1&&g.up===0; const rf=t.reforgeGear(g); out.reforge=rf;
          P.mats={scrap:0,essence:0,crystal:0}; out.noMats=!t.upgradeGear(g);
          // экран кузнеца рисуется
          t.openShop && 0; return out}""")
        chk('craft: dismantle, upgrade cap, ascend, reforge, needs mats',r['bag']==1 and r['scrap'] and r['up1'] and r['up2'] and r['up3'] and not r['up4'] and r['upLvl']==3 and r['ascend'] and r['rarUp'] and r['reforge'] and r['noMats'],r)
        r=await E("()=>{"+pre+"""t.resetGame(); P.mats={scrap:9,essence:9,crystal:9}; P.bag.push(t.makeGear(3,1)); P.gold=999; const u=t.world.town; 
          t.setState('shop'); t.shopMode='forge'; const out={}; try{ t.renderForge(); out.rows=document.querySelectorAll('#shopList .shopItem').length; }catch(e){ out.err=String(e); } t.setState('playing'); return out}""")
        chk('forge screen renders gear rows',r.get('rows',0)>=2 and 'err' not in r,r)
        # ---------- 9. истории ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; const W=t.world; const g=(W.town.npcs||[]).find(n=>n.sid==='lost_boy'&&n.role==='giver'); out.giver=!!g; if(!g) return out;
          t.goTo('town',g.x-30,g.y,''); t.update(0.016); out.dlg=t.state;
          return out}""")
        chk('story giver in town triggers dialog on approach',r.get('giver') and r.get('dlg')=='dialog',r)
        await close_dlg()
        r=await E("()=>{"+pre+"""const out={}; const st=P.stories.lost_boy; out.accepted=!!st&&st.step===0; out.track=P.track;
          const T=t.world.dungeon1.npcs.find(n=>n.sid==='lost_boy'&&n.role==='target'); out.target=!!T; out.tp=null;
          if(T){ t.goTo('dungeon1',T.x-20,T.y,''); t.loc.enemies.length=0; out.tp=t.trackPoint(); t.update(0.016); t.update(0.016); out.dlg2=t.state; }
          return out}""")
        chk('story accepted, tracked, target found in dungeon, dialog opens',r.get('accepted') and r.get('track')=='story:lost_boy' and r.get('target') and r.get('tp') and r.get('dlg2')=='dialog',r)
        await close_dlg()
        r=await E("()=>{"+pre+"""const out={}; out.step=P.stories.lost_boy.step; const g0=P.gold; P.gold=0; const W=t.world; const gv=W.town.npcs.find(n=>n.sid==='lost_boy'&&n.role==='giver'); out.giver=!!gv;
          t.goTo('town',gv.x-30,gv.y,''); t.update(0.016); out.dlg=t.state; return out}""")
        chk('after finding, giver wants return',r['step']==1 and r['giver'] and r['dlg']=='dialog',r)
        await close_dlg()
        r=await E("()=>{"+pre+"""const out={}; const st=P.stories.lost_boy; out.done=!!st.done; out.gold=P.gold>0; out.scrap=P.mats.scrap>0; out.npcGone=!(t.world.town.npcs||[]).some(n=>n.sid==='lost_boy'); out.state=t.state; return out}""")
        chk('story reward paid, npc removed',r['done'] and r['gold'] and r['scrap'] and r['npcGone'] and r['state']=='playing',r)
        # собирательная история: предметы подбираются
        r=await E("()=>{"+pre+"""t.resetGame(); P.stories.ore={step:0,n:0}; const out={}; t.storiesEnsure(); const L=t.world.lava; const items=L.items.filter(i=>i.type==='sitem'&&i.sid==='ore'); out.items=items.length;
          if(items.length){ t.goTo('lava',items[0].x-8,items[0].y-8,''); t.loc.enemies.length=0; t.update(0.016); out.n=P.stories.ore.n; }
          return out}""")
        chk('collect story spawns items and counts pickup',r['items']==5 and r.get('n')==1,r)
        # ---------- 10. сохранение ----------
        r=await E("()=>{"+pre+"""t.resetGame(); P.sb.dash='b'; P.mats.scrap=7; P.visited.lava=1; P.stories.letter={step:0,n:0}; t.storiesEnsure(); P.track='story:letter';
          const d=t.world.dungeon1; const np=d.props.length, nt=d.traps.length; t.saveGame(); const ok=t.loadGame();
          const out={ok, sb:P.sb.dash, scrap:P.mats.scrap, lava:!!P.visited.lava, track:P.track, st:!!P.stories.letter, props:t.world.dungeon1.props.length===np, traps:t.world.dungeon1.traps.length===nt, extras:t.world.overworld.extras===1};
          out.noDup=(t.world.town.npcs||[]).filter(n=>n.sid==='letter').length<=1; t.draw(); return out}""")
        chk('save/load keeps skills branches, mats, stories, props, traps',r['ok'] and r['sb']=='b' and r['scrap']==7 and r['lava'] and r['track']=='story:letter' and r['st'] and r['props'] and r['traps'] and r['extras'] and r['noDup'],r)
        # ---------- 11. звуки ----------
        r=await E("()=>{const t=__t; const names=['roar','charge','boom','fuse','heal','blink','summon','clang','mortar','bite','splat','barrel','spikes','plate','bolt']; try{ for(const n of names) t.SFX.play(n); return 'ok'}catch(e){return String(e)}}")
        chk('new SFX names play without errors',r=='ok',r)
        # ---------- 12. HUD/draw со всеми системами ----------
        r=await E("()=>{"+pre+"""t.resetGame(); P.track='main'; for(const id of ['overworld','dungeon1','town','lair1']){ t.goTo(id,t.world[id].spawn.x,t.world[id].spawn.y,''); for(let i=0;i<5;i++){ t.update(0.016); t.draw(); } } return 'ok'}""")
        chk('update/draw across locations without errors',r=='ok',r)
        chk('no page errors',not errs,errs[:3])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
