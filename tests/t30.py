import asyncio, sys, os, json
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
        pre="const t=__t,P=t.player; P.invuln=0; P.hp=P.maxHp=1000;"
        calm="{ const wb=t.env.b[t.locId]; if(wb){ wb.name='clear'; wb.amt=1; wb.next=null; wb.timer=1e9; } }"
        async def run(js): return await E("()=>{"+pre+js+"}")

        # ---------- 1. панель F3 и песочница ----------
        await pg.keyboard.press('F3')
        r=await run("""const o={}; o.on=t.PERF.on; for(let i=0;i<200;i++) t.perfRec(16.7, 1, 4); const s=t.perfStats(); o.fps=Math.round(s.fps); o.up=s.up; t.draw(); t.drawPerf(); return o""")
        chk('F3 toggles perf panel, stats averaged',r['on'] and 58<=r['fps']<=62 and abs(r['up']-1)<0.01,r)
        await pg.keyboard.press('F3')
        r=await run("""const o={}; o.off=!t.PERF.on; o.def=t.sandboxOn()===false; o.locked=!t.weaponUnlocked('musket');
          t.SET.sandbox=true; o.unl=t.weaponUnlocked('musket')&&t.armorUnlocked('plate');
          t.setLoc('overworld'); t.setState('playing'); P.hp=5; t.onPlayerDeath(); o.alive=t.state==='playing'&&P.hp===P.maxHp;
          t.hurtPlayer(50); P.invuln=0; t.devTick(0.016); o.healed=P.hp===P.maxHp;
          o.gate=t.entranceGate('wild')===false;
          t.openSandbox(); const sc=document.getElementById('sandboxScreen'); o.panel=!sc.classList.contains('hidden')&&t.state==='sandbox';
          const g0=P.gold; [...sc.querySelectorAll('button')].find(b=>b.textContent.indexOf('1000')>=0).click(); o.gold=P.gold===g0+1000;
          [...sc.querySelectorAll('button')].find(b=>b.textContent.indexOf('оружие')>=0).click(); o.all=Object.keys(t.WEAPONS).every(k=>P.owned[k]);
          t.closeSandbox(); o.closed=t.state==='playing';
          t.SET.sandbox=false; o.gate2=t.entranceGate('wild')===true; t.setState('playing'); return o""")
        chk('sandbox: off by default; immortal, all gear unlocked, gate open, panel actions; off again',all(r.values()),r)

        # ---------- 2. опасности местности ----------
        r=await run("""t.resetGame(); t.setState('playing'); const o={}; const w=t.world;
          o.kinds=['lava','desert','ice','grave','jungle','dungeon3'].map(id=>t.bhKind(w[id],id)).join(',');
          o.none=t.bhKind(w.overworld,'overworld')===null && t.bhKind(w.town,'town')===null && t.bhKind(w.lair1,'lair1')===null;
          let bad=0; for(const id of ['desert','jungle']){ const L=w[id], T=32; o[id+'Z']=L.bz.length; for(const z of L.bz){ const tx=Math.floor(z.x/T), ty=Math.floor(z.y/T); if(L.grid[ty][tx]!=='.') bad++; if(Math.hypot(tx-L.exit.tx,ty-L.exit.ty)<8) bad++; } }
          o.bad=bad; o.fires=w.ice.fires.length; o.home=w.ice.fires.some(f=>f.home); return o""")
        chk('hazard kinds per place, static zones on floor and away from exit, campfires in ice',r['kinds']=='geyser,quicksand,frost,hands,bog,rocks' and r['none'] and r['bad']==0 and r['desertZ']>=6 and r['jungleZ']>=6 and r['fires']>=5 and r['home'],r)
        r=await run("""const o={}; const L=t.world.lava; t.goTo('lava',L.spawn.x,L.spawn.y,''); t.setState('playing'); """+calm+"""; t.loc.enemies.length=0;
          o.grace=t.bev.length===0; const fp=t.freeSpotAround(L.spawn.x+300,L.spawn.y,P.w,P.h,0,400,80); P.x=fp.x; P.y=fp.y; P.invuln=0; P.rollT=0;
          const h0=P.hp; t.bev.push({x:P.x+P.w/2,y:P.y+P.h/2,r:36,t:-50,warn:1000,dur:1300,kind:'geyser',hit:false});
          const e=t.makeEnemy('slime',P.x+4,P.y+4,1); e.hp=e.maxHp=5; e.speed=0; e.aggro=1; t.loc.enemies.push(e);
          for(let i=0;i<10;i++) t.biomeHazardsTick(0.016);
          o.hurt=P.hp<h0; o.burn=P.fx.burn>0; o.enemy=e.hp<=0; o.note=!!(P.bhSeen&&P.bhSeen.geyser);
          P.invuln=0; t.bhCd=0; t.biomeHazardsTick(0.016); o.spawned=t.bev.length>=1&&t.bev[t.bev.length-1].t<0; return o""")
        chk('geysers: grace on arrival, warn then erupt, hurt+burn hero and enemies, spawn near hero',all(r.values()),r)
        r=await run("""const o={}; const L=t.world.desert; t.goTo('desert',L.spawn.x,L.spawn.y,''); t.setState('playing'); """+calm+"""; t.loc.enemies.length=0;
          const z=L.bz[0]; P.x=z.x-P.w/2; P.y=z.y-P.h/2; P.slowT=0; P.invuln=0; const h0=P.hp;
          for(let i=0;i<60;i++) t.biomeHazardsTick(0.05); o.slow=P.slowT>0; o.sink=P.hp<h0;
          const J=t.world.jungle; t.goTo('jungle',J.spawn.x,J.spawn.y,''); t.setState('playing'); const zj=J.bz[0]; P.x=zj.x-P.w/2; P.y=zj.y-P.h/2; P.fx.poison=0; t.biomeHazardsTick(0.05); o.poison=P.fx.poison>0; return o""")
        chk('quicksand slows then sinks, bog poisons',all(r.values()),r)
        r=await run("""const o={}; const L=t.world.ice; t.goTo('ice',L.spawn.x,L.spawn.y,''); t.setState('playing'); """+calm+"""; t.loc.enemies.length=0;
          const f=L.fires.find(q=>!q.home); const keepF=L.fires, keepM=t.loc.merchant; L.fires=[f]; t.loc.merchant=null; const fp=t.freeSpotAround(f.x+400,f.y,P.w,P.h,0,300,80); P.x=fp.x; P.y=fp.y; P.cold=0;
          for(let i=0;i<100;i++) t.biomeHazardsTick(0.5); o.cold=P.cold>=99; const h0=P.hp; for(let i=0;i<30;i++) t.biomeHazardsTick(0.1); o.freeze=P.hp<h0;
          P.x=f.x-P.w/2+20; P.y=f.y-P.h/2; for(let i=0;i<10;i++) t.biomeHazardsTick(0.5); o.warm=P.cold<=0; L.fires=keepF; t.loc.merchant=keepM;
          t.drawColdHUD(); t.draw(); return o""")
        chk('frost meter rises away from fire, freezing hurts, campfire warms',all(r.values()),r)
        r=await run("""const o={}; const L=t.world.grave; t.goTo('grave',L.spawn.x,L.spawn.y,''); t.setState('playing'); t.loc.enemies.length=0; P.invuln=0; P.slowT=0;
          t.bev.push({x:P.x+P.w/2,y:P.y+P.h/2,r:32,t:-10,warn:1000,dur:700,kind:'hands',hit:false}); t.biomeHazardsTick(0.05); o.slow=P.slowT>1000;
          const D=t.world.dungeon3; t.goTo('dungeon3',D.spawn.x,D.spawn.y,''); t.setState('playing'); P.invuln=0; const h0=P.hp;
          t.bev.push({x:P.x+P.w/2,y:P.y+P.h/2,r:30,t:-10,warn:1100,dur:700,kind:'rocks',hit:false}); t.biomeHazardsTick(0.05); o.rock=P.hp<h0;
          for(let i=0;i<60;i++) t.biomeHazardsTick(0.05); o.cleared=t.bev.length===0;
          t.saveGame(); const ok=t.loadGame(); o.saved=ok&&t.world.desert.bz.length>0&&t.world.ice.fires.length>0; return o""")
        chk('grave hands hold, cave rocks hit, effects expire, zones survive save/load',all(r.values()),r)
        r=await run("""const o={}; for(const id of ['lava','desert','ice','grave','jungle','dungeon3']){ const L=t.world[id]; t.goTo(id,L.spawn.x,L.spawn.y,''); t.setState('playing'); t.bhCd=0; P.invuln=1e9; for(let i=0;i<90;i++){ t.update(1/60); } t.draw(); } o.ok=t.state==='playing'; return o""")
        chk('update/draw in all hazard places',r['ok'],r)

        # ---------- 3. генератор заданий ----------
        r=await run("""t.resetGame(); t.setState('playing'); const o={}; const G=t.gqEnsure(); o.offers=G.offers.length===3;
          const many=[]; for(let i=0;i<60;i++) many.push(t.gqMake()); o.valid=many.every(d=>d.name&&d.desc&&d.target>0&&d.gold>0&&d.xp>0);
          o.kinds=[...new Set(many.map(d=>d.kind))].sort().join(',');
          const d=t.gqMake('kill'); G.offers[0]=d; o.taken=t.gqTake(d); o.reg=!!t.QUESTS[d.id]; o.block=t.gqTake(G.offers[1])===false;
          for(let i=0;i<d.target-1;i++) t.questKill(d.type); o.part=P.quest.progress===d.target-1&&!P.quest.done;
          t.questKill('nonexistent'); o.other=P.quest.progress===d.target-1;
          t.saveGame(); t.loadGame(); t.setState('playing'); t.genQuestTick(1); o.loaded=P.quest&&P.quest.gen&&!!t.QUESTS[P.quest.id];
          t.questKill(d.type); o.done=P.quest.done;
          const g0=P.gold, x0=P.xp+P.level*1e6; t.gqClaim(); o.paid=P.gold>=g0+d.gold&&P.quest===null&&t.gqEnsure().done===1&&t.gqEnsure().offers.length===3&&!t.gqEnsure().offers.some(q=>q.id===d.id)&&!t.QUESTS[d.id];
          return o""")
        chk('guild quests: 3 offers, valid templates, take/progress/save/claim/replace',all(v for k,v in r.items() if k!='kinds') and 'kill' in r['kinds'] and 'hunt' in r['kinds'],r)
        r=await run("""const o={}; const G=t.gqEnsure(); P.stat.herbs=5; const h=t.gqMake('herb'); G.offers[0]=h; t.gqTake(h); P.stat.herbs+=h.target; t.genQuestTick(1); o.herb=P.quest.done; t.gqClaim();
          const u=t.gqMake('hunt'); u.loc=t.locId; u.target=2; G.offers[0]=u; t.gqTake(u); t.questKill('wolf'); t.questKill('bat'); o.hunt=P.quest.done; t.gqClaim();
          const k=t.gqMake('kill'); G.offers[0]=k; t.gqTake(k); t.gqDrop(); o.drop=P.quest===null&&!t.QUESTS[k.id];
          P.gold=100; const ids=G.offers.map(q=>q.id).join(); o.ref=t.gqRefresh()&&P.gold===85&&G.offers.map(q=>q.id).join()!==ids; P.gold=3; o.poor=t.gqRefresh()===false;
          t.openShop(); t.setShopTab('quests'); t.renderShop(''); const rows=[...document.querySelectorAll('#shopList .shopItem')]; o.rows=rows.length===23;
          const btn=rows[19].querySelector('button'); btn.click(); o.ui=P.quest&&P.quest.gen; t.closeShop(); P.quest=null; return o""")
        chk('herb/hunt kinds, cancel, paid refresh, shop UI',all(r.values()),r)

        # ---------- 4. отряд наёмников ----------
        r=await run("""t.resetGame(); t.setState('playing'); const o={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0;
          P.level=1; o.cap1=t.mercCap()===1; P.level=12; o.cap12=t.mercCap()===4;
          P.gold=100; o.poor=t.hireMerc('mage')===false; P.gold=5000;
          o.hire=['shield','healer','mage','crossbow'].every(k=>!!t.hireMerc(k)); o.full=t.hireMerc('spear')===false&&P.mercs.length===4;
          t.update(0.016); o.spawn=t.mercObjs.size===4;
          const sh=t.mercObjs.get(P.mercs[0].id); o.guard=t.partyGuardMul()===0.85; sh.x+=600; o.guardFar=t.partyGuardMul()===1; sh.x-=600;
          P.hp=P.maxHp-200; for(let i=0;i<200;i++) t.update(1/60); o.heal=P.hp>P.maxHp-200;
          P.invuln=1e9; const fa=t.freeSpotAround(P.x+P.w/2+150,P.y+P.h/2,24,24,0,80,30)||{x:P.x+150,y:P.y}; const e=t.makeEnemy('wolf',fa.x,fa.y,1); e.hp=e.maxHp=80; e.speed=0; e.aggro=1; e.dmg=0; t.loc.enemies.push(e);
          for(let i=0;i<300 && e.hp>0;i++) t.update(1/60); o.kill=e.hp<=0;
          t.saveGame(); t.loadGame(); t.setState('playing'); o.saved=P.mercs.length===4&&P.mercs.every(m=>t.MERC[m.type]);
          return o""")
        chk('mercenaries: cap by level, hire costs, formation spawn, shield guard, healer heals, ranged kill, saved',all(r.values()),r)
        r=await run("""const o={}; t.setLoc('overworld'); t.setState('playing'); t.loc.enemies.length=0; t.update(0.016); const m=P.mercs[1]; const mo=t.mercObjs.get(m.id); m.hp=5;
          const big=t.makeEnemy('boss',mo.x,mo.y,1); big.speed=0; big.aggro=1; t.loc.enemies.push(big); for(let i=0;i<5;i++) t.update(1/60);
          o.gone=!P.mercs.includes(m)&&P.mercs.length===3; o.stat=P.stat.mercLost===1; t.loc.enemies.length=0;
          t.dismissMerc(P.mercs[0].id); o.dismiss=P.mercs.length===2;
          t.goTo('house1',t.world.house1.spawn.x,t.world.house1.spawn.y,''); t.openJournal('party'); const btns=[...document.querySelectorAll('#questList button')].filter(b=>b.textContent.indexOf('Нанять')>=0&&!b.disabled).length; t.closeJournal(true); o.ui=btns>=5;
          return o""")
        chk('mercenary dies for good, dismiss, party tab hire buttons',all(r.values()),r)

        # ---------- 5. Дикие земли ----------
        r=await run("""t.resetGame(); t.setState('playing'); const o={}; const ow=t.world.overworld, en=ow.entrances.find(e=>e.dungeon==='wild');
          o.gate=!!en; const seen=t.floodFrom(ow.grid,Math.floor(ow.spawn.x/32),Math.floor(ow.spawn.y/32),'~^#SB'); o.reach=!!seen[en.tx+(en.ty+1)*ow.width];
          o.locked=t.entranceGate('wild')===true; t.world.lair1.portal.open=true; t.setState('playing'); o.open=t.entranceGate('wild')===false;
          const s=t.world.wild.wild.seed; const A=t.wildGen(s,2,-1), B=t.wildGen(s,2,-1), C=t.wildGen(s,-3,4);
          o.det=A.grid.map(r=>r.join('')).join()===B.grid.map(r=>r.join('')).join() && A.enemies.length===B.enemies.length && A.wild.kind===B.wild.kind;
          o.diff=A.grid.map(r=>r.join('')).join()!==C.grid.map(r=>r.join('')).join();
          let unr=0, gates=0; for(let x=-3;x<=3;x++) for(let y=-3;y<=3;y++){ const L=t.wildGen(s,x,y); const f=t.floodFrom(L.grid,L.exit.tx,L.exit.ty+1,'#LSB');
            for(const g of L.wildGates) if(f[g.tx+g.ty*L.width]) gates++;
            for(const e of L.enemies){ const ex=Math.floor((e.x+e.w/2)/32), ey=Math.floor((e.y+e.h/2)/32); if(!f[ex+ey*L.width] && !t.BOSS_TYPES.includes(e.type)) unr++; } }
          o.gates=gates===49*4; o.unr=unr;
          const near=t.wildGen(s,0,1), far=t.wildGen(s,0,5); const avg=L=>L.enemies.filter(e=>!e.elite&&!e.wildBoss).reduce((a,e)=>a+e.maxHp/t.ENEMY_BASE[e.type].hp,0)/L.enemies.length;
          o.harder=avg(far)>avg(near)*1.5; o.home=t.wildGen(s,0,0).merchant!==undefined;
          const ks={}; for(let x=-5;x<=5;x++) for(let y=-5;y<=5;y++){ const k=t.wildStructAt(s,x,y); ks[k]=1; } o.structs=['camp','ruins','shrine','trader','lair'].every(k=>ks[k]);
          return o""")
        chk('wild: gate reachable & locked until 1st boss, deterministic regions, gates linked, all enemies reachable, harder farther, all structures',all(v for k,v in r.items() if k!='unr') and r['unr']==0,r)
        r=await run("""const o={}; t.wildEnter(); t.setState('playing'); """+calm+"""; o.in=t.locId==='wild'&&t.loc.wild.rx===0&&t.loc.wild.ry===0; P.invuln=1e9;
          for(let i=0;i<5;i++) t.update(1/60); o.seen=t.wildSeenCount()===1;
          const L=t.loc, gE=L.wildGates.find(g=>g.dir==='E'); P.x=(L.width-1)*32+2; P.y=gE.ty*32+4; t.transitionCooldown=0; t.update(1/60);
          o.east=t.loc.wild.rx===1&&t.loc.wild.ry===0&&t.wildSeenCount()===2&&P.x<6*32;
          t.wildGo(0,-1); o.north=t.loc.wild.ry===-1&&P.y>t.loc.height*32-6*32;
          t.saveGame(); const ok=t.loadGame(); t.setState('playing'); o.load=ok&&t.locId==='wild'&&t.loc.wild.rx===1&&t.loc.wild.ry===-1&&t.wildSeenCount()===3;
          const X=t.loc.exit; P.x=X.tx*32+5; P.y=X.ty*32+5; t.transitionCooldown=0; for(let i=0;i<3;i++) t.update(1/60); o.home=t.locId==='overworld';
          for(let i=0;i<3;i++) t.update(1/60); o.reset=t.world.wild.wild.rx===0&&t.world.wild.wild.ry===0;
          return o""")
        chk('wild: enter at gate land, walk through edge to neighbour, save/load, path home resets to gate land',all(r.values()),r)
        r=await run("""const o={}; const s=t.world.wild.wild.seed; let at=null; for(let x=-4;x<=4&&!at;x++) for(let y=-4;y<=4&&!at;y++) if(t.wildStructAt(s,x,y)==='lair') at=[x,y];
          const L=t.wildRegion(at[0],at[1]); t.world.wild=L; t.goTo('wild',L.spawn.x,L.spawn.y,''); t.setState('playing'); P.invuln=1e9;
          o.boss=!!t.loc.boss&&t.loc.boss.wildBoss&&t.loc.boss.label.indexOf('Зверь')===0; const b=t.loc.boss, g0=P.gold, k0=P.wild.bosses;
          b.hp=0; t.killEnemy(b); t.update(1/60); o.reward=P.wild.bosses===k0+1&&P.gold>g0&&t.loc.items.some(i=>i.type==='chest');
          o.noPortal=t.notes.every(n=>n.text.indexOf('открылся')<0);
          t.wildGo(1,0); t.wildGo(-1,0); o.stays=!t.loc.boss&&t.loc.wild.bossDone===true;
          let sh=null; for(let x=-5;x<=5&&!sh;x++) for(let y=-5;y<=5&&!sh;y++) if(t.wildStructAt(s,x,y)==='shrine') sh=[x,y];
          const S=t.wildRegion(sh[0],sh[1]); t.world.wild=S; t.goTo('wild',S.wild.shrine.x-10,S.wild.shrine.y-10,''); t.setState('playing'); P.hp=10; P.buff.might=0; t.update(1/60);
          o.shrine=P.hp===P.maxHp&&P.buff.might>0&&S.wild.shrine.used; t.wildRecord(t.loc); const S2=t.wildRegion(sh[0],sh[1]); o.shrineSaved=S2.wild.shrine.used===true;
          for(let i=0;i<60;i++){ t.update(1/60); } t.draw(); t.drawWildMap();
          const t0=performance.now(); for(let i=0;i<120;i++){ t.update(1/60); t.draw(); } o.ms=+((performance.now()-t0)/120).toFixed(2); o.fast=o.ms<40;
          return o""")
        chk('wild lair boss: label, reward chest, no story portal note, stays dead; shrine heals once and is remembered; frame time',all(v for k,v in r.items() if k!='ms'),r)
        r=await run("""const o={}; for(const b of Object.keys(t.WILD_BIOMES)){ let at=null; const s=t.world.wild.wild.seed; for(let x=-8;x<=8&&!at;x++) for(let y=-8;y<=8&&!at;y++) if(t.wildBiomeAt(s,x,y)===b) at=[x,y];
            if(!at){ o[b]='none'; continue; } const L=t.wildRegion(at[0],at[1]); t.world.wild=L; t.goTo('wild',L.spawn.x,L.spawn.y,''); t.setState('playing'); P.invuln=1e9; for(let i=0;i<40;i++) t.update(1/60); t.draw(); o[b]=t.WEATHER_OPTS.wild===t.WEATHER_OPTS[t.WILD_BIOMES[b].wx]||b==='ash'; }
          return o""")
        chk('each wild biome renders with matching weather',all(v is True for v in r.values()),r)
        chk('no page errors',not errs,errs[:5])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
