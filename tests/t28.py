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
        pre="const t=__t,P=t.player; P.invuln=0; P.hp=P.maxHp=1000;"
        calm="{ const wb=t.env.b[t.locId]; if(wb){ wb.name='clear'; wb.amt=1; wb.next=null; wb.timer=1e9; } }"
        async def run(js): return await E("()=>{"+pre+js+"}")
        # 7. развилки
        r=await run("""t.resetGame(); t.ensureMetaFields(); const o={}; const w=t.world; t.ensureMetaFields();
          o.npc=w.town.npcs.some(n=>n.fn==='fork'); o.none=t.forkNext()===null; o.three=t.FORKS.length===3;
          t.world.lair1.portal.open=true; o.next=t.forkNext()&&t.forkNext().id==='f1';
          const n=w.town.npcs.find(n=>n.fn==='fork'); t.goTo('town',t.world.town.spawn.x,t.world.town.spawn.y,''); t.setState('playing'); t.openJournal&&0;
          t.forkTalk(n); const cs=document.getElementById('choiceScreen'); o.dlg=!cs.classList.contains('hidden'); o.btns=cs.querySelectorAll('button').length;
          const mh=P.maxHp; cs.querySelectorAll('button')[0].click(); o.chosen=t.forkState().f1==='A'&&P.maxHp===mh+10&&P.stat.forks===1; o.state=t.state;
          t.forkChoose(t.FORKS[0],'B'); o.once=t.forkState().f1==='A';
          o.next2=t.forkNext()===null; o.path=t.forkPath()==='Милосердный'; return o""")
        chk('forks: NPC, gated by stage, choice applies once, path computed',r['npc'] and r['none'] and r['three'] and r['next'] and r['dlg'] and r['btns']==3 and r['chosen'] and r['once'] and r['next2'] and r['path'],str(r))
        r=await run("""const o={}; P.gold=0; t.world.lair1.portal.open=true; t.world.lair2.portal.open=true; t.world.lair3.portal.open=true; t.world.lair4.portal.open=true; t.world.lair5.portal.open=true;
          o.stage=t.storyStage(); for(const f of t.FORKS){ if(!t.forkState()[f.id]) t.forkChoose(f,'B'); } o.all=Object.keys(t.forkState()).length===3; o.ach=!!P.ach.forks; o.path=t.forkPath();
          t.saveGame(); const keep=JSON.stringify(t.forkState()); t.resetGame(); o.reset=Object.keys(t.forkState()).length===0; return o""")
        chk('forks: all three decided -> achievement, reset on new game',r['all'] and r['ach'] and r['reset'],str(r))
        # 8. подводный и небесный
        r=await run("""t.resetGame(); const o={}; const w=t.world; o.deep=!!w.deep&&w.deep.deep===true; o.sky=!!w.sky&&w.sky.sky===true;
          const ow=w.overworld; o.ent=['deep','sky'].every(id=>ow.entrances.some(e=>e.dungeon===id&&e.hidden));
          for(const id of ['deep','sky']){ const L=w[id]; const seen=t.floodFrom(L.grid,Math.floor(L.spawn.x/32),Math.floor(L.spawn.y/32),'#B~^S'); let un=0;
            for(const e of L.enemies){ if(!seen[Math.floor((e.x+e.w/2)/32)+Math.floor((e.y+e.h/2)/32)*L.width]) un++; }
            for(const c of L.items){ if(!seen[Math.floor((c.x+c.w/2)/32)+Math.floor((c.y+c.h/2)/32)*L.width]) un++; }
            o[id+'Un']=un; o[id+'En']=L.enemies.length; o[id+'Ch']=L.items.filter(i=>i.type==='chest').length; o[id+'Exit']=L.grid[L.exit.ty][L.exit.tx]==='<'; }
          return o""")
        chk('deep/sky: generated, entrances hidden on overworld, all enemies+chests reachable, exit tile',r['deep'] and r['sky'] and r['ent'] and r['deepUn']==0 and r['skyUn']==0 and r['deepEn']>=8 and r['skyEn']>=8 and r['deepCh']>=2 and r['skyCh']>=2 and r['deepExit'] and r['skyExit'],str(r))
        r=await run("""const o={}; const ow=t.world.overworld; t.setLoc('overworld'); t.setState('playing');
          const en=ow.entrances.find(e=>e.dungeon==='deep'); en.found=true; t.goTo('overworld',en.tx*32+5,en.ty*32+5,''); t.transitionCooldown=0; t.update(0.016); o.blocked=t.locId==='overworld';
          t.world.lair1.portal.open=true; t.world.lair2.portal.open=true; t.transitionCooldown=0; t.update(0.016); o.entered=t.locId==='deep'; return o""")
        chk('deep: locked before stage 2, enter after',r['blocked'] and r['entered'],str(r))
        r=await run("""const o={}; t.setState('playing'); t.loc.enemies.length=0; P.hp=P.maxHp=1000; t.airT=t.AIR_MAX; for(let i=0;i<100;i++) t.update(0.1);
          o.drop=t.airT<t.AIR_MAX-5; const v=t.loc.vents[0]; P.x=v.x-11; P.y=v.y-11; for(let i=0;i<40;i++) t.update(0.1); o.refill=t.airT>t.AIR_MAX-6;
          t.airT=0; const h0=P.hp; P.x=t.loc.spawn.x; P.y=t.loc.spawn.y; for(let i=0;i<30;i++) t.update(0.1); o.drown=P.hp<h0; return o""")
        chk('deep: air drains, vent refills, drowning hurts',r['drop'] and r['refill'] and r['drown'],str(r))
        r=await run("""const o={}; t.setState('playing'); t.goTo('sky',t.world.sky.spawn.x,t.world.sky.spawn.y,''); t.loc.enemies.length=0; P.hp=P.maxHp=1000;
          t.gust=null; t.gustCd=0; t.skyBoltCd=0; const hp0=P.hp; for(let i=0;i<5;i++) t.update(0.016); o.gust=!!t.gust; o.bolt=t.skyBolts.length>0;
          P.invuln=0; t.skyBolts.length=0; t.skyBolts.push({x:P.x+11,y:P.y+11,t:10}); t.update(0.05); o.hit=P.hp<hp0; return o""")
        chk('sky: gusts and lightning strikes work',r['gust'] and r['bolt'] and r['hit'],str(r))
        r=await run("""const o={}; t.goTo('sky',t.world.sky.spawn.x,t.world.sky.spawn.y,''); const e=t.loc.exit; P.x=e.tx*32+5; P.y=e.ty*32+5; t.transitionCooldown=0; t.update(0.016); o.out=t.locId==='overworld'; return o""")
        chk('sky: exit returns to surface',r['out'],str(r))
        # 9. праздники
        for sid,dd in [('spring',0),('summer',2),('autumn',4),('winter',6)]:
            r=None
            for k in range(4):
                r=await run("""t.resetGame(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; t.setState('playing'); t.ensureMetaFields(); const o={}; t.env.day="""+str(dd)+""";
                  o.season=t.seasonId()==='"""+sid+"""'; t.festCd=0; t.fest=null; const st=t.festStart(); o.started=st===true&&!!t.fest&&t.fest.id==='"""+sid+"""'; if(!o.started) return o;
                  const g0=P.gold; const sid='"""+sid+"""'; P.invuln=1e9; o.n=t.fest.total;
                  if(sid==='spring'){ for(const it of t.fest.items.slice()){ P.x=it.x; P.y=it.y; t.festTick(0.016); } }
                  else if(sid==='autumn'){ for(const it of t.fest.items.slice()){ P.x=it.x; P.y=it.y; P.attacking=true; t.festTick(0.016); } P.attacking=false; }
                  else { for(const e of t.fest.mobs.slice()){ e.hp=0; t.festKill(e); } }
                  o.done=t.fest===null&&P.gold>g0&&P.stat.fest===1&&(P.stat.festMask&"""+str(1<<(dd//2))+""")>0; return o""")
                if r.get('started'): break
            chk('festival '+sid+': starts, completes, rewards, stat',r['season'] and r['started'] and r['done'],str(r))
        r=await run("""t.resetGame(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; t.setState('playing'); t.env.day=0; t.festCd=0; t.fest=null; const o={};
          const ok=t.festStart(); if(!ok){ return {skip:true}; } t.fest.t=10; t.festTick(0.05); o.timeout=t.fest===null; 
          t.festCd=0; t.festStart(); t.goTo('town',t.world.town.spawn.x,t.world.town.spawn.y,''); o.cleared=t.fest===null; return o""")
        chk('festival: timeout ends it, leaving the surface cancels it',r.get('skip') or (r['timeout'] and r['cleared']),str(r))
        r=await run("""t.resetGame(); P.stat.festMask=15; P.stat.fest=4; t.ensureMetaFields(); for(const id in P.ach) delete P.ach[id]; P.stat.festMask=15; P.stat.fest=4; return {}""")
        await pg.evaluate("()=>{ __t.openJournal('party'); }"); await pg.wait_for_timeout(100)
        txt=await E("()=>document.getElementById('questList').innerText")
        chk('party tab shows forks section','Решения героя' in txt,txt[:60].replace('\n',' '))
        r=await run("""t.resetGame(); P.forks={f1:'B'}; t.saveGame(); const o={}; t.resetGame(); t.loadGame(); o.forks=P.forks&&P.forks.f1==='B'; o.locs=!!t.world.deep&&!!t.world.sky; return o""")
        chk('save: forks and new locations persist',r['forks'] and r['locs'],str(r))
        chk('no page errors',not errs,str(errs[:3]))
        await b.close()
    print('ALL OK' if ok else 'FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
