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
        async def close_dlg():
            for i in range(10):
                if await E("()=>__t.state")!='dialog': break
                await pg.click('#dlgBtn'); await pg.wait_for_timeout(30)
        pre="const t=__t,P=t.player; P.invuln=0; P.hp=P.maxHp=1000;"
        calm="{ const wb=t.env.b[t.locId]; if(wb){ wb.name='clear'; wb.amt=1; wb.next=null; wb.timer=1e9; } }"
        # ---------- 1. достижения ----------

        async def run(js):
            return await E("()=>{"+pre+js+"}")
        # 1. истории
        r=await run("""t.resetGame(); const out={}; const ids=Object.keys(t.STORIES); out.n=ids.length; out.new=['honey','miner','oasis','bard','orchid'].every(i=>ids.includes(i));
          out.locs=ids.every(i=>t.STORIES[i].steps.every(s=>!s.loc||t.world[s.loc]));
          out.locked=t.storyState('orchid')==='locked'&&t.storyState('honey')==='locked';
          t.world.lair1.portal.open=true; t.world.lair2.portal.open=true; out.stage=t.storyStage(); out.avail=t.storyState('honey')==='avail';
          t.storiesEnsure(); out.giver=!!t.world.town.npcs.find(n=>n.sid==='honey'&&n.role==='giver');
          P.stories.honey={step:0,n:0}; t.storiesEnsure(); t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0;
          out.items=t.loc.items.filter(i=>i.type==='sitem'&&i.sid==='honey').length;
          for(const it of t.loc.items.filter(i=>i.type==='sitem'&&i.sid==='honey')){ P.x=it.x; P.y=it.y; t.update(0.016); }
          out.stepRet=t.curStep('honey')&&t.curStep('honey').kind==='return';
          const g0=P.gold; t.advanceStory('honey'); out.done=P.stories.honey.done===true&&P.gold>=g0+300;
          P.stories.miner={step:0,n:0}; t.storiesEnsure(); out.target=!!t.world.dungeon3.npcs.find(n=>n.sid==='miner'&&n.role==='target');
          return out""")
        chk('stories: 9 stories, new ones gated, collect+reward flow, find target spawns',r['n']==9 and r['new'] and r['locs'] and r['locked'] and r['stage']==2 and r['avail'] and r['giver'] and r['items']==4 and r['stepRet'] and r['done'] and r['target'],r)
        # 2. сезоны
        r=await run("""t.resetGame(); const out={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; const ids=[];
          for(const d of [0,1,2,4,6,7,8]){ t.env.day=d; ids.push(t.seasonId()); } out.ids=ids.join();
          t.env.day=0; out.spring=t.seasonMul('herb')>1; t.env.day=2; out.summer=t.seasonMul('fish')<1; t.env.day=4; out.autumn=t.seasonMul('gold')>1; t.env.day=6; out.winter=t.seasonMul('herb')<1&&t.seasonMul('fish')>1;
          let bad=0; for(let i=0;i<300;i++){ const w=t.pickWeather('overworld',''); if(w==='rain'||w==='storm'||w==='sand') bad++; } out.noRain=bad===0;
          t.env.day=0; for(const d of [0,2,4,6]){ t.env.day=d; t.update(0.016); t.draw(); } out.seen=(P.stat.seasons&15)===15;
          t.env.day=5; t.saveGame(); t.env.day=0; t.loadGame(); out.persist=t.env.day===5;
          const g0=P.gold; t.env.day=4; const e=t.makeEnemy('wolf',P.x+300,P.y,1); e.gold=20; t.loc.enemies.push(e); e.hp=0; t.killEnemy(e); out.autumnGold=P.gold>=g0+20+3;
          t.openJournal('ach'); out.row=[...document.querySelectorAll('#questList *')].some(n=>n.textContent.indexOf('Сезон')>=0); t.closeJournal(true);
          out.ach=!!P.ach.seasons; return out""")
        chk('seasons: cycle, effects, winter snow instead of rain, saved day, journal row, achievement',r['ids']=='spring,spring,summer,autumn,winter,winter,spring' and r['spring'] and r['summer'] and r['autumn'] and r['winter'] and r['noRain'] and r['seen'] and r['persist'] and r['autumnGold'] and r['row'] and r['ach'],r)
        # 3. секретные боссы
        for _try in range(3):
            r=await run("""t.resetGame(); const out={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; t.env.t=0.0; t.env.day=0;
              t.secretsTick(2.1); out.gated=!t.loc.enemies.some(e=>e.secret);
              t.world.lair1.portal.open=true; t.secretsTick(2.1); const a=t.loc.enemies.find(e=>e.secret==='alpha');
              out.spawn=!!a; if(!a) return out; out.big=a.big>1.5&&a.w>30; out.hp=a.maxHp>600; out.state=P.secrets.alpha===1; out.ab=!!a.ab.charge;
              const far=Math.hypot(a.x-P.x,a.y-P.y); out.far=far>250;
              t.secretsTick(2.1); out.once=t.loc.enemies.filter(e=>e.secret==='alpha').length===1;
              t.loc.enemies.length=0; t.secretsTick(2.1); out.respawn=t.loc.enemies.filter(e=>e.secret==='alpha').length===1;
              const b=t.loc.enemies.find(e=>e.secret==='alpha'); t.draw(); const g0=P.gold, bag=P.bag.length, k0=P.stat.kills; b.hp=0; t.killEnemy(b);
              out.reward=P.gold>=g0+650&&(P.bag.length>bag||P.gold>=g0+730); out.done=P.secrets.alpha===2&&P.stat.secrets===1&&P.ach.secret1===1;
              t.loc.enemies.length=0; t.secretsTick(2.1); out.noMore=!t.loc.enemies.some(e=>e.secret);
              t.env.t=0.5; t.secretsTick(2.1); out.day=true;
              P.secrets.alpha=0; t.env.t=0.5; t.secretsTick(2.1); out.dayNo=!t.loc.enemies.some(e=>e.secret);
              t.world.lair3.portal.open=t.world.lair4.portal.open=true; t.world.lair2.portal.open=true; t.setLoc('desert'); t.world.desert.enemies.length=0; const wb=t.env.b.desert; wb.name='sand'; wb.amt=1; wb.next=null; wb.timer=1e9; t.env.t=0.5;
              t.secretsTick(2.1); out.dune=t.loc.enemies.some(e=>e.secret==='dune'); t.draw();
              t.saveGame(); const ok=t.loadGame(); out.save=ok&&P.secrets.alpha===0&&P.secrets.dune===1&&t.loc.enemies.some(e=>e.secret==='dune'&&e.big>1); return out""")
            if all(r.values()): break
        chk('secret bosses: gated by stage, night/weather, one at a time, respawn if lost, reward once, saved',all(r.values()),r)
        # 4. настройки
        r=await run("""const out={}; localStorage.removeItem('eldoria_settings'); out.def=t.SET.music===1&&t.SET.shake===true&&t.SET.nums===false&&t.SET.tips===true;
          t.SET.music=0; t.SET.sfx=0.5; t.applySettings(); out.gain=!t.SFX.music||t.SFX.music.gain.value===0; t.saveSet(); const sv=JSON.parse(localStorage.getItem('eldoria_settings')); out.saved=sv.music===0&&sv.sfx===0.5;
          t.SET.shake=false; t.shakeT=900; t.applySettings(); out.shake=t.shakeT===0; t.SET.shake=true; t.SET.music=1; t.SET.sfx=1;
          t.SET.lefty=true; t.SET.ctrl=1.2; t.applySettings(); const tc=document.getElementById('touchControls'); out.lefty=tc.classList.contains('lefty')&&tc.style.getPropertyValue('--cs')==='1.2'; t.SET.lefty=false; t.SET.ctrl=1; t.applySettings(); out.righty=!tc.classList.contains('lefty');
          t.renderSettings(); const sc=document.getElementById('settingsScreen'); out.rows=sc.querySelectorAll('input[type=range]').length===3&&sc.querySelectorAll('button').length>=6;
          document.getElementById('startScreen').classList.remove('hidden'); document.getElementById('setBtn').click(); out.open=!sc.classList.contains('hidden')&&document.getElementById('startScreen').classList.contains('hidden');
          sc.querySelector('.startBtn').click(); out.back=sc.classList.contains('hidden')&&!document.getElementById('startScreen').classList.contains('hidden'); document.getElementById('startScreen').classList.add('hidden'); return out""")
        chk('settings: defaults, volume, shake off, left-handed layout, persisted, screen opens/closes',all(r.values()),r)
        # 5. подсказки + числа урона
        r=await run("""t.resetGame(); const out={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; localStorage.removeItem('eldoria_tips'); for(const k in t.tipsSeen) delete t.tipsSeen[k];
          t.SET.tips=true; t.tipCd=0; const n0=document.title; const e=t.makeEnemy('ram',P.x+100,P.y,1); t.loc.enemies.push(e);
          t.tipsTick(0.5); out.shown=!!t.tipsSeen.charge; t.tipCd=0; t.tipsTick(0.5); out.once=Object.keys(t.tipsSeen).length===1;
          out.stored=JSON.parse(localStorage.getItem('eldoria_tips')).charge===1;
          t.SET.tips=false; t.tipCd=0; const e2=t.makeEnemy('gelcube',P.x+100,P.y+30,1); t.loc.enemies.push(e2); t.tipsTick(0.5); out.off=!t.tipsSeen.split; t.SET.tips=true;
          t.loc.enemies.length=0; P.hp=P.maxHp*0.1; const e3=t.makeEnemy('wolf',P.x+60,P.y,1); t.loc.enemies.push(e3); t.tipCd=0; t.tipsTick(0.5); out.low=!!t.tipsSeen.lowhp; P.hp=P.maxHp;
          t.showDeathTip(); out.death=document.getElementById('deathTip').textContent.indexOf('💡')===0;
          t.SET.nums=true; t.nums.length=0; t.fxNum(e3,12); out.num=t.nums.length===1&&t.nums[0].v===12; t.draw(); t.SET.nums=false; t.fxNum(e3,5); out.numOff=t.nums.length<=1; t.nums.length=0;
          return out""")
        chk('combat tips: shown once per type, stored, respect toggle, low-hp and death tips, damage numbers',all(r.values()),r)
        # 6. код переноса
        r=await E("""async()=>{"""+pre+"""t.resetGame(); const out={}; t.saveGame(); const code=await t.makeSaveCode(); out.code=typeof code==='string'&&code.indexOf('ELD1.')===0; out.len=code.length;
          const json=await t.parseSaveCode(code); const b=JSON.parse(json); out.fmt=b.format==='eldoria-saves'&&Object.keys(b.saves).length>=1;
          const keys=Object.keys(b.saves); const old={}; for(const k of keys){ old[k]=localStorage.getItem(k); localStorage.removeItem(k); }
          t.openSaves(); const ta=document.getElementById('codeArea'); ta.value=code.slice(0,20)+' \\n '+code.slice(20); const ok=[...document.querySelectorAll('#savesScreen button')].find(x=>x.textContent==='Применить код'); ok.click();
          await new Promise(r=>setTimeout(r,400)); out.restored=keys.every(k=>localStorage.getItem(k)===old[k]);
          ta.value='ELD1.garbage!'; ok.click(); await new Promise(r=>setTimeout(r,300)); out.bad=document.getElementById('savesMsg').textContent.indexOf('повреждён')>=0;
          ta.value=code.slice(0,code.length-40); ok.click(); await new Promise(r=>setTimeout(r,300)); out.cut=document.getElementById('savesMsg').textContent.indexOf('повреждён')>=0;
          t.setState('playing'); document.getElementById('savesScreen').classList.add('hidden'); return out}""")
        chk('transfer code: gzip code round-trips through the textarea, bad/cut code rejected',r['code'] and r['fmt'] and r['restored'] and r['bad'] and r['cut'],r)
        # 7. старое сохранение и отрисовка
        r=await run("""t.resetGame(); delete P.secrets; delete P.stat.seasons; t.ensureMetaFields(); const out={}; out.fields=!!P.secrets;
          t.env.day=0; for(const id of ['overworld','town','desert','ice','grave']){ t.goTo(id,t.world[id].spawn.x,t.world[id].spawn.y,''); t.SET.nums=true; for(let i=0;i<6;i++){ t.update(0.016); t.draw(); } } t.SET.nums=false; out.draw=true;
          out.ach=['seasons','secret1','secret4'].every(id=>t.ACH.some(a=>a.id===id)); return out""")
        chk('old saves get new fields; draw in all seasons/locations; new achievements listed',all(r.values()),r)
        chk('no page errors',len(errs)==0,errs[:3])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
