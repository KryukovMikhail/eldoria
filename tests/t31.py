import asyncio, sys, os, json
from playwright.async_api import async_playwright
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
# Сборка D001.049: сжатые сохранения, версии и миграции, фоновая запись, предупреждение о нехватке места
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':900,'height':500})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3):
            try: await pg.click('#dlgBtn', timeout=500)
            except Exception: break
        E=pg.evaluate

        # 1. LZ: точное восстановление, в том числе эмодзи и кириллицы; без одиночных суррогатов в сжатом виде
        r=await E("""()=>{ const t=__t, o={};
          const samples=['', 'a', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', JSON.stringify({x:'🐺🐺🐺🐺🐺🐺🐺🐺 волк волк волк волк', y:[1,2,3,1,2,3,1,2,3,1,2,3]})];
          let big=''; for(let i=0;i<4000;i++) big += '{"t":"'+(i%7)+'🔥","v":'+(i*13%101)+'},';
          samples.push(big);
          o.round = samples.every(s=>t.lzUnpack(t.lzPack(s))===s);
          o.noLone = samples.every(s=>{ const z=t.lzPack(s); for(let i=0;i<z.length;i++){ const c=z.charCodeAt(i);
              if(c>=0xD800&&c<=0xDBFF){ const n=z.charCodeAt(i+1); if(!(n>=0xDC00&&n<=0xDFFF)) return false; i++; }
              else if(c>=0xDC00&&c<=0xDFFF) return false; } return true; });
          return o }""")
        chk('lz round-trip, no lone surrogates', r['round'] and r['noLone'], r)

        # 2. полное сохранение после обхода всех локаций: сжато минимум в 5 раз и загружается
        r=await E("""()=>{ const t=__t, o={};
          for(const id of Object.keys(t.world)){ const L=t.world[id]; if(L.width) t.goTo(id, L.width*t.TILE/2, L.height*t.TILE/2); }
          t.goTo('overworld', t.world.overworld.spawn.x, t.world.overworld.spawn.y, '');
          t.player.gold=4321; t.saveGameNow();
          const raw=localStorage.getItem('eldoria_save_v1'); o.tag=raw.indexOf('ELZ1:')===0;
          const plain=JSON.stringify(t.decodeSave(raw)).length; o.ratio=+(plain/raw.length).toFixed(1); o.kb=Math.round(raw.length/1024);
          o.v=t.decodeSave(raw).v===t.SAVE_VERSION;
          t.player.gold=0; o.load=t.loadGame('eldoria_save_v1'); o.gold=t.player.gold; o.locs=Object.keys(t.world).length;
          return o }""")
        chk('full save compressed >=5x and loads', r['tag'] and r['ratio']>=5 and r['v'] and r['load'] and r['gold']==4321 and r['locs']>=35, r)

        # 3. фоновая запись через Worker: снимок берётся в момент вызова, запись приходит позже
        r=await E("""async()=>{ const t=__t, o={}; localStorage.removeItem('eldoria_save_v1');
          t.player.gold=111; const ret=t.saveGameAsync(); t.player.gold=999;
          o.ret=ret; o.worker=!!t.lzWorker;
          for(let i=0;i<50 && !localStorage.getItem('eldoria_save_v1'); i++) await new Promise(r=>setTimeout(r,20));
          const d=t.decodeSave(localStorage.getItem('eldoria_save_v1')); o.gold=d.player.gold;
          // устаревший фоновый результат не перетирает более свежее немедленное сохранение
          t.player.gold=222; t.saveGameAsync(); t.player.gold=333; t.saveGameNow();
          await new Promise(r=>setTimeout(r,400));
          o.after=t.decodeSave(localStorage.getItem('eldoria_save_v1')).player.gold;
          return o }""")
        chk('async save via worker, snapshot at call time, stale result dropped', r['ret'] and r['worker'] and r['gold']==111 and r['after']==333, r)

        # 4. переход между локациями: основной поток тратит на сохранение мало времени
        r=await E("""()=>{ const t=__t, ts=[];
          for(let i=0;i<6;i++){ const a=performance.now(); t.saveGameAsync(); ts.push(performance.now()-a); }
          ts.sort((a,b)=>a-b); return +ts[3].toFixed(1) }""")
        slack=float(os.environ.get('PERF_SLACK','1'))
        chk('main-thread save cost small', r < 25*slack, str(r)+' ms')

        # 5. миграция: старое несжатое v1 читается, пережимается и получает текущую версию
        r=await E("""()=>{ const t=__t, o={}; t.saveGameNow();
          const d=t.decodeSave(localStorage.getItem('eldoria_save_v1')); d.v=1; d.player.gold=555;
          localStorage.setItem('eldoria_slot_2', JSON.stringify(d)); const before=localStorage.getItem('eldoria_slot_2').length;
          o.info=!!t.getSaveInfo('eldoria_slot_2') && t.getSaveInfo('eldoria_slot_2').v===t.SAVE_VERSION;
          t.compactStoredSaves(); const raw=localStorage.getItem('eldoria_slot_2');
          o.packed=raw.indexOf('ELZ1:')===0 && raw.length*4 < before;
          o.load=t.loadGame('eldoria_slot_2'); o.gold=t.player.gold;
          // сохранение из будущей версии игры не загружается и не ломает меню
          const f=t.decodeSave(raw); f.v=t.SAVE_VERSION+5; localStorage.setItem('eldoria_slot_3', JSON.stringify(f));
          o.future=t.getSaveInfo('eldoria_slot_3')===null && t.loadGame('eldoria_slot_3')===false;
          localStorage.removeItem('eldoria_slot_2'); localStorage.removeItem('eldoria_slot_3');
          return o }""")
        chk('v1 save migrates and gets compacted; future version rejected', r['info'] and r['packed'] and r['load'] and r['gold']==555 and r['future'], r)

        # 6. нехватка места: игрок видит предупреждение, функция сообщает о неудаче
        r=await E("""()=>{ const t=__t, o={}; t.setState('playing');
          const orig=Storage.prototype.setItem; Storage.prototype.setItem=function(){ throw new DOMException('full','QuotaExceededError'); };
          try{ o.ret=t.saveGameNow(); } finally { Storage.prototype.setItem=orig; }
          o.err=t.saveErr.length>0; o.note=t.notes.some(n=>n.text.indexOf('⚠')===0);
          o.ok2=t.saveGameNow(); o.cleared=t.saveErr==='';
          return o }""")
        chk('quota error reported to the player', r['ret']==False and r['err'] and r['note'] and r['ok2'] and r['cleared'], r)

        # 7. экспорт/импорт файлом переносит сжатые сохранения
        r=await E("""async()=>{ const t=__t, o={}; t.player.gold=777; t.saveGameNow();
          const raw=localStorage.getItem('eldoria_save_v1'); const bundle={format:'eldoria-saves',v:1,saves:{eldoria_save_v1:raw}};
          localStorage.removeItem('eldoria_save_v1');
          t.importSaves(new Blob([JSON.stringify(bundle)])); await new Promise(r=>setTimeout(r,300));
          o.same=localStorage.getItem('eldoria_save_v1')===raw; o.gold=t.getSaveInfo('eldoria_save_v1').player.gold;
          return o }""")
        chk('import of compressed saves', r['same'] and r['gold']==777, r)

        chk('no page errors', not errs, errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
