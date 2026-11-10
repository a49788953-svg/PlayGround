(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540, laneY = [174, 246, 318, 390, 462];
  const levels = [
    {name:'THE HUSHING MEADOW', title:'The Hushing Meadow', total:12, interval:2.55, colors:['#52695f','#87957c'], boss:false},
    {name:'CANDLEWICK WOODS', title:'Candlewick Woods', total:15, interval:2.25, colors:['#464b63','#777293'], boss:false},
    {name:'THE BROKEN CAUSEWAY', title:'The Broken Causeway', total:17, interval:2.05, colors:['#66564d','#a18168'], boss:false},
    {name:'BLACKGLASS SHORE', title:'Blackglass Shore', total:19, interval:1.9, colors:['#365a65','#648a8e'], boss:false},
    {name:'THE ROARING GATE', title:'The Roaring Gate', total:22, interval:1.75, colors:['#55415e','#936887'], boss:true}
  ];
  const ui = { start:document.getElementById('startScreen'), message:document.getElementById('messageScreen'), pause:document.getElementById('pauseScreen'), level:document.getElementById('levelName'), shards:document.getElementById('shardCount'), wave:document.getElementById('waveCount'), progress:document.getElementById('progressText'), bar:document.getElementById('progressBar'), ward:document.getElementById('wardBtn'), roar:document.getElementById('roarBtn'), roarHint:document.getElementById('roarHint'), roarCd:document.getElementById('roarCooldown') };
  let state='intro', level=0, shards=100, lives=3, lane=2, wardMode=false, last=0, spawnClock=0, spawned=0, defeated=0, elapsed=0, roarTimer=0, flash=0, wave=1, waveClock=0;
  let enemies=[], shots=[], wards=[], sparks=[], particles=[], floating=[], scenery=[], keys={};
  let knight={x:135,y:laneY[2], attack:0, hurt:0, step:0};
  let seed=71;
  function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  function resetScenery(){scenery=[];for(let i=0;i<38;i++)scenery.push({x:rand()*W,y:85+rand()*408,s:8+rand()*28,kind:Math.floor(rand()*5),a:.08+rand()*.19})}
  resetScenery();
  function startGame(){state='play';level=0;shards=100;lives=3;lane=2;knight.y=laneY[2];beginLevel();ui.start.classList.add('hidden');ui.message.classList.add('hidden');ui.pause.classList.add('hidden');last=performance.now()}
  function beginLevel(){const l=levels[level];ui.level.textContent=l.name;enemies=[];shots=[];wards=[];sparks=[];particles=[];floating=[];spawned=0;defeated=0;spawnClock=1.3;elapsed=0;wave=1;waveClock=0;roarTimer=0;flash=0;wardMode=false;knight.x=135;knight.attack=0;seed=71+level*991;resetScenery();updateUI()}
  function updateUI(){ui.shards.textContent=shards;ui.wave.textContent=wave;const l=levels[level]||levels[0], pct=Math.min(100,Math.round((defeated/l.total)*100));ui.progress.textContent=pct+'%';ui.bar.style.width=pct+'%';ui.ward.disabled=shards<50;ui.roar.disabled=roarTimer>0;ui.roarHint.textContent=roarTimer>0?`Recharging · ${Math.ceil(roarTimer)}s`:'Ready · clear the lanes';ui.roarCd.style.height=roarTimer>0?`${Math.min(100,roarTimer/16*100)}%`:'0'}
  function addText(x,y,text,color='#f3dfb2'){floating.push({x,y,text,color,life:1.2})}
  function burst(x,y,color,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:(rand()-.5)*140,vy:(rand()-.7)*130,life:.35+rand()*.5,color,size:2+rand()*4})}
  function spawnEnemy(){const isBoss=levels[level].boss&&spawned===levels[level].total-1;let type=isBoss?'boss':(level>1&&rand()<.23?'brute':(rand()<.2?'wisp':'shade'));let r=type==='boss'?27:type==='brute'?20:type==='wisp'?13:16;let hp=type==='boss'?34+level*5:type==='brute'?8+level*2:type==='wisp'?2+Math.floor(level/2):3+Math.floor(level*.7);let speed=type==='boss'?12:type==='brute'?13:type==='wisp'?28:19+level*1.3;let row=Math.floor(rand()*5);enemies.push({x:W+35,y:laneY[row],lane:row,type,r,hp,max:hp,speed,hit:0,attack:rand()*.4,flash:0,phase:rand()*6.28});spawned++;if(spawned===Math.floor(levels[level].total*.34))wave=2;if(spawned===Math.floor(levels[level].total*.68))wave=3;}
  function launchRoar(){if(state!=='play'||roarTimer>0)return;roarTimer=16;flash=.7;for(const e of enemies){e.hp-=3;e.x+=60;e.hit=.6;burst(e.x,e.y-5,'#c8a9ff',8);if(e.hp<=0)killEnemy(e)}enemies=enemies.filter(e=>e.hp>0);addText(470,116,'THE ROAR!','#d4b8ff');}
  function killEnemy(e){if(e.dead)return;e.dead=true;defeated++;shards+=e.type==='boss'?35:e.type==='brute'?12:8;burst(e.x,e.y-7,e.type==='wisp'?'#9de8e6':'#b8a5dc',e.type==='boss'?20:10);addText(e.x,e.y-20,e.type==='boss'?'+35':'+'+(e.type==='brute'?12:8),'#9fe4d2');if(rand()<.48)sparks.push({x:e.x,y:e.y-14,life:8,bob:rand()*6.2,value:10});}
  function takeHit(){lives--;flash=.45;addText(98,132,'THE FOUNTAIN FALTERS','#ff9d9d');if(lives<=0){state='lost';showMessage('THE SHADOWS ADVANCE','The fountain has fallen.','TRY AGAIN','☾','THE DARK WORLD NEEDS YOU');}}
  function showMessage(title,text,button,icon='✦',eyebrow='CHAPTER COMPLETE'){document.getElementById('messageTitle').textContent=title;document.getElementById('messageText').textContent=text;document.getElementById('messageBtn').innerHTML=button+' <span>→</span>';document.getElementById('messageIcon').textContent=icon;document.getElementById('messageEyebrow').textContent=eyebrow;ui.message.classList.remove('hidden')}
  function messageAction(){ui.message.classList.add('hidden');if(state==='lost'){startGame();return}if(level<levels.length-1){level++;shards+=30;beginLevel();state='play'}else{state='intro';ui.start.classList.remove('hidden');document.querySelector('.start-card h2').innerHTML='The Dark World<br><em>remembers your roar.</em>';document.querySelector('.intro').textContent='Five chapters held. The Roaring Knight stands watch over the fountain—for now.';document.getElementById('startBtn').textContent='PLAY AGAIN →'}}
  function placeWard(row){if(shards<50){addText(480,145,'NEED 50 SHARDS','#ffcf90');return}const existing=wards.find(w=>w.lane===row);if(existing){addText(existing.x,existing.y-22,'WARD ALREADY HERE','#dfc780');return}shards-=50;wards.push({x:440+Math.floor(rand()*2)*86,y:laneY[row],lane:row,hp:18,fire:1,hit:0});wardMode=false;burst(440,laneY[row]-10,'#e1c47e',12);addText(435,laneY[row]-29,'WARD RAISED','#e8d094');updateUI()}
  function commandLane(row){lane=row;knight.step=.3;if(wardMode){placeWard(row);return}}
  function handleCanvas(e){const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;if(state!=='play')return;for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];if(Math.hypot(s.x-x,s.y-y)<30){shards+=s.value;addText(s.x,s.y-12,'+'+s.value,'#9fe4d2');burst(s.x,s.y,'#9fe4d2',6);sparks.splice(i,1);updateUI();return}}if(y>139&&y<500){let row=0,dist=Infinity;laneY.forEach((v,i)=>{if(Math.abs(y-v)<dist){dist=Math.abs(y-v);row=i}});commandLane(row)}}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();handleCanvas(e)});
  document.getElementById('startBtn').addEventListener('click',startGame);
  document.getElementById('messageBtn').addEventListener('click',messageAction);
  document.getElementById('pauseBtn').addEventListener('click',()=>{if(state==='play'){state='paused';ui.pause.classList.remove('hidden')}else if(state==='paused'){state='play';ui.pause.classList.add('hidden');last=performance.now()}});
  document.getElementById('resumeBtn').addEventListener('click',()=>{state='play';ui.pause.classList.add('hidden');last=performance.now()});
  ui.ward.addEventListener('click',()=>{if(state!=='play')return;if(shards<50){addText(480,145,'NEED 50 SHARDS','#ffcf90');return}wardMode=!wardMode;addText(475,132,wardMode?'TAP A LANE TO RAISE WARD':'WARD CANCELLED','#e8d094')});
  ui.roar.addEventListener('click',launchRoar);
  window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();launchRoar()}if(e.key==='1')ui.ward.click();if(e.key==='Escape'){if(state==='play')document.getElementById('pauseBtn').click();else if(state==='paused')document.getElementById('resumeBtn').click()}if(e.key==='ArrowUp'||e.key==='ArrowDown'){if(state==='play'){lane=Math.max(0,Math.min(4,lane+(e.key==='ArrowUp'?-1:1)))}}});
  function update(dt){if(state!=='play')return;elapsed+=dt;spawnClock-=dt;roarTimer=Math.max(0,roarTimer-dt);flash=Math.max(0,flash-dt);knight.y+=(laneY[lane]-knight.y)*Math.min(1,dt*8);knight.step+=dt*6;knight.attack=Math.max(0,knight.attack-dt);knight.hurt=Math.max(0,knight.hurt-dt);
    if(spawned<levels[level].total&&spawnClock<=0){spawnEnemy();spawnClock=levels[level].interval*(.78+rand()*.45)}
    // The Knight moves within the commanded lane, closes the distance, then strikes.
    const target=enemies.find(e=>e.lane===lane&&!e.dead);
    if(target){const approach=target.x-62;knight.x+=(Math.max(145,Math.min(approach,850))-knight.x)*Math.min(1,dt*4);if(knight.attack<=0&&target.x-knight.x<92){target.hp-=5+Math.floor(level/3);target.hit=.2;knight.attack=.68;knight.hurt=.18;burst(knight.x+35,knight.y-18,'#d7c3ff',7);if(target.hp<=0)killEnemy(target)}}else{knight.x+=(135-knight.x)*Math.min(1,dt*2)}
    // Ward bolts add ranged support while the Knight duels in the selected lane.
    for(const s of shots){s.x+=s.speed*dt;s.life-=dt;for(const e of enemies){if(!e.dead&&e.lane===s.lane&&Math.abs(e.x-s.x)<e.r+8){e.hp-=s.damage;e.hit=.2;s.life=0;burst(s.x,s.y,'#d2c2ff',5);if(e.hp<=0)killEnemy(e);break}}}shots=shots.filter(s=>s.life>0&&s.x<W+20);
    for(const w of wards){w.fire-=dt;w.hit=Math.max(0,w.hit-dt);if(w.fire<=0){const target=enemies.find(e=>!e.dead&&e.lane===w.lane&&e.x>w.x&&e.x-w.x<400);if(target){shots.push({x:w.x+22,y:w.y-18,lane:w.lane,speed:330,damage:2,life:2});w.fire=.95}else w.fire=.25}}
    for(const e of enemies){if(e.dead)continue;e.phase+=dt*3;e.hit=Math.max(0,e.hit-dt);e.flash=Math.max(0,e.flash-dt);const ward=wards.find(w=>w.lane===e.lane&&e.x-e.r<=w.x+18&&e.x>w.x-25);const knightEngaged=e.lane===lane&&e.x-knight.x<e.r+26&&e.x-knight.x>-e.r-30;if(ward){e.attack-=dt;if(e.attack<=0){ward.hp--;ward.hit=.18;e.attack=.8;if(ward.hp<=0){burst(ward.x,ward.y-10,'#d9b670',12);wards=wards.filter(q=>q!==ward)}}}else if(knightEngaged){e.attack-=dt;if(e.attack<=0){knight.hurt=.3;e.hp-=3;e.attack=.85;burst(e.x-6,e.y-16,'#e1b58a',5);if(e.hp<=0)killEnemy(e)}}else e.x-=e.speed*dt;
      if(e.x<112){e.x=112;e.attack-=dt;if(e.attack<=0){takeHit();e.attack=1.1;e.x+=24;if(state!=='play')break}}
    }
    enemies=enemies.filter(e=>!e.dead);for(const s of sparks){s.life-=dt;s.bob+=dt*3}sparks=sparks.filter(s=>s.life>0);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);for(const f of floating){f.y-=25*dt;f.life-=dt}floating=floating.filter(f=>f.life>0);
    if(elapsed>0&&Math.floor(elapsed/8)>Math.floor((elapsed-dt)/8)){shards+=10;addText(476,121,'+10 DARK SHARDS','#9fe4d2')}
    if(spawned>=levels[level].total&&enemies.length===0){state='leveldone';setTimeout(()=>{if(state!=='leveldone')return;state='between';if(level<levels.length-1)showMessage(levels[level].title+' CLEARED','The shadows retreat. The path to the fountain opens. You found '+shards+' dark shards.','NEXT CHAPTER','✦','CHAPTER COMPLETE');else showMessage('THE GATE STANDS','The Roaring Knight holds the line. The Dark World is safe—for tonight.','FINISH','♜','ALL FIVE CHAPTERS CLEARED')},850)}
    updateUI();
  }
  function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
  function drawBackground(){const colors=levels[level]||levels[0];let g=ctx.createLinearGradient(0,70,0,H);g.addColorStop(0,colors.colors[0]);g.addColorStop(1,'#22283a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // distant hills and dusky sky
    ctx.fillStyle='#111723';ctx.beginPath();ctx.moveTo(0,170);for(let x=0;x<=W;x+=80)ctx.lineTo(x,138+Math.sin(x*.013+level)*14);ctx.lineTo(W,245);ctx.lineTo(0,245);ctx.fill();
    ctx.fillStyle='#cbb68a';ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(790,115,31,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // far silhouettes: crooked trees / towers
    for(let i=0;i<9;i++){let x=i*122-22,h=38+(i*37%52);ctx.fillStyle=i%2?'#151d29':'#17202b';ctx.fillRect(x+12,155-h,7,h);ctx.beginPath();ctx.moveTo(x-7,163-h*.65);ctx.lineTo(x+15,127-h);ctx.lineTo(x+36,163-h*.65);ctx.fill();ctx.beginPath();ctx.moveTo(x-3,150-h*.35);ctx.lineTo(x+15,121-h*.45);ctx.lineTo(x+32,150-h*.35);ctx.fill()}
    // lane turf strips
    for(let i=0;i<5;i++){let y=laneY[i];ctx.fillStyle=i%2?'#ffffff06':'#080d190c';ctx.fillRect(0,y-34,W,68);ctx.fillStyle='#d5d9d41c';ctx.fillRect(0,y+33,W,1);ctx.fillStyle='#11182688';ctx.fillRect(0,y+30,W,4)}
    // speckled weeds and little flowers
    for(const p of scenery){ctx.globalAlpha=p.a;ctx.fillStyle=p.kind===0?'#d1c48f':p.kind===1?'#9cc0a0':'#182b2a';if(p.kind<2){ctx.beginPath();ctx.arc(p.x,p.y,p.s*.1,0,Math.PI*2);ctx.fill();ctx.fillRect(p.x-1,p.y,p.s*.08,p.s*.42)}else{ctx.fillRect(p.x,p.y,p.s*.13,p.s*.45);ctx.fillRect(p.x-p.s*.13,p.y+p.s*.18,p.s*.26,p.s*.08)} }ctx.globalAlpha=1;
    // shadow fountain / objective
    ctx.fillStyle='#161927';ctx.beginPath();ctx.ellipse(60,310,39,92,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#81819b';ctx.beginPath();ctx.moveTo(35,366);ctx.lineTo(42,292);ctx.lineTo(77,292);ctx.lineTo(85,366);ctx.closePath();ctx.fill();ctx.fillStyle='#aaa9b7';ctx.fillRect(39,286,42,10);ctx.fillRect(44,278,32,8);ctx.fillStyle='#a984d9';ctx.shadowColor='#ad8de8';ctx.shadowBlur=18+Math.sin(elapsed*3)*4;ctx.beginPath();ctx.arc(60,271,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#d9b980';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('FOUNTAIN',60,390);
    // lane row markers
    for(let i=0;i<5;i++){ctx.fillStyle=i===lane?'#dfc384':'#777b8d';ctx.globalAlpha=i===lane?.92:.45;ctx.beginPath();ctx.moveTo(111,laneY[i]-5);ctx.lineTo(118,laneY[i]);ctx.lineTo(111,laneY[i]+5);ctx.fill()}ctx.globalAlpha=1;
    // top in-world chapter strip
    roundRect(18,16,222,31,7,'#111522b8','#ffffff12');ctx.fillStyle='#e5c27e';ctx.font='500 10px monospace';ctx.textAlign='left';ctx.fillText('CHAPTER 0'+(level+1),31,36);ctx.fillStyle='#d0d0d6';ctx.font='10px monospace';ctx.fillText(levels[level].name,106,36);
    for(let i=0;i<3;i++){ctx.fillStyle=i<lives?'#e7bb78':'#515362';ctx.font='16px sans-serif';ctx.fillText('♥',W-81+i*21,39)}
  }
  function drawKnight(){const x=knight.x||135,y=knight.y;const walk=Math.sin(knight.step)*2.5;ctx.save();ctx.translate(x,y);if(knight.hurt>0)ctx.globalAlpha=.72;
    // cloak and boots
    ctx.fillStyle='#242432';ctx.beginPath();ctx.moveTo(-14,-29);ctx.lineTo(13,-27);ctx.lineTo(19,17);ctx.lineTo(7,28);ctx.lineTo(-18,20);ctx.closePath();ctx.fill();ctx.fillStyle='#5e4059';ctx.beginPath();ctx.moveTo(-14,-20);ctx.lineTo(-26,5);ctx.lineTo(-16,21);ctx.lineTo(-9,2);ctx.closePath();ctx.fill();
    ctx.fillStyle='#12141d';ctx.fillRect(-13,15+walk,11,13);ctx.fillRect(4,17-walk,12,11);ctx.fillStyle='#c0b9a7';ctx.fillRect(-16,26+walk,15,4);ctx.fillRect(3,27-walk,17,4);
    // armor torso and shoulder plates
    ctx.fillStyle='#8c8d95';ctx.beginPath();ctx.moveTo(-12,-27);ctx.lineTo(11,-28);ctx.lineTo(15,9);ctx.lineTo(0,17);ctx.lineTo(-16,8);ctx.closePath();ctx.fill();ctx.fillStyle='#555966';ctx.fillRect(-11,-15,23,4);ctx.fillStyle='#d5c795';ctx.fillRect(-2,-22,5,21);ctx.fillRect(-7,-8,15,3);
    ctx.fillStyle='#b8b2a1';ctx.fillRect(-20,-24,11,10);ctx.fillRect(9,-25,12,11);ctx.fillStyle='#555963';ctx.fillRect(-19,-20,9,3);ctx.fillRect(11,-21,9,3);
    // horned helm
    ctx.fillStyle='#c5c1b4';ctx.beginPath();ctx.moveTo(-14,-27);ctx.lineTo(-12,-45);ctx.lineTo(-25,-55);ctx.lineTo(-10,-52);ctx.lineTo(-4,-43);ctx.lineTo(5,-44);ctx.lineTo(13,-55);ctx.lineTo(8,-42);ctx.lineTo(14,-28);ctx.closePath();ctx.fill();ctx.fillStyle='#5c5e6a';ctx.fillRect(-12,-38,24,12);ctx.fillStyle='#161621';ctx.fillRect(-12,-35,24,6);ctx.fillStyle='#f0cb8a';ctx.shadowColor='#eed097';ctx.shadowBlur=10;ctx.fillRect(-7,-33,5,2);ctx.fillRect(3,-33,5,2);ctx.shadowBlur=0;ctx.fillStyle='#e3bc76';ctx.fillRect(-2,-27,4,8);
    // sword, angled up during attack
    ctx.save();ctx.translate(14,-4);ctx.rotate(knight.hurt>0?-.95:0);ctx.fillStyle='#d8dce1';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(29,-30);ctx.lineTo(24,-32);ctx.lineTo(-3,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#d8b677';ctx.fillRect(-7,-7,11,3);ctx.fillStyle='#51443d';ctx.fillRect(-4,-4,4,11);ctx.restore();
    if(knight.hurt>0){ctx.strokeStyle='#c3a6ff';ctx.globalAlpha=.8;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-17,41+Math.sin(elapsed*30)*4,-.9,.85);ctx.stroke()}
    ctx.restore();
  }
  function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y+Math.sin(e.phase)*2);const shade=e.type==='wisp'?'#75c6c1':e.type==='brute'?'#62546e':e.type==='boss'?'#592f48':'#55455c';ctx.globalAlpha=e.hit>0?.55:1;if(e.type==='wisp'){ctx.shadowColor='#70d2cb';ctx.shadowBlur=13;ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,-8,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d2f3df';ctx.fillRect(-5,-10,3,2);ctx.fillRect(3,-10,3,2);ctx.beginPath();ctx.moveTo(-9,-1);ctx.lineTo(0,15);ctx.lineTo(9,-1);ctx.fill();ctx.shadowBlur=0}else if(e.type==='boss'){
      ctx.fillStyle='#271f31';ctx.beginPath();ctx.moveTo(-25,13);ctx.lineTo(-22,-19);ctx.lineTo(-12,-34);ctx.lineTo(-6,-19);ctx.lineTo(0,-38);ctx.lineTo(7,-20);ctx.lineTo(18,-30);ctx.lineTo(24,-12);ctx.lineTo(26,16);ctx.closePath();ctx.fill();ctx.fillStyle='#8c4c6b';ctx.fillRect(-18,-16,36,26);ctx.fillStyle='#211c2b';ctx.fillRect(-13,-12,27,17);ctx.fillStyle='#f3c27b';ctx.shadowColor='#fa936b';ctx.shadowBlur=12;ctx.fillRect(-10,-6,7,4);ctx.fillRect(4,-6,7,4);ctx.shadowBlur=0;ctx.fillStyle='#a18da0';ctx.fillRect(-23,10,46,8);ctx.fillStyle='#c8ad85';ctx.fillRect(-18,18,11,10);ctx.fillRect(7,18,11,10)
    }else{
      const scale=e.type==='brute'?1.25:1;ctx.scale(scale,scale);ctx.fillStyle='#282231';ctx.fillRect(-12,5,24,17);ctx.fillStyle=shade;ctx.beginPath();ctx.moveTo(-13,7);ctx.lineTo(-15,-11);ctx.lineTo(-8,-20);ctx.lineTo(7,-20);ctx.lineTo(14,-10);ctx.lineTo(12,9);ctx.closePath();ctx.fill();ctx.fillStyle='#7d6b7d';ctx.fillRect(-15,-11,30,7);ctx.fillStyle='#171723';ctx.fillRect(-11,-7,22,10);ctx.fillStyle='#f2bd84';ctx.shadowColor='#f9b779';ctx.shadowBlur=6;ctx.fillRect(-8,-5,4,3);ctx.fillRect(5,-5,4,3);ctx.shadowBlur=0;ctx.fillStyle='#a98a8d';ctx.fillRect(-9,19,7,8);ctx.fillRect(3,19,7,8);ctx.fillStyle='#554557';ctx.fillRect(-19,-3,7,15);ctx.fillRect(12,-3,7,15);
    }
    ctx.globalAlpha=1;if(e.hp<e.max||e.type==='boss'){let bw=e.type==='boss'?54:35;ctx.fillStyle='#15141c';ctx.fillRect(-bw/2,-e.r-13,bw,4);ctx.fillStyle=e.type==='boss'?'#eb8b83':'#c891a1';ctx.fillRect(-bw/2,-e.r-13,bw*Math.max(0,e.hp/e.max),4)}ctx.restore();}
  function drawWard(w){ctx.save();ctx.translate(w.x,w.y);ctx.fillStyle='#211f29';ctx.beginPath();ctx.ellipse(0,22,29,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#77757e';ctx.beginPath();ctx.moveTo(-20,17);ctx.lineTo(-15,-12);ctx.lineTo(-10,-20);ctx.lineTo(10,-20);ctx.lineTo(15,-12);ctx.lineTo(20,17);ctx.closePath();ctx.fill();ctx.fillStyle='#d9bf85';ctx.fillRect(-17,-5,34,4);ctx.fillStyle='#3e3b4a';ctx.fillRect(-10,-14,20,25);ctx.fillStyle='#d8bd80';ctx.fillRect(-2,-14,4,25);ctx.fillRect(-10,-4,20,4);ctx.fillStyle='#8e719f';ctx.shadowColor='#bca2e8';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(0,-23,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(w.hit>0){ctx.strokeStyle='#fff0c1';ctx.lineWidth=2;ctx.strokeRect(-21,-22,42,42)}ctx.restore()}
  function draw(){ctx.clearRect(0,0,W,H);drawBackground();
    // selected lane's faint command beam
    ctx.save();ctx.globalAlpha=.08;ctx.fillStyle='#dfc584';ctx.fillRect(118,laneY[lane]-32,760,64);ctx.restore();
    for(const w of wards)drawWard(w);
    for(const e of enemies)drawEnemy(e);
    for(const s of shots){ctx.save();ctx.strokeStyle='#d8c6ff';ctx.lineWidth=3;ctx.shadowColor='#b79cef';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(s.x-13,s.y+5);ctx.lineTo(s.x+6,s.y-4);ctx.stroke();ctx.fillStyle='#f0e2c7';ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fill();ctx.restore()}
    drawKnight();
    for(const s of sparks){const bob=Math.sin(s.bob)*4;ctx.save();ctx.translate(s.x,s.y+bob);ctx.shadowColor='#84e7dc';ctx.shadowBlur=14;ctx.fillStyle='#8de4d8';ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?5:10;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#dcfff0';ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);ctx.fill();ctx.restore()}
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life*1.6);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size)}ctx.globalAlpha=1;
    for(const f of floating){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.color;ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.shadowColor='#14131e';ctx.shadowBlur=4;ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0}ctx.globalAlpha=1;
    if(wardMode){ctx.fillStyle='#e7d49e';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('CHOOSE A LANE FOR YOUR ROOK WARD',W/2,80);ctx.strokeStyle='#e7d49e77';ctx.setLineDash([6,6]);ctx.strokeRect(121,laneY[lane]-32,760,64);ctx.setLineDash([])}
    if(flash>0){ctx.fillStyle=`rgba(181,146,238,${flash*.22})`;ctx.fillRect(0,0,W,H);ctx.strokeStyle=`rgba(211,186,255,${flash*.9})`;ctx.lineWidth=5;ctx.strokeRect(4,4,W-8,H-8)}
    // immersive in-board wave marker
    roundRect(810,15,132,31,7,'#111522b8','#ffffff12');ctx.fillStyle='#aaa9b7';ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText('WAVE',823,35);for(let i=0;i<3;i++){ctx.fillStyle=i<wave?'#d8b576':'#454555';ctx.beginPath();ctx.arc(874+i*20,30,4,0,Math.PI*2);ctx.fill()}
  }
  function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;if(state==='play')update(dt);draw();requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
})();
