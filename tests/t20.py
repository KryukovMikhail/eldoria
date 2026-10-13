import asyncio
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':900,'height':500})
        await pg.goto('file://'+SC+'test.html'); await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        E=pg.evaluate
        names=lambda: E("()=>[...document.querySelectorAll('#shopList .shopItem b')].map(b=>b.textContent)")
        await E("()=>{__t.player.gold=5000;__t.setShopTab('armor');__t.openShop()}")
        r=await names(); print('stage0',r)
        await E("()=>{__t.closeShop(); __t.world.lair1.portal.open=true; __t.world.lair1.boss.hp=0; __t.setShopTab('armor'); __t.openShop()}")
        r2=await names(); print('stage1',r2)
        await E("()=>{__t.closeShop(); __t.world.lair2.portal.open=true; __t.world.lair2.boss.hp=0; __t.setShopTab('armor'); __t.openShop()}")
        r3=await names(); print('stage2',r3)
        print('OK' if len(r)==1 and len(r2)==2 and len(r3)==3 else 'FAIL')
        await b.close()
asyncio.run(main())
