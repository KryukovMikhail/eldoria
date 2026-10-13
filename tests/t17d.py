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
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        E=lambda js,a=None: pg.evaluate(js,a)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        # shop lock UI
        await E("()=>{__t.player.gold=2000; __t.openShop();}")
        r=await E("()=>[...document.querySelectorAll('#shopList .shopItem')].map(r=>r.querySelector('b').textContent+': '+[...r.querySelectorAll('button')].map(b=>b.textContent+(b.disabled?'(off)':'')).join('|'))")
        print(r)
        chk('shop: only sword shown, no lock text',len(r)==1 and not any('🔒' in x for x in r),r)
        await E("()=>{ __t.closeShop(); const t=__t; t.world.lair1.portal.open=true; t.world.lair1.boss.hp=0; t.openShop(); }")
        r=await E("()=>[...document.querySelectorAll('#shopList .shopItem')].map(r=>[...r.querySelectorAll('button')].map(b=>b.textContent).join('|'))")
        chk('after stage1 spear purchasable',len(r)==2 and r[1].startswith('Купить') and not any('🔒' in x for x in r),r)
        await E("()=>__t.closeShop()")
        # old save without POIs
        r=await E("""()=>{ const t=__t; t.saveGame(); const k=t.latestSaveKey(); const d=JSON.parse(localStorage.getItem(k));
           for(const id of Object.keys(d.world)) if(id.startsWith('poi_')) delete d.world[id];
           for(const id of Object.keys(d.world)){ delete d.world[id].poi; if(d.world[id].doors) d.world[id].doors=d.world[id].doors.filter(x=>!x.to.startsWith('poi_')); }
           delete d.player.codex; localStorage.setItem(k,JSON.stringify(d)); const okk=t.loadGame(k);
           return [okk, Object.keys(t.world).filter(i=>i.startsWith('poi_')).length, JSON.stringify(t.player.codex).slice(0,20)] }""")
        chk('old save gets POIs + codex',r[0] and r[1]==10 and r[2].startswith('{"e":{}'),r)
        # persistence of POI
        r=await E("""()=>{ const t=__t; t.saveGame(); const k=t.latestSaveKey(); const before=JSON.stringify(t.world.desert.poi); t.loadGame(k); return [before===JSON.stringify(t.world.desert.poi), !!t.world.poi_pyramid, t.world.desert.grid[t.world.desert.poi[0].door.ty][t.world.desert.poi[0].door.tx]] }""")
        chk('poi saved/loaded',r[0] and r[1] and r[2]=='D',r)
        # play inside pyramid: kill elite -> gear drop & chest opens with key
        r=await E("""()=>{ const t=__t,T=32,P=t.player; t.goTo('poi_pyramid',0,0,''); const L=t.loc; P.invuln=1e9; P.hp=P.maxHp;
           const el=L.enemies.find(e=>e.elite); const before=L.items.length; t.killEnemy(el); const dropped=L.items.length>before;
           P.vkeys=1; const ch=L.items.find(i=>i.type==='chest'&&i.locked); P.x=ch.x; P.y=ch.y; t.update(0.016);
           return [dropped, ch.open, P.vkeys] }""")
        chk('elite drops gear, locked chest opens with key',r[0] and r[1] and r[2]==0,r)
        # time a long run of frames in a big field with many enemies
        r=await E("""()=>{ const t=__t; t.goTo('jungle',t.world.jungle.spawn.x,t.world.jungle.spawn.y,''); t.player.invuln=1e9; let a=performance.now(); for(let i=0;i<120;i++){ t.update(0.016); t.draw(); } return (performance.now()-a)/120 }""")
        chk('jungle frame ms < 20',r<20*PERF,r)
        chk('no page errors',errs==[],errs[:3])
        print('ALL OK' if ok else 'SOME FAIL'); await b.close()
asyncio.run(main())
