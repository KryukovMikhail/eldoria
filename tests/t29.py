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
        b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':844,'height':390})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        E=pg.evaluate
        # меню: текст отдельно
        vis=await E("()=>({intro:getComputedStyle(document.getElementById('introText')).display, about:!!document.getElementById('aboutBtn')})")
        chk('start menu: intro text hidden, About button exists',vis['intro']=='none' and vis['about'],str(vis))
        await pg.click('#aboutBtn'); await pg.wait_for_timeout(100)
        r=await E("()=>({about:!document.getElementById('aboutScreen').classList.contains('hidden'), start:document.getElementById('startScreen').classList.contains('hidden'), txt:document.getElementById('aboutBody').innerText.length})")
        chk('About screen shows the text, start screen hidden',r['about'] and r['start'] and r['txt']>200,str(r))
        await pg.click('#aboutBack'); await pg.wait_for_timeout(50)
        chk('About back returns to menu',await E("()=>!document.getElementById('startScreen').classList.contains('hidden')"))
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        await pg.wait_for_timeout(250)
        vis=await E("()=>{ const d=id=>getComputedStyle(document.getElementById(id)).display; return {pause:d('pauseBtn'), hero:d('heroBtn'), quest:d('questBtn'), codex:d('codexBtn'), sound:d('soundBtn'), menu:d('menuBtn'), st:document.getElementById('gameWrap').dataset.st} }")
        chk('in play: only the pause button is shown',vis['pause']!='none' and all(vis[k]=='none' for k in ['hero','quest','codex','sound','menu']) and vis['st']=='playing',str(vis))
        await pg.click('#pauseBtn'); await pg.wait_for_timeout(100)
        r=await E("()=>({open:!document.getElementById('pauseScreen').classList.contains('hidden'), state:__t.state, n:document.querySelectorAll('#pauseScreen button').length})")
        chk('pause menu opens, game paused, 7 buttons',r['open'] and r['state']=='dialog' and r['n']==7,str(r))
        await pg.click('#pauseScreen button >> nth=2'); await pg.wait_for_timeout(150)
        r=await E("()=>({state:__t.state, pause:document.getElementById('pauseScreen').classList.contains('hidden')})")
        chk('pause -> Hero opens hero screen',r['state']=='hero' and r['pause'],str(r))
        await E("()=>document.getElementById('heroBtn').click()"); await pg.wait_for_timeout(100)
        chk('hero closes via its button',await E("()=>__t.state")=='playing')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
        chk('Escape opens pause',await E("()=>__t.state")=='dialog')
        await pg.click('#pauseScreen button >> nth=0'); await pg.wait_for_timeout(100)
        chk('Continue returns to play',await E("()=>__t.state")=='playing')
        # энциклопедия-книга
        r=await E("""()=>{ const t=__t,P=t.player; P.codex={e:{wolf:1,boar:1,bandit:1},a:{potion:{i:'🧪',n:'Эликсир',d:'Лечит.',c:null}},k:{wolf:2}}; t.setState('playing'); document.getElementById('codexBtn').click();
          const pgs=document.querySelectorAll('#codexBook .pg'); const first=[...pgs].map(x=>x.querySelector('.tt')&&x.querySelector('.tt').textContent);
          const nav=document.querySelectorAll('#codexNav button'); nav[1].click(); const p2=[...document.querySelectorAll('#codexBook .pg')].map(x=>x.querySelector('.tt')?x.querySelector('.tt').textContent:null);
          return {n:pgs.length, first, p2, lab:document.querySelector('#codexNav span').textContent} }""")
        chk('codex book: two pages, only discovered entries, paging',r['n']==2 and r['first']==['Серошкур','Щетинистый Рвач'] and r['p2'][0]=='Тенекрад' and r['p2'][1] is None and r['lab']=='2 / 2',str(r))
        await E("()=>document.getElementById('codexClose').click()")
        # салют
        r=await E("""()=>new Promise(res=>{ document.getElementById('winScreen').classList.remove('hidden'); setTimeout(()=>{ const c=document.getElementById('fireworks'); const g=c.getContext('2d'); const d=g.getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>20) n++; res({w:c.width,n}); },1500); })""")
        chk('victory fireworks draw on canvas',r['w']>100 and r['n']>50,str(r))
        await E("()=>document.getElementById('winScreen').classList.add('hidden')")
        # крыши города без ошибок
        r=await E("""()=>{ const t=__t; t.setState('playing'); t.goTo('city',t.world.city.spawn.x,t.world.city.spawn.y,''); for(let i=0;i<5;i++) t.update(0.016); t.draw(); return t.locId }""")
        chk('city level renders (roofs)',r=='city')
        r=await E("""()=>{ const t=__t; t.goTo('lava',t.world.lava.spawn.x,t.world.lava.spawn.y,''); t.draw(); return t.locId }""")
        chk('lava level renders',r=='lava')
        r=await E("()=>{ const t=__t,P=t.player; for(const k of ['big','speed','might','guard','swim']) P.elix[k]=2; const L=t.elixLayout(); return {n:L.length, sameRow:L.every(s=>s.y===L[0].y), step:L.length>1?L[1].x-L[0].x:0} }")
        chk('potion slots in a horizontal row (do not cross the joystick)',r['n']==5 and r['sameRow'] and r['step']>=36,str(r))
        r=await E("""()=>{ const t=__t; t.goTo('lava',t.world.lava.spawn.x,t.world.lava.spawn.y,''); const cv=t.buildDungeonLayer(t.loc); return cv.width>0 }""")
        chk('lava layer builds without outline pass errors',r)
        chk('no page errors',not errs,str(errs[:3]))
        await b.close()
    print('ALL OK' if ok else 'FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
