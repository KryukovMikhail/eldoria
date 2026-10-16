import asyncio, sys, os, shutil, tempfile, subprocess, time
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
async def main():
    d=tempfile.mkdtemp()
    for f in ['index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-512-maskable.png']: shutil.copy(os.path.join(ROOT,f),d)
    port=8765+os.getpid()%200
    srv=subprocess.Popen([sys.executable,'-m','http.server',str(port),'--bind','127.0.0.1'],cwd=d,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':900,'height':500})
            errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://127.0.0.1:{port}/index.html'); 
            await pg.wait_for_function("()=>navigator.serviceWorker.controller!==null",timeout=15000)
            chk('first install: no banner', await pg.evaluate("()=>document.getElementById('updateBar').classList.contains('hidden')"))
            caches0=await pg.evaluate("async()=>await caches.keys()")
            sw=open(os.path.join(d,'sw.js')).read(); old=[k for k in caches0][0]
            open(os.path.join(d,'sw.js'),'w').write(sw.replace(old,'eldoria-D999.999'))
            await pg.evaluate("async()=>{ const r=await navigator.serviceWorker.getRegistration(); await r.update(); }")
            await pg.wait_for_function("()=>!document.getElementById('updateBar').classList.contains('hidden')",timeout=15000)
            chk('new sw.js -> update bar shown', True)
            chk('old version keeps running until clicked', old in (await pg.evaluate("async()=>await caches.keys()")) and await pg.evaluate("async()=>!!(await navigator.serviceWorker.getRegistration()).waiting"))
            await pg.evaluate("()=>document.getElementById('updateLater').click()")
            chk('"later" hides bar', await pg.evaluate("()=>document.getElementById('updateBar').classList.contains('hidden')"))
            await pg.reload(); await pg.wait_for_function("()=>!document.getElementById('updateBar').classList.contains('hidden')",timeout=15000)
            chk('waiting worker re-offers bar after reload', True)
            async with pg.expect_navigation(timeout=15000): await pg.evaluate("()=>document.getElementById('updateNow').click()")
            await pg.wait_for_function("async()=>(await caches.keys()).includes('eldoria-D999.999')",timeout=15000)
            chk('click -> reload on new version (new cache active)', True)
            await pg.wait_for_timeout(500)
            chk('bar hidden after update', await pg.evaluate("()=>document.getElementById('updateBar').classList.contains('hidden')"))
            chk('no page errors', not errs, errs[:2])
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(d,ignore_errors=True)
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
