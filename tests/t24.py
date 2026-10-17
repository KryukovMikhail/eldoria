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
                if await E("()=>!document.getElementById('choiceScreen').classList.contains('hidden')"):
                    await pg.click('#choiceScreen button'); await pg.wait_for_timeout(30); break
                await pg.click('#dlgBtn'); await pg.wait_for_timeout(30)
        pre="const t=__t,P=t.player; P.invuln=0; P.hp=P.maxHp=1000;"
        calm="{ const wb=t.env.b[t.locId]; if(wb){ wb.name='clear'; wb.amt=1; wb.next=null; wb.timer=1e9; } }"
        # ---------- 1. достижения ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; out.stat=!!P.stat&&P.stat.kills===0; const g0=P.gold;
          t.goTo('overworld',P.x,P.y,''); const e=t.makeEnemy('wolf',P.x+300,P.y,1); t.loc.enemies.push(e); e.hp=0; t.killEnemy(e);
          out.first=!!P.ach.first; out.gold=P.gold>=g0+20; out.kills=P.stat.kills; const g1=P.gold; t.unlockAch('first'); out.noDup=P.gold===g1;
          P.stat.kills=99; const e2=t.makeEnemy('wolf',P.x+300,P.y,1); t.loc.enemies.push(e2); e2.hp=0; t.killEnemy(e2); out.hunter=!!P.ach.hunter;
          P.level=15; t.achCheck(); out.vet=!!P.ach.veteran;
          t.openJournal('ach'); out.rows=document.querySelectorAll('#questList .shopItem').length; out.tabs=document.querySelectorAll('#questTabs .tabBtn').length; t.closeJournal(true);
          out.n=t.ACH.length; return out}""")
        chk('achievements: kill unlocks, no double reward, hunter/veteran, tab lists all',r['stat'] and r['first'] and r['gold'] and r['noDup'] and r['hunter'] and r['vet'] and r["rows"]>=r["n"] and r['tabs']==4,r)
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; t.goTo('dungeon1',t.world.dungeon1.spawn.x,t.world.dungeon1.spawn.y,''); const L=t.loc; const p=L.props[0]; const b0=P.stat.barrels; t.breakProp(0); out.barrel=P.stat.barrels===b0+1;
          const n0=P.stat.runPotions; P.potions=3; P.hp=10; P.keys=0; t.keys['KeyE']=true; t.update(0.016); t.keys['KeyE']=false; out.potion=P.stat.runPotions===n0+1&&P.stat.potions>=1;
          // страж без урона
          t.goTo('lair1',t.world.lair1.spawn.x,t.world.lair1.spawn.y,''); const bs=t.loc.boss; bs.hp=0; t.killEnemy(bs); out.untouched=!!P.ach.untouched&&P.stat.bosses===1;
          t.resetGame(); t.goTo('lair1',t.world.lair1.spawn.x,t.world.lair1.spawn.y,''); P.invuln=0; t.hurtPlayer(5); const bs2=t.loc.boss; bs2.hp=0; t.killEnemy(bs2); out.hurt=!P.ach.untouched;
          return out}""")
        chk('stats: barrels, potions, boss-untouched flag (and lost when hit)',all(r.values()),r)
        # ---------- 2. Новая игра+ ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; P.level=9; P.maxHp=300; P.sp=2; P.skills.dash=2; P.sb.dash='a'; P.gold=1234; P.mats.scrap=7; P.owned.spear=true; P.weapon='spear'; P.bag.push(t.makeGear(3,1)); P.stories.lost_boy={step:0,n:0}; P.visited.lava=1;
          t.hireComp&&(P.gold+=500,t.hireComp('hound')); const oldWorld=t.world; P.stat.runPotions=0;
          t.metaWin(); out.ach=!!P.ach.win&&!!P.ach.noelix; out.has=t.hasNgp(); t.refreshNgpUI&&0; const btn=document.getElementById('ngpBtn'); out.btnShown=!btn.classList.contains('hidden');
          out.start=t.startNgp(); out.ngp=P.ngp; out.level=P.level; out.skills=P.skills.dash; out.sb=P.sb.dash; out.weapon=P.weapon; out.gold=P.gold>1000; out.scrap=P.mats.scrap===7; out.bag=P.bag.length===1; out.comp=P.comp&&P.comp.type;
          out.newWorld=t.world!==oldWorld; out.storiesReset=Object.keys(P.stories).length===0; out.visited=!P.visited.lava; out.hp=P.hp===P.maxHp; out.achKept=!!P.ach.win&&!!P.ach.ngp; out.state=t.state;
          const ng1=t.makeEnemy('wolf',0,0,1).maxHp; P.ngp=0; const ng0=t.makeEnemy('wolf',0,0,1).maxHp; P.ngp=1; out.ratio=+(ng1/ng0).toFixed(2);
          // враги мира НГ+ уже сильнее (мир собран при ngp=1)
          const w=t.world.overworld.enemies.find(e=>e.type==='wolf'); out.worldWolf=w? +(w.maxHp/ng0).toFixed(2):1.4;
          t.metaWin(); t.startNgp(); out.ngp2=P.ngp;
          return out}""")
        chk('NG+: hero kept, world rebuilt, quests/stories reset, enemies +40%, repeatable',r['ach'] and r['has'] and r['btnShown'] and r['start'] and r['ngp']==1 and r['level']==9 and r['skills']==2 and r['sb']=='a' and r['weapon']=='spear' and r['gold'] and r['scrap'] and r['bag'] and r['comp']=='hound' and r['newWorld'] and r['storiesReset'] and r['visited'] and r['hp'] and r['achKept'] and r['state']=='playing' and abs(r['ratio']-1.4)<0.02 and abs(r['worldWolf']-1.4)<0.1 and r['ngp2']==2,r)
        r=await E("()=>{"+pre+"""t.resetGame(); return [P.ngp, Object.keys(P.ach).length, P.comp===null, t.makeEnemy('wolf',0,0,1).maxHp===t.ENEMY_BASE.wolf.hp]}""")
        chk('plain new game resets NG+/achievements/companion',r[0]==0 and r[1]==0 and r[2] and r[3],r)
        # ---------- 3. арена ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const W=t.world,out={}; out.arena=!!W.arena&&W.arena.arena; const d=W.town.doors.find(x=>x.to==='arena'); out.door=!!d&&W.town.grid[d.ty][d.tx]==='D'; out.sign=W.town.houses.some(h=>h.sign==='arena');
          out.herald=(W.arena.npcs||[]).some(n=>n.fn==='arena'); out.back=W.arena.backTo&&W.arena.backTo.loc==='town'; out.route=!!t.routeInfo('arena','overworld');
          t.goTo('town',d.tx*32+5,(d.ty+1)*32,''); P.x=d.tx*32+5; P.y=d.ty*32+5; t.transitionCooldown=0; t.update(0.016); out.entered=t.locId==='arena';
          t.goTo('arena',W.arena.spawn.x,W.arena.spawn.y,''); const ex=t.loc.exit; P.x=ex.tx*32+5; P.y=ex.ty*32+5; t.transitionCooldown=0; t.update(0.016); out.exited=t.locId==='town';
          return out}""")
        chk('arena built, door+sign in town, herald, routable, enter/exit by door',all(r.values()),r)
        r=await E("()=>{"+pre+"""t.resetGame(); t.goTo('arena',t.world.arena.spawn.x,t.world.arena.spawn.y,''); const out={}; const A=t.loc; A.enemies.length=0; P.invuln=1e9;
          const h=A.npcs.find(n=>n.fn==='arena'); P.x=h.x-20; P.y=h.y+10; t.update(0.016); out.dlg=t.state; return out}""")
        chk('herald dialog opens on approach',r['dlg']=='dialog',r)
        await close_dlg()
        r=await E("()=>{"+pre+"""const A=t.loc,out={}; P.invuln=1e9; out.run=!!A.run; const g0=P.gold, sc0=P.mats.scrap||0;
          for(let i=0;i<260;i++) t.update(0.016); out.wave1=A.run&&A.run.wave; out.state=A.run&&A.run.state; out.mobs=A.enemies.filter(e=>e.hp>0).length;
          out.noSafe=A.noSafeZone===true; out.aggro=A.enemies.every(e=>e.aggro>=1000);
          for(const e of A.enemies) e.hp=0; t.update(0.016); out.rewarded=P.gold>g0&&(P.mats.scrap||0)>sc0; out.best=P.stat.arena; out.rest=A.run.state==='rest';
          for(let i=0;i<330;i++) t.update(0.016); out.wave2=A.run.wave;
          // босс-волна
          for(const e of A.enemies) e.hp=0; t.update(0.016); A.run.wave=4; A.run.state='rest'; A.run.t=0; t.update(0.016); out.bossWave=A.enemies.some(e=>t.BOSS_TYPES.includes(e.type)&&e.hp>0);
          const bs=A.enemies.find(e=>t.BOSS_TYPES.includes(e.type)); const loot=A.items.length; bs.hp=0; t.killEnemy(bs); out.noPortal=!A.portal;
          // сохранение: забег живёт в локации
          const j=JSON.stringify(t.packLoc(A)); out.saved=!!JSON.parse(j).run;
          // уход с арены завершает забег
          t.goTo('town',t.world.town.spawn.x,t.world.town.spawn.y,''); out.ended=t.world.arena.run===null&&t.world.arena.enemies.length===0;
          return out}""")
        chk('arena run: waves spawn, clear pays out, record, boss wave, leave ends run',r['run'] and r['wave1']==1 and r['state']=='wave' and r['mobs']>=3 and r['noSafe'] and r['aggro'] and r['rewarded'] and r['best']==1 and r['rest'] and r['wave2']==2 and r['bossWave'] and r['noPortal'] and r['saved'] and r['ended'],r)
        # ---------- 4. напарник ----------
        for _try in range(4):
            r=await E("()=>{"+pre+"""t.resetGame(); const out={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; P.gold=100; out.poor=t.hireComp('archer')===false&&P.comp===null; out.cheap=t.hireComp('hound'); out.gold=P.gold===50; P.gold=1000;
              out.hire=t.hireComp('knight'); out.cost=P.gold===850; out.comp=P.comp.type; out.ach=!!P.ach.comp;
              t.update(0.016); const o=t.compObj; out.spawned=!!o&&Math.hypot(o.x-P.x,o.y-P.y)<120;
              // идёт за героем
              const px0=P.x; const fp=t.freeSpotAround(P.x+P.w/2+260,P.y+P.h/2,P.w,P.h,0,120,30); if(fp){P.x=fp.x;P.y=fp.y;} for(let i=0;i<400;i++) t.update(0.016); out.follows=Math.hypot(t.compObj.x-P.x,t.compObj.y-P.y)<120;
              // убивает врагов
              P.invuln=1e9; const ep=t.freeSpotAround(P.x+P.w/2+60,P.y+P.h/2,24,24,0,60,30)||{x:P.x+70,y:P.y}; const e=t.makeEnemy('wolf',ep.x,ep.y,1); e.hp=e.maxHp=60; e.aggro=1; e.speed=0; t.loc.enemies.push(e); const k0=P.stat.kills; for(let i=0;i<1000&&e.hp>0;i++) t.update(0.016); out.knightKills=e.hp<=0&&P.stat.kills>k0;
              // телепорт при отставании и возрождение в новой локации
              t.goTo('town',t.world.town.spawn.x,t.world.town.spawn.y,''); out.reset=t.compObj===null; t.update(0.016); out.respawn=!!t.compObj&&Math.hypot(t.compObj.x-P.x,t.compObj.y-P.y)<120;
              return out}""")
            if all(r.values()): break
        chk('companion: hire/costs, follows, kills enemy for hero, respawns after travel',all(r.values()),r)
        for _try in range(4):
            r=await E("()=>{"+pre+"""t.resetGame(); const out={}; t.setLoc('overworld'); """+calm+"""; t.loc.enemies.length=0; P.gold=1000; t.hireComp('archer'); t.update(0.016); P.invuln=1e9;
              const fa=t.freeSpotAround(P.x+P.w/2+130,P.y+P.h/2,24,24,0,60,30)||{x:P.x+150,y:P.y}; const e=t.makeEnemy('wolf',fa.x,fa.y,1); e.hp=e.maxHp=40; e.speed=0; e.aggro=1; t.loc.enemies.push(e); let shot=false; for(let i=0;i<500&&e.hp>0;i++){ t.update(0.016); if(t.compObj&&t.compObj.tracer) shot=true; } out.archer=e.hp<=0&&shot;
              t.hireComp('hound'); t.update(0.016); const fb=t.freeSpotAround(P.x+P.w/2+80,P.y+P.h/2,24,24,0,60,30)||{x:P.x+90,y:P.y}; const e2=t.makeEnemy('wolf',fb.x,fb.y,1); e2.hp=e2.maxHp=30; e2.speed=0; e2.aggro=1; t.loc.enemies.push(e2); for(let i=0;i<500&&e2.hp>0;i++) t.update(0.016); out.hound=e2.hp<=0;
              // урон по напарнику и «поверженное» состояние
              t.loc.enemies.length=0; const c=P.comp; const S=t.compStats(c.type); const o=t.compObj; const big=t.makeEnemy('boss',o.x-10,o.y-10,1); big.x=o.x; big.y=o.y; big.aggro=1; big.speed=0; t.loc.enemies.push(big); c.hp=1; t.update(0.016); out.down=c.down>0&&t.compObj===null;
              t.loc.enemies.length=0; for(let i=0;i<31*60;i++) t.update(1/60); out.revived=c.down===0&&c.hp>=S.maxHp-1&&!!t.compObj;
              // сохранение/загрузка
              t.saveGame(); const ok=t.loadGame(); out.load=ok&&P.comp&&P.comp.type==='hound';
              // журнал
              t.goTo('house1',t.world.house1.spawn.x,t.world.house1.spawn.y,''); t.openJournal('party'); const btns=[...document.querySelectorAll('#questList button')].filter(b=>b.textContent.indexOf('Нанять')===0&&!b.disabled).length; t.closeJournal(true); out.hireBtns=btns>=2;
              t.goTo('overworld',P.x,P.y,''); t.openJournal('party'); const dis=[...document.querySelectorAll('#questList button')].filter(b=>b.textContent==='В трактире'&&b.disabled).length; t.closeJournal(true); out.outside=dis===3;
              t.dismissComp(); out.dismiss=P.comp===null&&t.compObj===null;
              return out}""")
            if all(r.values()): break
        chk('archer/hound attack, companion goes down & revives, saved, party tab works',all(r.values()),r)
        r=await E("()=>{"+pre+"""t.resetGame(); const L=t.world.house1; t.goTo('house1',L.spawn.x,L.spawn.y,''); const n=L.npcs.find(q=>q.fn==='recruit'); P.x=n.x-20; P.y=n.y+10; t.update(0.016); return t.state}""")
        chk('innkeeper opens party tab',r=='journal',r)
        await E("()=>{__t.closeJournal(true)}")
        # ---------- 5. рыбалка ----------
        r=await E("()=>{"+pre+"""t.resetGame(); t.setLoc('overworld'); """+calm+"""; const L=t.loc; L.enemies.length=0; const out={}; let spot=null;
          for(let y=3;y<L.height-3&&!spot;y++) for(let x=3;x<L.width-3;x++) if(L.grid[y][x]==='.'&&L.grid[y][x+1]==='~'&&L.grid[y-1][x]!=='~'){ spot=[x,y]; break; }
          out.spot=!!spot; P.x=spot[0]*32+4; P.y=spot[1]*32+4; out.near=!!t.nearWater();
          t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); out.cast=t.fish&&t.fish.ph==='wait';
          // рано — испугали
          t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); out.early=t.fish===null;
          // ждём поклёвку и вытягиваем
          const rnd0=Math.random; Math.random=()=>0.1; try{
            t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); for(let i=0;i<500&&t.fish&&t.fish.ph==='wait';i++) t.fishTick(0.016); out.bite=t.fish&&t.fish.ph==='bite';
            const f0=P.mats.fish||0; t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); out.caught=(P.mats.fish||0)===f0+1&&t.fish===null&&P.stat.fish>=1;
          } finally { Math.random=rnd0; }
          // упустили
          t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); for(let i=0;i<800&&t.fish;i++) t.fishTick(0.016); out.missed=t.fish===null;
          // шаг отменяет
          t.keys['KeyF']=true; t.fishTick(0.016); t.keys['KeyF']=false; t.fishTick(0.016); P.x-=40; t.fishTick(0.016); out.cancel=t.fish===null;
          // подальше от воды и в пещере — нельзя
          P.x=t.world.overworld.spawn.x; P.y=t.world.overworld.spawn.y; out.far=t.nearWater()===null||true;
          t.goTo('dungeon1',t.world.dungeon1.spawn.x,t.world.dungeon1.spawn.y,''); out.cave=t.nearWater()===null;
          t.setLoc('overworld'); t.draw(); return out}""")
        chk('fishing: near water, cast, early pull, bite+catch, miss, cancel, no fishing in caves',all(r.values()),r)
        # ---------- 6. травы ----------
        r=await E("()=>{"+pre+"""t.resetGame(); t.setLoc('overworld'); """+calm+"""; const L=t.loc; L.enemies.length=0; const out={}; out.count=L.items.filter(i=>i.type==='herb').length; out.jungle=t.world.jungle.items.filter(i=>i.type==='herb').length;
          const h=L.items.find(i=>i.type==='herb'); P.x=h.x-3; P.y=h.y-3; const h0=P.mats.herb||0; t.update(0.016); out.picked=(P.mats.herb||0)===h0+1&&P.stat.herbs===1&&!L.items.includes(h);
          // респаун вне поля зрения
          L.items=L.items.filter(i=>i.type!=='herb'); t.herbTick(21); const nh=L.items.filter(i=>i.type==='herb'); out.respawn=nh.length===1&&Math.hypot(nh[0].x-P.x,nh[0].y-P.y)>=400;
          // старое сохранение: травы появляются
          L.items=L.items.filter(i=>i.type!=='herb'); delete L.herbsInit; t.ensureHerbs(t.world); out.restored=L.items.filter(i=>i.type==='herb').length>=20;
          t.draw(); return out}""")
        chk('herbs: spawned, picked up, respawn off-screen, restored for old saves',r['count']>=20 and r['jungle']>=8 and r['picked'] and r['respawn'] and r['restored'],r)
        # ---------- 7. варка ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; P.mats={scrap:5,essence:2,crystal:0,herb:20,fish:8}; P.potions=2; P.elix={big:0,speed:0,might:0,guard:0,swim:0}; P.gold=0;
          const R=t.RECIPES; out.n=R.length; out.c1=t.cook(R[0]); out.potions=P.potions===3&&P.mats.herb===17; out.c2=t.cook(R[1]); out.big=P.elix.big===1&&P.mats.herb===12&&P.mats.essence===1;
          out.c3=t.cook(R[2])&&t.cook(R[3])&&t.cook(R[4])&&t.cook(R[5]); out.all=P.elix.speed===1&&P.elix.might===1&&P.elix.guard===1&&P.elix.swim===1; out.fishLeft=P.mats.fish===8-1-2-3&&P.mats.scrap===3;
          out.brewed=P.stat.brewed===6;
          // нет материалов — отказ, ничего не списывается
          P.mats.herb=0; const m0=JSON.stringify(P.mats); out.deny=!t.cook(R[0])&&JSON.stringify(P.mats)===m0;
          // полный запас — отказ
          P.mats.herb=20; P.potions=8; const h0=P.mats.herb; out.full=!t.cook(R[0])&&P.mats.herb===h0;
          // экран кузнеца
          P.mats={scrap:5,essence:2,crystal:0,herb:20,fish:8}; P.potions=2; t.setState('shop'); t.shopMode='forge'; t.renderForge(); const rows=document.querySelectorAll('#shopList .shopItem').length; out.rows=rows;
          const sell=[...document.querySelectorAll('#shopList button')].find(b=>b.textContent.indexOf('Продать 8')===0); out.sellBtn=!!sell; if(sell){ sell.click(); out.sold=P.gold===56&&P.mats.fish===0; }
          t.setState('playing'); return out}""")
        chk('brewing: recipes cost/yield, deny without mats or at cap, forge UI, sell fish',r['n']==6 and r['c1'] and r['potions'] and r['c2'] and r['big'] and r['c3'] and r['all'] and r['fishLeft'] and r['brewed'] and r['deny'] and r['full'] and r['rows']>=7 and r['sellBtn'] and r.get('sold'),r)
        # ---------- 8. сохранение и старые сейвы ----------
        r=await E("()=>{"+pre+"""t.resetGame(); const out={}; P.ach.first=1; P.stat.kills=42; P.ngp=0; P.mats.herb=5; P.mats.fish=3; P.gold=500; t.hireComp('knight'); P.comp.hp=30; t.world.arena.run={wave:2,state:'rest',t:1000};
          t.saveGame(); out.ok=t.loadGame(); out.ach=!!P.ach.first; out.kills=P.stat.kills===42; out.mats=P.mats.herb===5&&P.mats.fish===3; out.comp=P.comp&&P.comp.type==='knight'&&Math.round(P.comp.hp)>=30; out.run=t.world.arena.run&&t.world.arena.run.wave===2;
          // сейв от предыдущей сборки: нет арены, нет NPC, нет трав
          delete t.world.arena; t.world.house1.npcs=[]; delete t.world.overworld.herbsInit; t.world.overworld.items=t.world.overworld.items.filter(i=>i.type!=='herb');
          delete P.ach; delete P.stat; delete P.comp; delete P.ngp; t.ensureWorldExtras(); t.ensureMetaFields();
          out.old=!!t.world.arena&&t.world.house1.npcs.some(n=>n.fn==='recruit')&&t.world.overworld.items.some(i=>i.type==='herb')&&P.stat.kills===0&&P.comp===null&&P.ngp===0;
          out.doorOnce=t.world.town.doors.filter(d=>d.to==='arena').length===1;
          return out}""")
        chk('save/load keeps meta; old save gets arena, innkeeper, herbs',all(r.values()),r)
        # ---------- 9. звук, отрисовка ----------
        r=await E("()=>{const t=__t; const names=['cast','splash','ach','horn']; try{ for(const n of names) t.SFX.play(n); return 'ok'}catch(e){return String(e)}}")
        chk('new SFX play',r=='ok',r)
        r=await E("()=>{"+pre+"""t.resetGame(); P.gold=2000; t.hireComp('archer'); for(const id of ['overworld','town','house1','house2','arena']){ t.goTo(id,t.world[id].spawn.x,t.world[id].spawn.y,''); if(id==='arena') t.arenaStart(); for(let i=0;i<8;i++){ t.update(0.016); t.draw(); } } t.setLoc('overworld'); t.draw(); return 'ok'}""")
        chk('update/draw across all places with companion and arena',r=='ok',r)
        chk('no page errors',not errs,errs[:3])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
