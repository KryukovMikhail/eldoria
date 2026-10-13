import asyncio, sys
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1100,'height':620})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        E=lambda js,a=None: pg.evaluate(js,a)
        r=await E("""()=>{ const t=__t, T=32, bad=[], miss={}; 
          for(let k=0;k<40;k++){ const w=t.buildWorld();
            for(const d of t.POI_DEFS){ const par=w[d.parent], it=w[d.id]; if(!it){ miss[d.id]=(miss[d.id]||0)+1; continue; }
              const rec=par.poi.find(p=>p.id===d.id); const dr=par.doors.find(x=>x.to===d.id);
              const seen=t.floodFrom(par.grid,Math.floor(par.spawn.x/T),Math.floor(par.spawn.y/T),par.type==='overworld'?'~^#SB':'#LSB');
              if(!seen[rec.door.tx+(rec.door.ty+1)*par.width]) bad.push(d.id+' door approach unreachable');
              if(par.portal && !seen[par.portal.tx+par.portal.ty*par.width]) bad.push(d.id+' portal unreachable');
              if(!dr || dr.tx!==rec.door.tx) bad.push(d.id+' door rec');
              // interior reachability of chests/keys
              const si=t.floodFrom(it.grid,Math.floor(it.spawn.x/T),Math.floor(it.spawn.y/T),'#LSB');
              for(const i of it.items){ if(i.type==='chest'||i.type==='key'){ if(!si[Math.floor((i.x+i.w/2)/T)+Math.floor((i.y+i.h/2)/T)*it.width]) bad.push(d.id+' unreachable '+i.type); } }
              for(const e of it.enemies){ if(!si[Math.floor((e.x+e.w/2)/T)+Math.floor((e.y+e.h/2)/T)*it.width]) bad.push(d.id+' enemy unreachable'); }
              if(!it.backTo || it.backTo.loc!==d.parent) bad.push(d.id+' backTo');
              if(d.id!=='poi_cabin'){ const ch=it.items.filter(i=>i.type==='chest'), ky=it.items.filter(i=>i.type==='key'), lk=ch.filter(c=>c.locked); if(lk.length!==1||ky.length!==1||ch.length<3) bad.push(d.id+' loot '+ch.length+'/'+lk.length+'/'+ky.length); if(!it.enemies.some(e=>e.elite)) bad.push(d.id+' no elite'); }
            } }
          return {miss,bad:bad.slice(0,12),nbad:bad.length} }""")
        r0=r; print(r)
        # round trip via update
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        r=await E("""()=>{ const t=__t, T=32, out=[]; 
          for(const d of t.POI_DEFS){ const par=t.world[d.parent]; if(!t.world[d.id]){ out.push(d.id+' missing'); continue; }
            t.setLoc(d.parent); const rec=par.poi.find(p=>p.id===d.id);
            t.player.x=rec.door.tx*T+5; t.player.y=rec.door.ty*T+5; t.transitionCooldown=0; t.update(0.016);
            if(t.locId!==d.id){ out.push(d.id+' no enter -> '+t.locId); continue; }
            const L=t.loc; t.player.x=L.exit.tx*T+5; t.player.y=L.exit.ty*T+5; t.transitionCooldown=0; t.update(0.016);
            if(t.locId!==d.parent) out.push(d.id+' no exit -> '+t.locId);
          } return out }""")
        print('roundtrip problems:',r); print(errs)
        bad=[]
        if r0['bad'] or r0['miss']: bad.append(('gen',r0))
        if r or errs: bad.append(('rt',r,errs))
        print('ALL OK' if not bad else 'FAIL '+str(bad)); await b.close(); sys.exit(1 if bad else 0)
asyncio.run(main())
