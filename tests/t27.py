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
        # 1. оружие
        r=await run("""t.resetGame(); const W=t.WEAPONS; return {ok:['dagger','hammer','staff'].every(k=>W[k]&&W[k].name&&W[k].cooldown>0), dps:['sword','dagger','hammer','staff'].map(k=>W[k].mult/W[k].cooldown*1000)}""")
        chk('weapons: dagger/hammer/staff defined, dps in range',r['ok'] and all(2.5<d<5.5 for d in r['dps']),str(r['dps']))
        # 2. дом
        r=await run("""t.resetGame(); const o={}; t.ensureMetaFields(); const w=t.world; t.ensureHomeWorld(w); o.home=!!w.home; o.door=w.town.doors.some(d=>d.to==='home'); o.chest=!!w.home.chest; o.bed=!!w.home.bed;
          const dr=w.town.doors.find(d=>d.to==='home'); P.gold=100; o.blocked=t.homeGate(dr)===true; o.dlg=!document.getElementById('choiceScreen').classList.contains('hidden');
          return o""")
        chk('home: location, door, chest, bed, purchase dialog blocks entry',r['home'] and r['door'] and r['chest'] and r['bed'] and r['blocked'] and r['dlg'],str(r))
        await pg.evaluate("()=>{ const bs=[...document.querySelectorAll('#choiceScreen button')]; bs[1].click(); }")
        r=await run("""const o={}; o.home=P.home; o.state=t.state; P.gold=1000; const dr=t.world.town.doors.find(d=>d.to==='home');
          o.blocked=t.homeGate(dr); [...document.querySelectorAll('#choiceScreen button')][0].click(); o.bought=P.home===true&&P.gold>=400; o.free=t.homeGate(dr)===false; return o""")
        chk('home: cannot buy without gold, buy with gold, then door free',r['home'] is False and r['bought'] and r['free'],str(r))
        r=await run("""const o={}; t.goTo('home',t.world.home.spawn.x,t.world.home.spawn.y); o.at=t.locId==='home'; t.setState('playing');
          const g=t.makeGear(3,1); P.bag.push(g); const n0=P.bag.length; t.openStash(); o.open=!document.getElementById('choiceScreen').classList.contains('hidden')&&t.state==='dialog';
          const btn=[...document.querySelectorAll('#choiceScreen .shopBtn')][0]; btn.click(); o.moved=P.stash.length===1&&P.bag.length===n0-1;
          const back=[...document.querySelectorAll('#choiceScreen .shopBtn')].find(b=>b.textContent==='Забрать'); back.click(); o.back=P.stash.length===0&&P.bag.length===n0;
          [...document.querySelectorAll('#choiceScreen button')].pop().click(); o.closed=t.state==='playing'; 
          P.hp=10; P.x=t.loc.bed.x+20; P.y=t.loc.bed.y+30; t.update(0.016); t.update(0.016); o.slept=P.hp>=P.maxHp; return o""")
        chk('home: stash bag<->chest, close restores play, bed heals',r['at'] and r['open'] and r['moved'] and r['back'] and r['closed'] and r['slept'],str(r))
        # 3. перекат
        r=await run("""t.resetGame(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; const o={}; t.setState('playing'); t.ensureMetaFields();
          P.hp=P.maxHp=1000; const x0=P.x; P.dir='right'; t.keys['KeyV']=true; t.update(0.016); t.keys['KeyV']=false; o.rolling=P.rollT>0;
          for(let i=0;i<5;i++) t.update(0.016); o.moved=Math.abs(P.x-x0)>10; o.rt=P.rollT;
          const hr=t.hurtPlayer(50); o.dodge=hr===false&&P.hp===1000&&P.counterT>0; o.dbg=[hr,P.hp,P.counterT]; o.stat=P.stat.dodges===1;
          for(let i=0;i<30;i++) t.update(0.016); o.ended=!(P.rollT>0); o.hurt=t.hurtPlayer(10)!==false||P.hp<1000; return o""")
        chk('roll: i-frames, perfect dodge counter buff, ends',r['rolling'] and r['dodge'] and r['stat'] and r['ended'] and r['hurt'],str(r))
        # 4. комбо
        r=await run("""t.resetGame(); t.ensureMetaFields(); const o={}; const a=t.comboStep(),b=t.comboStep(),c=t.comboStep(); o.fin=!a.fin&&!b.fin&&c.fin&&c.mult>a.mult&&c.scale>1; o.n=P.comboN===3;
          P.weapon='dagger'; P.comboN=3; const c4=t.comboStep(); o.crit=t.meleeCrit({})===2; P.comboN=1; o.nocrit=t.meleeCrit({})===1; P.comboT=0; t.rollMove(0.016,0,0); o.reset=P.comboN===0; return o""")
        chk('combo: every 3rd hit finisher, dagger crit every 4th, window resets',r['fin'] and r['n'] and r['crit'] and r['nocrit'] and r['reset'],str(r))
        # 5. молот оглушает, посох бьёт по площади
        r=None
        for k in range(3):
            r=await run("""t.resetGame(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; t.setState('playing'); const o={};
              const f=t.freeSpotAround(P.x+P.w/2,P.y+P.h/2,22,22,30,60,60); const e=t.makeEnemy('goblin',P.x+30,P.y,1); P.dir='right'; e.x=P.x+28; e.y=P.y; e.hp=e.maxHp=400; t.loc.enemies.push(e);
          P.weapon='hammer'; P.attackTimer=0; t.keys['Space']=true; t.update(0.016); t.keys['Space']=false; o.stun=e.stun>0 && e.hp<400;
          const ex=e.x; for(let i=0;i<10;i++) t.update(0.016); o.still=e.x===ex || e.stun>0; return o""")
            if r['stun']: break
        chk('hammer stuns enemies it hits',r['stun'],str(r))
        r=await run("""const o={}; t.setLoc('overworld'); t.loc.enemies.length=0; const mk=(dx,dy)=>{ const e=t.makeEnemy('goblin',P.x+dx,P.y+dy,1); e.hp=e.maxHp=500; e.dmg=0; t.loc.enemies.push(e); return e; };
          const e1=mk(60,0), e2=mk(60,30); P.weapon='staff'; P.dir='right'; P.attackTimer=0; t.keys['Space']=true; t.update(0.016); t.keys['Space']=false;
          for(let i=0;i<60;i++) t.update(0.016); o.both=e1.hp<500&&e2.hp<500; o.hp=[e1.hp,e2.hp]; return o""")
        chk('staff orb splashes neighbours',r['both'],str(r))
        # 6. приручение
        r=None
        for k in range(3):
            r=await run("""t.resetGame(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; t.setState('playing'); t.ensureMetaFields(); const o={};
              const e=t.makeEnemy('wolf',P.x+30,P.y,1); t.loc.enemies.push(e); o.cand=t.tameCandidate()===e; e.hp=e.maxHp; P.gold=100; t.tryTame(e); o.strong=!P.pet&&P.gold===100;
              e.hp=e.maxHp*0.3; P.mats.fish=0; P.gold=100; t.keys['KeyG']=true; t.update(0.016); t.keys['KeyG']=false;
              o.tamed=!!P.pet&&P.pet.type==='wolf'&&P.pet.lvl===1&&P.gold>=60; o.gone=!t.loc.enemies.includes(e); return o""")
            if r['tamed']: break
        chk('taming: needs weakened beast, costs gold, creates pet',r['cand'] and r['strong'] and r['tamed'] and r['gone'],str(r))
        r=None
        for k in range(3):
            r=await run("""t.setLoc('overworld'); t.loc.enemies.length=0; t.setState('playing'); const o={}; for(let i=0;i<40;i++) t.update(0.016); o.spawned=!!t.petObj;
              const s0=t.petStats().dmg; t.petXp({xp:1000}); o.lvl=P.pet.lvl>1; o.dmgUp=t.petStats().dmg>s0;
              const e=t.makeEnemy('goblin',P.x+60,P.y,1); e.hp=e.maxHp=200; e.dmg=0; t.loc.enemies.push(e); for(let i=0;i<400&&e.hp>=200;i++) t.update(0.016); o.bit=e.hp<200;
              t.saveGame(); const raw=JSON.stringify(P.pet); o.keep=raw.includes('wolf'); return o""")
            if r['spawned'] and r['bit']: break
        chk('pet: follows, levels up, damages enemies',r['spawned'] and r['lvl'] and r['dmgUp'] and r['bit'] and r['keep'],str(r))
        # 7. испытание дня
        r=await run("""t.resetGame(); t.ensureMetaFields(); const o={}; o.mods=t.DAILY_MODS.length>=5; o.mod=!!t.dailyMod().id; const st=t.dailyState(); o.st=st.day===t.todayKey()&&!st.done;
          t.setLoc('arena'); t.loc.run={wave:0,state:'rest',t:0,daily:true}; const id=t.dailyMod().id;
          o.mul=t.dailyMul('out')===(id==='glass'?1.5:1); o.pot=t.potionBlocked()===(id==='nopot');
          const e=t.makeEnemy('goblin',0,0,1); const sp=e.speed,hp=e.maxHp; t.dailyEnemy(e); o.enemy=id==='swift'?e.speed>sp:id==='armor'?e.maxHp>hp:id==='frail'?e.maxHp<hp:(e.speed===sp&&e.maxHp===hp);
          t.loc.run.daily=false; o.off=t.dailyMul('out')===1&&!t.potionBlocked(); t.loc.run.daily=true;
          const g0=P.gold; t.dailyProgress(3); o.notyet=!t.dailyState().done; t.dailyProgress(6); o.done=t.dailyState().done&&P.gold===g0+300&&P.stat.dailies===1;
          t.dailyProgress(7); o.once=P.gold===g0+300; const rec=t.recLoad(); o.rec=rec.best>=7&&rec.days[t.todayKey()].wave===7; return o""")
        chk('daily: modifier active only in daily run, goal reward once, records stored',all(r[k] for k in ['mods','mod','st','mul','pot','enemy','off','notyet','done','once','rec']),str(r))
        # 8. вкладка отряда и сохранение
        r=await run("""t.resetGame(); t.ensureMetaFields(); P.home=true; P.stash=[t.makeGear(3,1)]; P.pet={type:'cobra',lvl:4,xp:3}; t.saveGame(); t.resetGame(); const l=t.loadGame(); return {l, home:P.home, st:P.stash.length, pet:P.pet&&P.pet.type+P.pet.lvl}""")
        chk('save: home, stash, pet persist',r['home'] and r['st']==1 and r['pet']=='cobra4',str(r))
        await pg.evaluate("()=>{ __t.openJournal('party'); }"); await pg.wait_for_timeout(100)
        txt=await E("()=>document.getElementById('questList').innerText")
        chk('party tab shows pet + records',('Питомец' in txt) and ('Испытание дня' in txt) and ('Рекорды' in txt),txt[:80].replace('\n',' '))
        chk('no page errors',not errs,str(errs[:3]))
        await b.close()
    print('ALL OK' if ok else 'FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
