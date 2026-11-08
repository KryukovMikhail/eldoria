import asyncio, sys, os, json
from playwright.async_api import async_playwright
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
# Сборка D001.049: земля и вода кусками, кэш миникарты, уведомления энциклопедии, компактная панель, указатель цели
async def main():
    slack=float(os.environ.get('PERF_SLACK','1'))
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':844,'height':390})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{ try{ localStorage.removeItem('eldoria_hud'); }catch(e){} }")
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3):
            try: await pg.click('#dlgBtn', timeout=500)
            except Exception: break
        E=pg.evaluate

        # 1. куски земли совпадают с цельной картинкой (кроме редких пикселей сглаживания на стыках)
        r=await E("""()=>{ const t=__t, o={};
          for(const id of ['lava','overworld']){
            const L=t.world[id], B = id==='overworld' ? t.buildGroundLayer : t.buildDungeonLayer;
            const full=B(L,null), CL=new t.ChunkLayer(L,B), asm=document.createElement('canvas'); asm.width=full.width; asm.height=full.height; const g=asm.getContext('2d');
            for(let j=0;j<CL.ny;j++) for(let i=0;i<CL.nx;i++) g.drawImage(CL.make(i,j), i*t.CHUNK, j*t.CHUNK);
            const A=full.getContext('2d').getImageData(0,0,full.width,full.height).data, C=g.getImageData(0,0,full.width,full.height).data;
            let big=0; for(let k=0;k<A.length;k+=4){ if(Math.abs(A[k]-C[k])+Math.abs(A[k+1]-C[k+1])+Math.abs(A[k+2]-C[k+2])+Math.abs(A[k+3]-C[k+3])>24) big++; }
            o[id]=+(big/(A.length/4)*100).toFixed(4);
          }
          // вода кусками — побитово та же
          const L=t.world.overworld, full=t.buildWaterLayer(L,null), CL=new t.ChunkLayer(L,t.buildWaterLayer), asm=document.createElement('canvas'); asm.width=full.width; asm.height=full.height; const g=asm.getContext('2d');
          for(let j=0;j<CL.ny;j++) for(let i=0;i<CL.nx;i++){ const c=CL.make(i,j); if(c) g.drawImage(c,1,1,c.width-2,c.height-2,i*t.CHUNK/2,j*t.CHUNK/2,c.width-2,c.height-2); }
          const A=full.getContext('2d').getImageData(0,0,full.width,full.height).data, C=g.getImageData(0,0,full.width,full.height).data;
          let wd=0; for(let k=0;k<A.length;k++) if(A[k]!==C[k]) wd++; o.water=wd;
          return o }""")
        chk('chunked ground/water match full layers', r['lava']<0.02 and r['overworld']<0.02 and r['water']==0, r)

        # 2. вход в большую карту: строятся только видимые куски, первый кадр быстрый
        r=await E("""()=>{ const t=__t,P=t.player,o={};
          for(const id of ['desert','jungle']){ const L=t.world[id]; t.dungeonLayers.delete(L); t.goTo(id, L.width*t.TILE/2, L.height*t.TILE/2, ''); t.setState('playing');
            const a=performance.now(); t.draw(); o[id+'Ms']=+(performance.now()-a).toFixed(0);
            const lay=t.dungeonLayers.get(L); o[id+'Chunks']=lay && lay.built; o[id+'Total']=lay && lay.nx*lay.ny; }
          return o }""")
        chk('big level: only nearby chunks built, first frame fast', r['desertChunks']<=12 and r['desertChunks']<r['desertTotal'] and r['desertMs']<250*slack and r['jungleMs']<250*slack, r)

        # 3. уход с карты освобождает её куски
        r=await E("""()=>{ const t=__t; const L=t.world.desert; t.goTo('desert', L.width*t.TILE/2, L.height*t.TILE/2, ''); t.draw(); const lay=t.dungeonLayers.get(L);
          const J=t.world.jungle; t.goTo('jungle', J.width*t.TILE/2, J.height*t.TILE/2, ''); return {freed: !t.dungeonLayers.get(L) && lay.chunks.size===0} }""")
        chk('chunks disposed when leaving a big level', r['freed'], r)

        # 4. враги за экраном не рисуются, на экране — рисуются
        r=await E("""()=>{ const t=__t,P=t.player,L=t.world.desert; t.goTo('desert', L.width*t.TILE/2, L.height*t.TILE/2, ''); t.setState('playing');
          const alive=L.enemies.filter(e=>e.hp>0), keep=alive.map(e=>[e.x,e.y]);
          alive.forEach((e,i)=>{ e.x=P.x+3000+i*5; e.y=P.y+3000; });
          const ctx=t.ctx, sv=ctx.save; let n=0; ctx.save=function(){ n++; return sv.apply(ctx, arguments); };
          t.draw(); const far=n; n=0;
          alive.slice(0,5).forEach((e,i)=>{ e.x=P.x+60+i*30; e.y=P.y+40; }); t.draw(); const near=n; ctx.save=sv;
          alive.forEach((e,i)=>{ e.x=keep[i][0]; e.y=keep[i][1]; });
          return {far, near, alive: alive.length} }""")
        chk('off-screen enemies culled', r['near'] > r['far'] and r['far'] < r['alive'], r)

        # 5. миникарта: клетки берутся из кэша, а не рисуются тысячами прямоугольников
        r=await E("""()=>{ const t=__t; t.goTo('overworld', t.world.overworld.spawn.x, t.world.overworld.spawn.y, ''); t.setState('playing'); t.draw();
          const ctx=t.ctx, f=ctx.fillRect.bind(ctx); let n=0; ctx.fillRect=function(){ n++; return f(...arguments); }; t.draw(); ctx.fillRect=f; return {fillRects:n} }""")
        chk('minimap drawn from cache (few fillRect per frame)', r['fillRects']<400, r)

        # 6. записи энциклопедии собираются в одно уведомление
        r=await E("()=>{ const t=__t,P=t.player; return Object.keys(t.ENEMY_INFO).slice(0,3) }")
        types=r
        r=await E("""(types)=>{ const t=__t,P=t.player; t.notes.length=0; for(const k of types) delete P.codex.e[k]; for(const k of types) t.codexAddEnemy(k);
          const n=t.notes.filter(n=>n.text.indexOf('📖')===0); return {count:n.length, text:n.length?n[0].text:''} }""", types)
        chk('codex notes merged into one', r['count']==1 and ('+3 записи' in r['text']), r)

        # 7. указатель цели: подпись без текстовой стрелки, на телефоне — компактная панель
        r=await E("""()=>{ const t=__t; t.goTo('overworld', t.world.overworld.spawn.x, t.world.overworld.spawn.y, ''); const tp=t.trackPoint(); return {label: tp&&tp.label, compact: t.hudCompact(), h: t.hudH(), elixY: (t.player.elix.speed=1, t.elixLayout()[0].y) } }""")
        chk('goal label without text arrow; compact HUD on phone', r['label'] and not r['label'].startswith('→') and r['compact'] and r['h']<100 and r['elixY']<130, r)

        # 8. касание панели переключает вид и запоминается
        await pg.mouse.click(60, 40); await pg.wait_for_timeout(100)
        r=await E("()=>({compact: __t.hudCompact(), saved: localStorage.getItem('eldoria_hud'), h: __t.hudH()})")
        chk('tap on panel switches to full HUD and is remembered', (not r['compact']) and r['saved']=='full' and r['h']>150, r)
        await pg.mouse.click(60, 40); await pg.wait_for_timeout(100)
        r=await E("()=>({compact: __t.hudCompact(), saved: localStorage.getItem('eldoria_hud')})")
        chk('second tap returns compact HUD', r['compact'] and r['saved']=='compact', r)
        await E("()=>{ __t.draw(); }")

        chk('no page errors', not errs, errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
