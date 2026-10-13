import asyncio
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
ok=True
def chk(n,c,x=''):
    global ok
    print(('PASS ' if c else 'FAIL ')+n,x)
    if not c: ok=False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1100,'height':620})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__t.beginNewGame()}"); await pg.wait_for_timeout(300)
        E=lambda js,a=None: pg.evaluate(js,a)
        # --- уровни и очки
        r=await E("()=>{const p=__t.player; p.xp=p.xpNext; __t.killEnemy(Object.assign(__t.makeEnemy('wolf',0,0),{xp:0,gold:0})); return [p.level,p.sp]}")
        chk('level up gives sp',r[0]==2 and r[1]==1,r)
        # --- hero screen
        r=await E("()=>{__t.openHero(); const s=document.getElementById('heroScreen').classList.contains('hidden'); const rows=document.querySelectorAll('#heroList .shopItem').length; return [__t.state,s,rows]}")
        chk('hero opens skills tab',r[0]=='hero' and not r[1] and r[2]==4,r)
        r=await E("()=>{[...document.querySelectorAll('#heroList .shopItem')][0].querySelector('button').click(); return [__t.player.skills.dash,__t.player.sp]}")
        chk('learn dash',r==[1,0],r)
        await E("()=>__t.closeHero()")
        # --- dash
        r=await E("""()=>{ const d=__t.world.overworld; const p=__t.player; p.x=d.spawn.x; p.y=d.spawn.y; p.dir='right'; const x0=p.x; __t.useSkill('dash',1,0); for(let i=0;i<20;i++) __t.update(0.016); return [Math.round(p.x-x0), p.cd.dash>0, p.invuln>0]}""")
        chk('dash moves',r[0]>40 and r[1],r)
        # --- spin
        r=await E("""()=>{ const p=__t.player; p.skills.spin=2; p.cd.spin=0; const L=__t.loc; L.enemies.length=0; const e=__t.makeEnemy('wolf',p.x+30,p.y,1); L.enemies.push(e); const hp0=e.hp; __t.useSkill('spin'); return [hp0-e.hp, e.hp]}""")
        chk('spin damages',r[0]>0,r)
        # --- shield
        r=await E("""()=>{ const p=__t.player; p.skills.shield=1; p.cd.shield=0; const a=__t.incomingDamage(20); __t.useSkill('shield'); const b=__t.incomingDamage(20); return [a,b]}""")
        chk('shield reduces',r[1]<r[0]/3,r)
        # --- gear
        r=await E("""()=>{ const p=__t.player; const gs=[]; for(let i=0;i<300;i++) gs.push(__t.makeGear(i%9)); const cnt=[0,0,0]; gs.forEach(g=>cnt[g.rar]++); const ok=gs.every(g=>Object.keys(g.stats).length===__t.RAR[g.rar].k); return [cnt,ok]}""")
        chk('gear gen',r[1] and r[0][0]>r[0][1]>r[0][2]>0,r)
        r=await E("""()=>{ const p=__t.player; const g={slot:'helm',rar:1,L:3,stats:{hp:30,def:5},name:'Тест'}; p.bag.push(g); const mh=p.maxHp, h=p.hp; __t.equipGear(p.bag.length-1); const a=[p.maxHp-mh, __t.gearStat('def')]; const dmg0=__t.incomingDamage(100); __t.unequipGear('helm'); return [a, p.maxHp-mh, p.bag.length]}""")
        chk('equip/unequip',r[0]==[30,5] and r[1]==0,r)
        r=await E("""()=>{ const p=__t.player; p.bag.length=0; const g={slot:'ring',rar:2,L:5,stats:{dmg:20,vamp:10},name:'Р'}; p.bag.push(g); const d0=__t.playerDamage(); __t.equipGear(0); const d1=__t.playerDamage(); p.hp=50; const e=__t.makeEnemy('slime',0,0,1); e.hp=1e6; for(let i=0;i<30;i++) __t.damageEnemy(e,40); return [d0,d1,p.hp]}""")
        chk('dmg bonus+vamp',r[1]>r[0] and r[2]>50,r)
        # drop pickup
        r=await E("""()=>{ const p=__t.player; p.bag.length=0; const L=__t.loc; L.items.length=0; const bs=__t.makeEnemy('wolf',p.x,p.y,1); bs.type='wolf'; for(let i=0;i<200;i++) __t.maybeDropGear(bs); const n=L.items.filter(i=>i.type==='gear').length; L.items.filter(i=>i.type==='gear').forEach(it=>{it.x=p.x;it.y=p.y}); __t.update(0.016); return [n,p.bag.length]}""")
        chk('drop & pickup',r[0]>3 and r[1]>0 and r[1]<=12,r)
        # --- boss drop guaranteed
        r=await E("""()=>{ const L=__t.world.lair1; __t.goTo('lair1',L.spawn.x,L.spawn.y,''); const n0=L.items.length; __t.player.bag.length=0; const bs=L.boss; bs.hp=0; __t.killEnemy(bs); return L.items.filter(i=>i.type==='gear'&&i.gear.rar>=1).length}""")
        chk('boss drops rare+',r>=1,r)
        # --- forge
        r=await E("""()=>{ const p=__t.player; p.gold=5000; __t.setShopTab('forge'); __t.renderShop(''); const rows=document.querySelectorAll('#shopList .shopItem'); const d0=__t.playerDamage(); [...rows[0].querySelectorAll('button')][0].click(); const d1=__t.playerDamage(); [...document.querySelectorAll('#shopList .shopItem')][1].querySelectorAll('button')[0].click(); return [rows.length,d0,d1,p.wLvl.sword,p.ench.sword,p.gold]}""")
        chk('forge upgrade+enchant',r[3]==1 and r[1]<r[2] and r[4]=='fire' and r[5]<5000,r)
        # enchant burns
        r=await E("""()=>{ const L=__t.loc; L.enemies.length=0; const e=__t.makeEnemy('skeleton',__t.player.x+80,__t.player.y,1); e.hp=e.maxHp=1000; L.enemies.push(e); __t.damageEnemy(e,100); const h=e.hp; for(let i=0;i<100;i++) __t.update(0.016); return [h,e.hp,!!e.dot]}""")
        chk('burn dot ticks',r[1]<r[0]-20,r)
        # --- boss phases
        r=await E("""()=>{ __t.beginNewGame(); const L=__t.world.lair1; __t.goTo('lair1',L.spawn.x,L.spawn.y,''); __t.player.invuln=99999; const bs=L.boss; bs.hp=bs.maxHp; bs.phase=undefined; const n0=L.enemies.length; const p=__t.player; p.x=bs.x+100; p.y=bs.y; __t.update(0.016); const ph0=bs.phase; bs.hp=bs.maxHp*0.45; __t.update(0.016); const ph1=bs.phase, n1=L.enemies.length; bs.hp=bs.maxHp*0.2; __t.update(0.016); const ph2=bs.phase,n2=L.enemies.length; bs.slamCd=1; __t.update(0.05); return [ph0,ph1,ph2,n0,n1,n2,__t.aoes.length]}""")
        chk('boss phases & summons & aoe',r[0]==1 and r[1]==2 and r[2]==3 and r[4]>r[3] and r[5]>r[4] and r[6]>=1,r)
        r=await E("""()=>{ __t.player.invuln=0; __t.player.hp=__t.player.maxHp; const a=__t.aoes; a.length=0; const p=__t.player; a.push({x:p.x+11,y:p.y+11,r:50,t:1200,dur:1150,dmg:30,col:'#f00'}); __t.updateAoes(0.016); return [__t.player.hp<__t.player.maxHp, a.length]}""")
        chk('aoe hits player',r[0] and r[1]==0,r)
        # --- сохранение
        r=await E("""()=>{ const p=__t.player; __t.goTo('overworld',__t.world.overworld.spawn.x,__t.world.overworld.spawn.y,''); p.skills.spin=3; p.sp=2; p.wLvl.sword=1; p.ench.sword='fire'; __t.saveGame(); const mh=p.maxHp; __t.resetGame(); const reset=[p.skills.spin,p.sp,p.bag.length]; const ok=__t.loadGame(); return [ok,reset,p.skills.spin,p.sp,p.maxHp===mh,p.wLvl.sword,p.ench.sword]}""")
        chk('save/load hero',r[0] and r[1]==[0,0,0] and r[2]==3 and r[3]==2 and r[4] and r[5]==1 and r[6]=='fire',r)
        # старое сохранение
        r=await E("""()=>{ __t.beginNewGame(); __t.player.level=6; __t.saveGame(); const d=JSON.parse(localStorage.getItem('eldoria_save_v1')); for(const k of ['sp','skills','gear','bag','wLvl','ench']) delete d.player[k]; localStorage.setItem('eldoria_save_v1',JSON.stringify(d)); const ok=__t.loadGame(); const p=__t.player; return [ok,p.sp,p.skills.dash,p.bag.length,JSON.stringify(p.gear)]}""")
        chk('old save sp=level-1',r[0] and r[1]==5 and r[2]==0,r)
        # --- визуал
        await E("""()=>{ const p=__t.player; p.skills={dash:2,spin:2,shield:2,might:1}; p.cd.spin=3000; __t.goTo('lair1',__t.world.lair1.spawn.x,__t.world.lair1.spawn.y,''); const L=__t.loc; for(let i=0;i<3;i++){ const g=__t.makeGear(3,i); L.items.push({type:'gear',x:p.x+40+i*30,y:p.y+30,w:16,h:16,gear:g}); } p.invuln=99999; __t.useSkill('shield'); p.cd.spin=0; __t.useSkill('spin'); L.enemies.length=0;
          __t.aoes.push({x:p.x+80,y:p.y,r:60,t:500,dur:1150,dmg:10,col:'#f33'}); }""")
        await pg.wait_for_timeout(200)
        await pg.screenshot(path=SC+'h_fx.png')
        await E("()=>{__t.player.sp=2; __t.player.bag.push(__t.makeGear(4,2),__t.makeGear(2,1),__t.makeGear(1,0)); __t.openHero(); }")
        await pg.screenshot(path=SC+'h_gear.png')
        await E("()=>{__t.player.level=9; __t.player.sp=2; __t.openHero(); }")
        await pg.evaluate("()=>{ document.querySelectorAll('#heroTabs button')[1].click() }")
        await pg.screenshot(path=SC+'h_skills.png')
        await E("()=>{__t.closeHero(); __t.player.gold=999; __t.setShopTab('forge'); __t.openShop(''); }")
        await pg.screenshot(path=SC+'h_forge.png')
        ms=await E("()=>{__t.closeShop(); const t0=performance.now(); for(let i=0;i<60;i++){__t.update(0.016); __t.draw();} return (performance.now()-t0)/60}")
        print('ms/frame',ms); print('errors',errs[:5]); chk('no js errors',not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL')
asyncio.run(main())
