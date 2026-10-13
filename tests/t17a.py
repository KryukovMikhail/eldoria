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
        E=lambda js,a=None: pg.evaluate(js,a)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        r=await E("()=>[__t.gs, JSON.stringify(__t.player.codex)]"); chk('start playing, empty codex',r[0]=='playing' and r[1]=='{"e":{},"a":{},"k":{}}' ,r)
        await E("()=>{ __t.loc.enemies.length=0; __t.player.codex={e:{},a:{},k:{}}; }")
        # codex empty UI
        await E("()=>__t.openCodex()"); 
        r=await E("()=>[__t.gs, document.getElementById('codexInfo').textContent, document.querySelectorAll('#codexList .shopItem').length, [...document.querySelectorAll('#codexList b')].filter(b=>b.textContent.includes('???')).length]")
        chk('codex opens empty',r[0]=='codex' and r[2]>=40 and r[3]==r[2],r)
        await pg.screenshot(path=SC+'x_codex0.png')
        await E("()=>__t.closeCodex()")
        # weapons unlock
        r=await E("()=>Object.keys(__t.WEAPON_UNLOCK).map(k=>[k,__t.weaponUnlocked(k)])"); chk('only sword unlocked at stage 0',r==[['sword',True],['spear',False],['bow',False],['axe',False],['crossbow',False],['musket',False]],r)
        # shop shows lock
        await E("()=>{__t.player.gold=5000; __t.setShopTab&&0}")
        # unlock stages via boss kills simulation: open lair portals
        await E("()=>{ const t=__t; for(const id of ['lair1','lair2','lair3','lair4','lair5','lair6','lair7']){ const L=t.world[id]; L.portal.open=true; if(L.boss) L.boss.hp=0; } }")
        r=await E("()=>[__t.storyStage(), __t.weaponUnlocked('crossbow'), __t.weaponUnlocked('musket')]"); chk('stage 7 unlocks musket',r==[7,True,True],r)
        # fire each weapon
        for w in ['bow','crossbow','musket']:
            await E("(w)=>{ const t=__t; t.player.weapon=w; t.player.owned[w]=true; t.arrows.length=0; t.player.dir='right'; t.fireArrow(false); }",w)
            r=await E("()=>[__t.arrows.length, __t.arrows[0].proj, __t.arrows[0].max, Math.round(__t.arrows[0].dmg), __t.playerDamage()]")
            chk('fire '+w,r[0]==1,r)
        # musket dmg > crossbow > bow
        d={}
        for w in ['bow','crossbow','musket']:
            d[w]=await E("(w)=>{ const t=__t; t.player.weapon=w; return t.playerDamage(); }",w)
        chk('damage order',d['bow']<d['crossbow']<d['musket'],d)
        # game keeps running with projectiles drawn
        await E("()=>{ const t=__t; t.player.weapon='musket'; t.fireArrow(false); t.player.weapon='crossbow'; t.fireArrow(true); }")
        await pg.wait_for_timeout(500)
        # codex recording: spawn new enemies near player
        await E("()=>{ const t=__t, P=t.player; for(const ty of ['boar','bandit']) t.loc.enemies.push(t.makeEnemy(ty,P.x+60,P.y+40,1)); }")
        await pg.wait_for_timeout(900)
        r=await E("()=>Object.keys(__t.player.codex.e)"); chk('enemies recorded when near',set(['boar','bandit'])<=set(r),r)
        r=await E("()=>Object.keys(__t.player.codex.a)"); chk('weapons recorded as owned',('w:bow' in dict.fromkeys(r)) and 'w:musket' in r and 'w:sword' in r,r)
        # persistence
        await E("()=>__t.saveGame()")
        await E("()=>{ __t.player.codex={e:{},a:{},k:{}}; }")
        await E("()=>__t.loadGame()"); await pg.wait_for_timeout(200)
        r=await E("()=>Object.keys(__t.player.codex.e)"); chk('codex restored from save',set(['boar','bandit'])<=set(r),r)
        await E("()=>__t.openCodex()"); await pg.screenshot(path=SC+'x_codex1.png')
        await E("()=>{ document.querySelectorAll('#codexTabs button')[1].click(); }"); await pg.screenshot(path=SC+'x_codex2.png')
        await E("()=>__t.closeCodex()")
        # all new enemies: spawn and update in each roster loc without errors
        await E("()=>{ const t=__t; for(const ty of Object.keys(t.ENEMY_BASE)){ const e=t.makeEnemy(ty,t.player.x+40,t.player.y+40,3); t.loc.enemies.push(e);} }")
        await pg.wait_for_timeout(1500)
        await E("()=>{ const t=__t; for(const e of t.loc.enemies) t.killEnemy(e); }"); await pg.wait_for_timeout(600)
        r=await E("()=>Object.keys(__t.player.codex.e).length"); chk('all enemy types in codex after kill',r>=len(await E("()=>Object.keys(__t.ENEMY_INFO)")) ,r)
        chk('no js errors',not errs,errs[:3])
        print('ALL OK' if ok else 'SOME FAIL')
        await b.close()
asyncio.run(main())
