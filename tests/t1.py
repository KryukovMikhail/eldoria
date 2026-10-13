import asyncio, sys
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1100,'height':620})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.goto('file://'+SC+'test.html')
        await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__t.beginNewGame()}")
        await pg.wait_for_timeout(500)
        r=await pg.evaluate("()=>Object.keys(__t.world).join(',')+' | '+__t.locId")
        print(r)
        # visit each location
        for lid in ['dungeon1','lair1','dungeon3','lava','desert','ice']:
            await pg.evaluate("(id)=>{const d=__t.world[id]; __t.goTo(id,d.spawn.x,d.spawn.y,'')}",lid)
            await pg.wait_for_timeout(700)
            await pg.screenshot(path=SC+f'loc_{lid}.png')
            info=await pg.evaluate("(id)=>{const d=__t.world[id]; return [d.enemies.length,d.items.length,!!d.portal,d.boss&&d.boss.type, d.width]}",lid)
            print(lid,info)
        print('errors',errs[:10])
        await b.close()
asyncio.run(main())
