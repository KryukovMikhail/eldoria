import asyncio, sys, os
from playwright.async_api import async_playwright
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
# Сборка D001.050: заставка «The Legend of Eldoria» перед главным меню и новое название игры
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        for vp,mob in [({'width':844,'height':390},True),({'width':390,'height':844},True),({'width':1280,'height':720},False)]:
            ctx=await b.new_context(viewport=vp, is_mobile=mob, has_touch=mob); pg=await ctx.new_page()
            errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file://'+SC+'test.html?splash'); await pg.wait_for_timeout(3600)
            r=await pg.evaluate("""()=>{ const s=document.getElementById('splash'), b=document.getElementById('splashPlay').getBoundingClientRect(), t=document.querySelector('#splash .spTitle').getBoundingClientRect(), cv=document.getElementById('splashCv');
              const px=cv.getContext('2d').getImageData(cv.width>>1, cv.height>>1, 1, 1).data;
              return {shown:!s.classList.contains('hidden') && getComputedStyle(s).display!=='none', title:document.querySelector('#splash .spTitle').textContent.replace(/\\s+/g,' ').trim(),
                btnIn: b.width>0 && b.left>=0 && b.right<=innerWidth && b.bottom<=innerHeight, titleIn: t.left>=-2 && t.right<=innerWidth+2 && t.top>=0, painted: px[3]===255 && (px[0]+px[1]+px[2])>30,
                build: document.getElementById('splashBuild').textContent } }""")
            chk(f'splash shown {vp["width"]}x{vp["height"]}', r['shown'] and r['title']=='The Legend of Eldoria' and r['btnIn'] and r['titleIn'] and r['painted'] and r['build'].startswith('сборка D'), r)
            # клавиши не доходят до игры, пока открыта заставка; «Играть» открывает главное меню
            await pg.keyboard.press('KeyK')
            if vp['width']==1280: await pg.keyboard.press('Enter')
            else: await pg.click('#splashPlay')
            await pg.wait_for_timeout(1300)
            r=await pg.evaluate("()=>({gone:document.getElementById('splash').classList.contains('hidden'), menu:!document.getElementById('startScreen').classList.contains('hidden'), state:__t.state})")
            chk('play opens main menu', r['gone'] and r['menu'], r)
            await pg.click('#startBtn'); await pg.wait_for_timeout(300)
            r=await pg.evaluate("()=>({dlgTitle:(document.querySelector('#dialogScreen h2')||{}).textContent||'', state:__t.state})")
            chk('new game works after splash, intro titled with new name', 'The Legend of Eldoria' in r['dlgTitle'], r)
            chk('no page errors', not errs, errs)
            await ctx.close()
        # обычная тестовая сборка: заставки нет, меню сразу доступно
        pg=await b.new_page(); await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        r=await pg.evaluate("()=>({hidden:document.getElementById('splash').classList.contains('hidden'), title:document.title, h2:document.querySelector('#startScreen h2').textContent})")
        chk('test build skips splash; titles renamed', r['hidden'] and r['title'].startswith('The Legend of Eldoria') and r['h2']=='The Legend of Eldoria', r)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
