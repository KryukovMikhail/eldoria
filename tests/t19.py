import asyncio, json
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
        ctx=await b.new_context(viewport={'width':900,'height':560}, accept_downloads=True)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        E=lambda js,a=None: pg.evaluate(js,a)
        # map from fresh menu
        await pg.click('#mapBtn'); await pg.wait_for_timeout(300)
        r=await E("()=>[document.getElementById('mapBox').innerText, document.getElementById('mapScreen').classList.contains('hidden')]")
        chk('map opens with names', (not r[1]) and all(n in r[0] for n in ['Оверворлд','Логово Мортракса','Грот Шорохов','Кузни Гхарраш','Град Вельмор','Обитель Пустых Зеркал','Логово Эфирия','Город Лиссарен','Пирамида Хар-Нефет']), r[0][:200])
        await pg.screenshot(path=SC+'z_map.png')
        await pg.click('#mapBack')
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        await E("()=>{__t.loc.enemies.length=0}")
        # cave light
        r=await E("""()=>{ const t=__t; t.goTo('lair1',t.world.lair1.spawn.x,t.world.lair1.spawn.y,'t'); t.loc.enemies.length=0; return [t.caveLit(), t.getTorches(t.loc).torch.length, t.getTorches(t.loc).lava.length] }""")
        chk('lair1 lit with torches', r[0] and r[1]>=3, r)
        await pg.wait_for_timeout(600); await pg.screenshot(path=SC+'z_cave.png')
        r=await E("""()=>{ const t=__t; t.goTo('lava',t.world.lava.spawn.x,t.world.lava.spawn.y,'t'); t.loc.enemies.length=0; return [t.caveLit(), t.getTorches(t.loc).lava.length] }""")
        chk('lava glow points', r[0] and r[1]>=2, r)
        await pg.wait_for_timeout(600); await pg.screenshot(path=SC+'z_lava.png')
        # torches not serialized
        r=await E("()=>{ const t=__t; t.saveGame(); const k=t.latestSaveKey(); return JSON.parse(localStorage.getItem(k)).world.lava.torch===undefined }"); chk('torches not saved', r)
        # quality low runs, no errors; frames
        for q in ['low','mid','high']:
            await E("(q)=>__t.setQuality(q)", q)
            r=await E("""()=>{ const t=__t; for(const id of ['lair1','overworld','ice']){ t.goTo(id,t.world[id].spawn.x,t.world[id].spawn.y,'t'); t.loc.enemies.length=0; for(let i=0;i<5;i++){ t.update(0.016); t.draw(); } } return localStorage.getItem('eldoria_q') }""")
            chk('quality '+q+' renders', r==q, r)
        # footprints on ice
        r=await E("""()=>{ const t=__t,P=t.player; t.goTo('ice',t.world.ice.spawn.x,t.world.ice.spawn.y,'t'); t.loc.enemies.length=0; P.invuln=1e9; t.keys['KeyD']=true; for(let i=0;i<120;i++){ t.update(0.016); } t.keys['KeyD']=false; return 1 }""")
        await E("()=>{__t.setQuality('high'); __t.draw()}"); await pg.wait_for_timeout(200); await pg.screenshot(path=SC+'z_ice.png')
        # export / import
        await E("()=>{ __t.saveToSlot(0); __t.openSaves(); }")
        async with pg.expect_download() as dl:
            await pg.click('#expBtn')
        d=await dl.value; path=await d.path(); data=json.load(open(path))
        chk('export bundle', data['format']=='eldoria-saves' and len(data['saves'])>=2, list(data['saves'].keys()))
        await E("()=>{ localStorage.removeItem('eldoria_slot_1'); __t.openSaves(); }")
        await pg.set_input_files('#impFile', path); await pg.wait_for_timeout(400)
        r=await E("()=>[!!localStorage.getItem('eldoria_slot_1'), document.getElementById('savesMsg').textContent]"); chk('import restores slot', r[0], r)
        open(SC+'bad.json','w').write('{"x":1}')
        await pg.set_input_files('#impFile', SC+'bad.json'); await pg.wait_for_timeout(300)
        r=await E("()=>document.getElementById('savesMsg').textContent"); chk('bad file rejected','не файл' in r, r)
        # PWA files referenced
        r=await E("()=>[document.querySelector('link[rel=manifest]').getAttribute('href')]"); chk('manifest link', r[0]=='manifest.webmanifest')
        chk('no page errors', not errs, errs[:3])
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL')
asyncio.run(main())
