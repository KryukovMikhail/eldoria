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
        # автокачество: стабильные 16 мс — ничего не меняется
        r=await E("""()=>{const t=__t; t.setAutoQuality(); t.applyQuality('high'); for(let i=0;i<400;i++) t.autoQualityTick(16,true); return [t.quality,t.autoQ]}""")
        chk('fast frames keep quality',r==['high',True],r)
        # долгие кадры 40 мс: за ~180 кадров падает на ступень, за ~360 — ещё на одну, ниже low не идёт
        r=await E("""()=>{const t=__t; t.setAutoQuality(); t.applyQuality('high'); const seq=[]; for(let i=0;i<900;i++){ t.autoQualityTick(40,true); if(i%90===89) seq.push(t.quality);} return seq}""")
        chk('slow frames step down to low and stop',r[:2]==['high','mid'] and r[-1]=='low' and 'mid' in r,r)
        # фон/пауза не считаются
        r=await E("""()=>{const t=__t; t.setAutoQuality(); t.applyQuality('high'); for(let i=0;i<900;i++) t.autoQualityTick(40,false); for(let i=0;i<900;i++) t.autoQualityTick(900,true); return t.quality}""")
        chk('hidden tab / long stalls ignored',r=='high',r)
        # ручной выбор отключает авто
        r=await E("""()=>{const t=__t; t.setQuality('mid'); for(let i=0;i<900;i++) t.autoQualityTick(40,true); return [t.quality,t.autoQ]}""")
        chk('manual choice disables auto',r==['mid',False],r)
        # храм и прочие POI: сундуков >=3, один запертый, один ключ — на многих мирах
        r=await E("""()=>{const t=__t; let bad=[]; for(let k=0;k<60;k++){ const w=t.buildWorld(); for(const d of t.POI_DEFS){ const it=w[d.id]; if(!it||d.id==='poi_cabin') continue; const ch=it.items.filter(i=>i.type==='chest'); if(ch.length<3||ch.filter(c=>c.locked).length!==1) bad.push(d.id+':'+ch.length);} } return bad.slice(0,8)}""")
        chk('POI loot sane over 60 worlds',r==[],r)
        chk('no page errors',not errs,errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL'); sys.exit(0 if ok else 1)
asyncio.run(main())
