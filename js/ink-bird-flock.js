(() => {
'use strict';
// Decorative ink flock, adapted from the reviewed standalone preview.
// Keep the controller outside the PJAX container and reuse it after navigation.
if (window.__moyuanInkBirds) { window.__moyuanInkBirds.refresh(); return; }
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (motion.matches) return;
const eligible = () => !document.body.classList.contains('my-landing-only') &&
  !new RegExp('^/(?:portfolio|games|music)(?:/|$)').test(location.pathname);
const canvas = document.createElement('canvas');
canvas.id = 'ink-bird-flock'; canvas.setAttribute('aria-hidden', 'true');
canvas.setAttribute('role', 'presentation'); document.body.appendChild(canvas);
const ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); return; }
const status = {textContent: ''};
let active = false, dark = document.documentElement.dataset.theme === 'dark';
const sceneLabel = {textContent: ''};
const setState = () => { canvas.dataset.scene = formation ? names[formation.kind] : '自由迁徙'; };
function disabled() { return !eligible() || motion.matches || !!document.querySelector('[data-spiral-toggle][aria-pressed="true"]'); }

const reduced=false,TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
let count=innerWidth<600?500:innerWidth<1000?900:1400,speed=6,W=0,H=0,dpr=1,birds=[],route=[],routeLength=1,baseLength=1,sceneAmount=0,nextAuto=3,nextWander=5,scenicY=0,scenicHeight=80,clock=0,last=0,raf=0,hidden=document.hidden,protectedRects=[],fullyCovered=false,articleBounds,formation=null,nextMotif=0,lastTrigger=-20,scrollMark=0,scrollTimer,resizeTimer;
const INTERACTION_RADIUS=150,NOISE=.65;
const PERSPECTIVE=550,FOCUS_SCALE=PERSPECTIVE/(PERSPECTIVE+350);
let scrollParallax=0,lastScroll=scrollY;
const mouse={x:-1000,y:-1000,active:false,weight:0};
const wind={samples:[],pulses:[],energy:0,lastTime:0,vx:0,vy:0,lastSample:0};
function flockAnchor(){if(!formation)return {x:W*.5,y:H*.5};if([2,4,5,6].includes(formation.kind))return {x:W*.5,y:scenicY};return {x:formation.side==='left'?articleBounds.left*.49:articleBounds.right+(W-articleBounds.right)*.51,y:H*.48};}
function project(b){const scale=PERSPECTIVE/(PERSPECTIVE+b.z),near=clamp(1-b.z/650,0,1),mx=mouse.active?clamp((mouse.x-W*.5)/(W*.5),-1,1)*mouse.weight:0,my=mouse.active?clamp((mouse.y-H*.5)/(H*.5),-1,1)*mouse.weight:0,fx=b.focusX??W*.5,fy=b.focusY??H*.5,wx=W*.5+(fx-W*.5)/FOCUS_SCALE,wy=H*.5+(fy-H*.5)/FOCUS_SCALE;return {x:fx+(b.x-wx)*scale+mx*near*2.5,y:fy+(b.y-wy)*scale+my*near*1.6+scrollParallax*near,scale,near};}
function airAt(b){const p=project(b);let fx=0,fy=0,total=0,depth=0;for(const node of wind.samples){const age=clock-node.born;if(age<0||age>2.5)continue;const dx=p.x-node.x,dy=p.y-node.y,along=dx*node.dx+dy*node.dy,across=-dx*node.dy+dy*node.dx,influence=Math.exp(-((along/115)**2+(across/65)**2))*Math.exp(-age/1.05)*smooth(1-age/2.5)*node.power;if(influence<.002)continue;const side=Math.tanh(across/22+b.band*.5),spread=side*65;fx+=(node.dx*80-node.dy*spread-node.curl*dy*.25)*influence;fy+=(node.dy*80+node.dx*spread+node.curl*dx*.25)*influence;depth+=Math.sin(b.seed)*28*influence;total+=influence;}
let power=1-Math.exp(-total);if(total){fx=fx/total*power;fy=fy/total*power;depth=depth/total*power;}for(const pulse of wind.pulses){const age=clock-pulse.born,dx=p.x-pulse.x,dy=p.y-pulse.y,d=Math.hypot(dx,dy);if(age<0||age>3.2||d<1||d>110)continue;const strength=smooth(1-d/110)*Math.exp(-age/.85)*smooth(1-age/3.2);fx+=dx/d*135*strength;fy+=dy/d*135*strength;depth+=Math.sin(b.seed)*32*strength;power=Math.max(power,strength);}
const sensitivity=(b.isOutlier?1.3:1)*(.65+p.near*.35),length=Math.hypot(fx,fy),limit=145;if(length>limit){fx*=limit/length;fy*=limit/length;}return {x:fx*sensitivity,y:fy*sensitivity,power,depth:depth*sensitivity,boost:power*(b.isOutlier?.95:.55)};}
const names=['卷曲','月牙','山峦','羽毛','书法弧线','云团','长带','折返','空洞','分合'];
const naturalOrder=[5,6,0,7,8,9],poeticOrder=[1,2,3,4];let autoRound=0;

function curve(points,t){const n=points.length,f=((t%1+1)%1)*n,i=Math.floor(f),u=f-i,p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];const axis=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u);return {x:axis('x'),y:axis('y')};}
function spaces(){
  const content=document.querySelector('#post #article-container, .about-page, .home-shell, #article-container, #content-inner');
  const r=content?content.getBoundingClientRect():{left:W*.18,right:W*.82};
  articleBounds={left:clamp(r.left,24,W*.45),right:clamp(r.right,W*.55,W-24)};
  const selector='#page-header,#nav,#sidebar,#aside-content,#rightside,#footer,.home-hero-fullscreen,.hero-art,#mini-music,dialog,[role="dialog"],h1,h2,h3,h4,p,li,dt,dd,summary,blockquote,pre,table,img,video,iframe,button,input,select,textarea,.post-meta,.chapter,.eyebrow,.pagination,.gallery-item';
  protectedRects=[...document.querySelectorAll(selector)].filter(el=>{
    const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length;
  }).map(el=>{const r=el.getBoundingClientRect();return {left:r.left-10,right:r.right+10,top:r.top-10,bottom:r.bottom+10};}).filter(r=>r.bottom>0&&r.top<H&&r.right>0&&r.left<W);
  fullyCovered=protectedRects.some(r=>r.left<=0&&r.right>=W&&r.top<=0&&r.bottom>=H);
  const occupied=protectedRects.filter(r=>r.left<W*.7&&r.right>W*.3).sort((a,b)=>a.top-b.top);
  let previous=80,best=0;scenicY=H*.23;scenicHeight=85;
  for(const r of occupied){const top=clamp(r.top,0,H-60),gap=top-previous;if(gap>best&&gap>55){best=gap;scenicY=(previous+top)/2;scenicHeight=Math.min(gap,170);}previous=Math.max(previous,r.bottom);}
  if(H-60-previous>best&&H-60-previous>55){scenicY=(previous+H-60)/2;scenicHeight=Math.min(H-60-previous,170);}
  const left=Math.max(16,articleBounds.left*.46),right=articleBounds.right+(W-articleBounds.right)*.54;
  // The free route stays connected around the reading column; no isolated zones.
  const points=[{x:left,y:H*.16},{x:left*.8,y:H*.46},{x:left*1.1,y:H*.8},{x:W*.24,y:H+55},{x:W*.5,y:H+55},{x:W*.76,y:H+55},{x:right,y:H*.8},{x:right+12,y:H*.46},{x:right-12,y:H*.16},{x:W*.76,y:-65},{x:W*.24,y:-65}];
  const base=sampleRoute(points);route=base.points;baseLength=routeLength=base.length;
}
function sampleRoute(points){const samples=Array.from({length:661},(_,i)=>curve(points,i/660)),distances=[0];let length=0;for(let i=1;i<samples.length;i++){length+=Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y);distances.push(length);}let j=1;return {length,points:Array.from({length:641},(_,i)=>{const d=i/640*length;while(j<distances.length-1&&distances[j]<d)j++;const f=(d-distances[j-1])/(distances[j]-distances[j-1]||1);return {x:mix(samples[j-1].x,samples[j].x,f),y:mix(samples[j-1].y,samples[j].y,f)};})};}
function along(u){const f=((u%1+1)%1)*640,i=Math.floor(f),t=f-i,a=route[i],b=route[i+1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),nx:-dy/d,ny:dx/d};}
function shapePoint(b,u){const phase=((u%1+1)%1),q=(1-Math.cos(phase*TAU))*.5,rightSide=formation.side!=='left',cx=rightSide?articleBounds.right+(W-articleBounds.right)*.51:articleBounds.left*.49,cy=H*.48,kind=formation.kind,natural=[0,5,7,8,9].includes(kind),rx=Math.min(natural?118:65,(rightSide?W-articleBounds.right:articleBounds.left)*(natural?.4:.33)),ry=Math.min(natural?220:132,H*(natural?.29:.17));let x,y;
if(kind===0){const r=.64+.2*Math.sin(phase*TAU*2)+b.band*.27,a=phase*TAU;x=cx+Math.cos(a)*rx*r;y=cy+Math.sin(a)*ry*r;}
else if(kind===1){const a=Math.PI*.32+q*Math.PI*1.36,thickness=Math.sin(q*Math.PI)**.8*(b.band*19+Math.sin(phase*TAU)*10);x=cx+Math.cos(a)*(rx+thickness);y=cy+Math.sin(a)*(ry+thickness*.9);}
else if(kind===3){const stem=b.index%9===0,t=(Math.floor(b.index/2)%24)/23,side=b.index%2?1:-1,width=Math.sin(t*Math.PI)**.72*rx*.86,spineX=cx+(t-.5)*rx*.7,spineY=cy+(t-.5)*ry*2;if(stem){x=cx+(q-.5)*rx*.7+Math.sin(phase*TAU)*2;y=cy+(q-.5)*ry*2;}else{x=spineX+side*width*q;y=spineY-width*q*.58+Math.sin(phase*TAU)*2+b.band;}}
else if(kind===5){const a=phase*TAU,breath=1+Math.sin(clock*.18)*.06,r=Math.sqrt(clamp((b.seed||1)/TAU,.08,1))*(.85+.12*Math.sin(a*3+clock*.1)),span=W*.36,thickness=Math.min(58,scenicHeight*.34);x=W*.5+Math.cos(a)*span*r*breath+Math.sin(a*2)*span*.1*r;y=scenicY+Math.sin(a)*thickness*r+Math.cos(a*2+clock*.12)*thickness*.3*r;}
else if(kind===6){const amplitude=Math.min(38,scenicHeight*.26),a=q*Math.PI*1.7-.4,width=(8+Math.sin(q*Math.PI)*15)*b.band;x=W*(.16+.68*q)+Math.cos(a)*width*.3;y=scenicY+Math.sin(a)*amplitude+width;}
else if(kind===7){const a=.12*Math.PI+q*1.64*Math.PI,width=Math.sin(q*Math.PI)*(b.band*17+Math.sin(phase*TAU)*9),bend=.82+.12*Math.sin(clock*.14);x=cx+Math.cos(a)*(rx*bend+width);y=cy+Math.sin(a)*(ry*.9+width)+Math.sin(q*Math.PI)*ry*.18;}
else if(kind===8){const a=phase*TAU,r=.7+b.band*.22+.1*Math.sin(a*3+clock*.13),gapTilt=Math.sin(clock*.12)*.12;x=cx+Math.cos(a)*rx*r+Math.sin(a)*rx*gapTilt;y=cy+Math.sin(a)*ry*r+Math.cos(a*2)*ry*.1;}
else if(kind===9){const a=phase*TAU,age=clock-formation.start,split=Math.sin(clamp((age-3)/30,0,1)*Math.PI)**2,side=b.index%2?1:-1,r=Math.sqrt(clamp((b.seed||1)/TAU,.03,1))*.7,bridge=b.index%11===0;x=cx+Math.cos(a)*rx*r+side*split*rx*.14;y=cy+Math.sin(a)*ry*r*(1-split*.35)+side*split*ry*.52;if(bridge)y=cy+Math.sin(a)*ry*(.45+split*.35);}
else{const amplitude=Math.min(44,scenicHeight*.32),peaks=Math.exp(-(((q-.3)/.065)**2))+.77*Math.exp(-(((q-.69)/.09)**2));x=W*(.17+.66*q);y=kind===2?scenicY+amplitude*.35-amplitude*peaks:scenicY+Math.sin(q*Math.PI*1.65-.3)*amplitude*.78;y+=b.band*(kind===2?4:3+Math.sin(q*Math.PI)*6)+Math.sin(phase*TAU)*3;}
if([0,5,7,8,9].includes(kind)){const ax=kind===5?W*.5:cx,ay=kind===5?scenicY:cy,turn=Math.sin((clock-formation.start)*.16)*(kind===5?.025:.09),dx=x-ax,dy=y-ay;x=ax+dx*Math.cos(turn)-dy*Math.sin(turn)*.25;y=ay+dx*Math.sin(turn)+dy*Math.cos(turn);}
return {x:W*.5+(x-W*.5)/FOCUS_SCALE,y:H*.5+(y-H*.5)/FOCUS_SCALE};}
function nearestFreePhase(b){let nearest=0,best=Infinity;for(let i=0;i<route.length;i+=4){const p=route[i],x=W*.5+(p.x-W*.5)/FOCUS_SCALE,y=H*.5+(p.y-H*.5)/FOCUS_SCALE,d=(x-b.x)**2+(y-b.y)**2;if(d<best){best=d;nearest=i/640;}}return nearest;}
function markMotif(){setState();}
function envelope(){if(!formation)return 0;const age=clock-formation.start,holdEnd=3+formation.hold;if(age<3)return smooth(age/3);if(age<holdEnd)return 1;if(age<holdEnd+3)return 1-smooth((age-holdEnd)/3);formation=null;markMotif(-1);sceneLabel.textContent='自由迁徙';status.textContent='鸟群沿留白连续迁徙，有聚有散。';return 0;}
function flowPoint(b,u,amount,phaseDelta=0){const a=along(u),side=Math.min(articleBounds.left,W-articleBounds.right),width=Math.min(83,Math.max(11,side*.43)),breath=.95+.35*Math.sin(u*TAU*2-clock*.2),meander=(Math.sin(u*TAU*5+clock*.18)*25+Math.sin(u*TAU*8-clock*.1)*14)*Math.min(1,side/150),offset=b.band*width*breath+meander+Math.sin(u*TAU*3+b.seed+clock*.25)*9*NOISE;let x=a.x+a.nx*offset,y=a.y+a.ny*offset;
if(b.wander){const age=(clock-b.wander.start)/b.wander.duration;if(age>=1)b.wander=null;else{const e=Math.sin(clamp(age,0,1)*Math.PI)**2,drift=Math.min(65,Math.max(20,side*.34))*e,phase=b.seed+age*TAU*1.4;x+=a.nx*drift+Math.sin(phase)*drift*.35;y+=a.ny*drift+Math.cos(phase)*drift*.45;}}
const free={x:W*.5+(x-W*.5)/FOCUS_SCALE,y:H*.5+(y-H*.5)/FOCUS_SCALE};if(formation&&b.shapeId===formation.id){const shape=shapePoint(b,b.shapeU+phaseDelta);if(b.social&&clock>b.social.start&&clock<b.social.start+b.social.duration){const t=(clock-b.social.start)/b.social.duration,e=Math.sin(t*Math.PI)**2,a=t*TAU+b.social.phase;shape.x+=Math.cos(a)*18*e*b.social.side;shape.y+=Math.sin(a)*13*e*b.social.side;}return {x:mix(free.x,shape.x,amount),y:mix(free.y,shape.y,amount)};}return free;}
function create(){birds=Array.from({length:count},(_,index)=>{const q=Math.random(),u=q+.075*Math.sin(q*TAU)+.18,profile=Math.random(),role=profile<.12?'tail':profile<.24?'front':'body',baseSpeed=role==='tail'?3+Math.random():role==='front'?6.5+Math.random()*1.5:4.5+Math.random()*2,isOutlier=Math.random()<.045,depthClass=Math.random(),baseZ=depthClass<.75?280+Math.random()*220:depthClass<.95?130+Math.random()*150:35+Math.random()*95;const b={index,u,role,baseSpeed,speed:baseSpeed,targetSpeed:baseSpeed,baseZ,z:baseZ,targetZ:baseZ,bank:0,isOutlier,seed:Math.random()*TAU,band:isOutlier?(Math.random()<.5?-1:1)*(.65+Math.random()*.35):Math.random()<.38?Math.random()*2-1:(Math.random()+Math.random()-1)*1.05,x:0,y:0,vx:0,vy:0,size:1+Math.random()*.5,phase:Math.random()*TAU,angle:0,alpha:.25+Math.random()*.4};const p=flowPoint(b,u,sceneAmount),a=along(u);b.x=p.x;b.y=p.y;b.angle=Math.atan2(-a.nx,a.ny);b.vx=Math.cos(b.angle)*b.speed*60;b.vy=Math.sin(b.angle)*b.speed*60;return b;});}
function trigger(force=false,review=false){if(!force&&(reduced||formation||clock-lastTrigger<11||Math.abs(scrollY-scrollMark)<270))return;formation={id:clock+Math.random()*.001,kind:nextMotif,side:nextMotif%2?'left':'right',start:clock,hold:30,length:1};const contour=Array.from({length:129},(_,i)=>shapePoint({band:0,index:formation.kind===3?i:1},i/128));for(let i=1;i<contour.length;i++)formation.length+=Math.hypot(contour[i].x-contour[i-1].x,contour[i].y-contour[i-1].y);if(formation.kind===3)formation.length=360/FOCUS_SCALE;
const ranked=birds.map(b=>{let distance=Infinity,phase=0;for(let i=0;i<contour.length;i+=4){const d=(contour[i].x-b.x)**2+(contour[i].y-b.y)**2;if(d<distance){distance=d;phase=i/128;}}return {b,phase,distance:distance+(b.isOutlier?8000:0)};}).sort((a,b)=>a.distance-b.distance).slice(0,Math.round(count*.65)).sort((a,b)=>a.phase-b.phase);ranked.forEach(({b},i)=>{b.shapeId=formation.id;b.shapeU=i/ranked.length;b.shapeReleased=false;b.trackError=0;b.social=null;let length=0,previous=shapePoint(b,0);for(let j=1;j<=48;j++){const p=shapePoint(b,j/48);length+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}b.shapeLength=Math.max(35,length);});
for(let i=0;i<12&&ranked.length>30;i++){const j=Math.floor(Math.random()*(ranked.length-2)),start=clock+9+Math.random()*16,duration=4+Math.random()*3,phase=Math.random()*TAU;ranked[j].b.social={start,duration,phase,side:1};ranked[j+1].b.social={start,duration,phase,side:-1};}
nextMotif=(nextMotif+1)%names.length;lastTrigger=clock;nextAuto=clock+44;scrollMark=scrollY;markMotif(formation.kind);sceneLabel.textContent=names[formation.kind]+' · 聚拢';status.textContent='鸟群逐渐汇成'+names[formation.kind]+'，停留约半分钟后再迁徙。';if(reduced){sceneAmount=1;for(const b of birds){const p=flowPoint(b,b.u,1);b.x=p.x;b.y=p.y;}draw();}}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);spaces();for(const b of birds){const p=flowPoint(b,b.u,0);b.x=p.x;b.y=p.y;}draw();}
function step(dt){clock+=dt;const amount=sceneAmount=envelope();if(!formation&&clock>=nextAuto){nextMotif=autoRound%7===6?poeticOrder[Math.floor(autoRound/7)%poeticOrder.length]:naturalOrder[(autoRound-Math.floor(autoRound/7))%naturalOrder.length];autoRound++;trigger(true);}if(formation){const age=clock-formation.start,label=names[formation.kind]+' · '+(age<3?'聚拢':age<3+formation.hold?'停留':'舒展'),node=sceneLabel;if(node.textContent!==label)node.textContent=label;}routeLength=baseLength/FOCUS_SCALE;const cell=INTERACTION_RADIUS,grid=new Map();wind.energy*=Math.exp(-dt*3);mouse.weight+=(wind.energy-mouse.weight)*(1-Math.exp(-dt*5));wind.samples=wind.samples.filter(n=>clock-n.born<2.5);wind.pulses=wind.pulses.filter(n=>clock-n.born<3.2);scrollParallax*=Math.exp(-dt*2.5);
if(clock>=nextWander){const candidates=birds.filter(b=>{const p=project(b);return b.isOutlier&&!b.wander&&p.y>H*.18&&p.y<H*.8&&(p.x<articleBounds.left-30||p.x>articleBounds.right+30);}),number=Math.min(14,candidates.length,Math.max(0,36-birds.filter(b=>b.wander).length));for(let i=0;i<number;i++){const j=Math.floor(Math.random()*candidates.length),b=candidates.splice(j,1)[0];b.wander={start:clock,duration:7+Math.random()*3,burst:Math.random()<.08};}nextWander=clock+6;}
for(const b of birds){const key=Math.floor(b.x/cell)+','+Math.floor(b.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(b);}
for(const b of birds){const selected=formation&&b.shapeId===formation.id,morph=selected?amount:0,natural=selected&&naturalOrder.includes(formation.kind),air=airAt(b),age=formation?clock-formation.start:0,resting=selected&&age>6&&age<3+formation.hold,restAmount=resting?smooth((age-6)/4):0,social=b.social&&clock>b.social.start&&clock<b.social.start+b.social.duration;b.morph=morph;b.airPower=(b.airPower||0)+(air.power-(b.airPower||0))*(1-Math.exp(-dt*3));const current=Math.sin(b.u*TAU*2+clock*.3+b.seed*.15)*.28,peripheral=Math.abs(b.band)*.22-.12,freeSpeed=clamp(b.baseSpeed+(speed-6)*.5+current+peripheral,3,8),restSpeed=natural?(b.role==='tail'?2.5:3.1+b.seed/TAU*.9):(b.index%8===0?.55:1.1+b.seed/TAU*.65),shapeSpeed=mix(3.6+(b.seed/TAU)*1.8,restSpeed,restAmount);let desired=mix(freeSpeed,social?3.2:shapeSpeed,morph)+air.boost;
const anchor=flockAnchor(),focusSmoothing=1-Math.exp(-dt*2);b.focusX=(b.focusX??W*.5)+(mix(W*.5,anchor.x,morph)-(b.focusX??W*.5))*focusSmoothing;b.focusY=(b.focusY??H*.5)+(mix(H*.5,anchor.y,morph)-(b.focusY??H*.5))*focusSmoothing;
if(selected&&clock-formation.start>3+formation.hold){if(!b.shapeReleased){b.u=nearestFreePhase(b);b.shapeReleased=true;}if(b.role==='front'||b.isOutlier)desired=mix(desired,6.5+b.seed/TAU*1.5,1-morph);}
if(b.wander){const age=clock-b.wander.start;if(b.wander.burst&&age>1&&age<1.9)desired=8.5;else desired+=Math.sin(age*.8)*.45;}
b.targetSpeed=clamp(desired,resting?.5:3,b.wander?.burst?9:8);b.speed+=(b.targetSpeed-b.speed)*(1-Math.exp(-dt*1.7));const advance=b.speed*60/routeLength,catchUp=clamp(1-(b.trackError||0)/130,.2,1);b.u+=dt*advance*catchUp;if(selected)b.shapeU+=dt*b.speed*60/(b.shapeLength||formation.length)*catchUp;const p=flowPoint(b,b.u,morph),p2=flowPoint(b,b.u+.0005,morph,.0005),dxFlow=p2.x-p.x,dyFlow=p2.y-p.y,length=Math.hypot(dxFlow,dyFlow)||1,travel=b.speed*60,targetStrength=(2.1+morph*9.9)*(1-air.power*.35);b.trackError=Math.hypot(p.x-b.x,p.y-b.y);let steerX=dxFlow/length*travel+(p.x-b.x)*targetStrength+air.x,steerY=dyFlow/length*travel+(p.y-b.y)*targetStrength+air.y,vx=0,vy=0,cx=0,cy=0,sx=0,sy=0,n=0,seen=0;const gx=Math.floor(b.x/cell),gy=Math.floor(b.y/cell);
neighbors:for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const bucket=grid.get((gx+ix)+','+(gy+iy));if(!bucket)continue;const stride=Math.max(1,Math.floor(bucket.length/12));for(let j=b.index%stride;j<bucket.length;j+=stride){const o=bucket[j];if(o===b)continue;if(++seen>48)break neighbors;const dx=b.x-o.x,dy=b.y-o.y,d2=dx*dx+dy*dy;if(d2<INTERACTION_RADIUS**2&&d2>.05){const coflow=(dxFlow/length*o.vx+dyFlow/length*o.vy)/(o.speed*60||1);if(coflow>.2&&Math.abs(b.z-o.z)<180){vx+=o.vx;vy+=o.vy;cx+=o.x;cy+=o.y;n++;}if(d2<36){const d=Math.sqrt(d2);sx+=dx/d*(6-d)*13;sy+=dy/d*(6-d)*13;}}}}if(n){const alignment=b.isOutlier?.23:.7;steerX+=(vx/n-b.vx)*alignment+(cx/n-b.x)*.1;steerY+=(vy/n-b.vy)*alignment+(cy/n-b.y)*.1;}steerX+=sx;steerY+=sy;
const disturbance=Math.sin(clock*.55+b.seed)*NOISE*(b.isOutlier?.04:.012),target=Math.atan2(steerY,steerX)+disturbance;let delta=target-b.angle;while(delta>Math.PI)delta-=TAU;while(delta<-Math.PI)delta+=TAU;const turnLimit=mix(3,natural?1.8:3,morph),turn=clamp(delta*(1-Math.exp(-dt*4)),-dt*turnLimit,dt*turnLimit);b.nextAngle=b.angle+turn;b.bank+=(clamp(turn/(dt||1)*.13,-.38,.38)-b.bank)*(1-Math.exp(-dt*2.5));const depthWave=Math.sin(b.u*TAU*1.2+clock*.12+b.seed*.2)*24,shapeDepth=b.baseZ+Math.sin((b.shapeU||b.u)*TAU+clock*.07)*65+b.band*30;b.targetZ=clamp(mix(b.baseZ+depthWave,shapeDepth,morph)-b.bank*22+air.depth,25,600);b.z+=(b.targetZ-b.z)*(1-Math.exp(-dt*.65));b.nvx=Math.cos(b.nextAngle)*travel;b.nvy=Math.sin(b.nextAngle)*travel;}
for(const b of birds){b.vx=b.nvx;b.vy=b.nvy;b.angle=b.nextAngle;b.x+=b.vx*dt;b.y+=b.vy*dt;b.phase+=dt*(4+b.size)*(b.speed/6);}
}
function draw(){ctx.clearRect(0,0,W,H);ctx.lineCap='round';ctx.lineJoin='round';const ordered=birds.slice().sort((a,b)=>b.z-a.z||a.index-b.index);
for(const b of ordered){const p=project(b);if(p.x<-18||p.x>W+18||p.y<-18||p.y>H+18)continue;let clearance=1;for(const r of protectedRects){const dx=Math.max(r.left-p.x,0,p.x-r.right),dy=Math.max(r.top-p.y,0,p.y-r.bottom);clearance=Math.min(clearance,smooth(Math.hypot(dx,dy)/12));}if(clearance<.02)continue;const ink=clamp(b.airPower||0,0,.85),emphasis=mix(1,1.4,b.morph||0),foreground=smooth((150-b.z)/125),alpha=clamp(mix(b.alpha*(.34+p.near*.55)*emphasis+foreground*.2,.87,ink),.08,.9)*clearance,s=b.size*(W<820?.85:1)*Math.pow(p.scale/FOCUS_SCALE,1.3)*(1+foreground*.85),wing=1.7+(reduced?.2:Math.sin(b.phase))*.5,c=Math.cos(b.angle),sn=Math.sin(b.angle),body=s*(1-Math.abs(b.bank)*.18),px=(a,z)=>p.x+a*c-z*sn,py=(a,z)=>p.y+a*sn+z*c;
ctx.globalAlpha=alpha;const shade=Math.round(mix(18,135,clamp(b.z/600,0,1))*(1-ink*.55));const color=dark?255-shade:shade;ctx.strokeStyle=ctx.fillStyle='rgb('+color+','+color+','+color+')';ctx.lineWidth=.45+p.near*.32+foreground*.16;ctx.beginPath();ctx.moveTo(px(-body*.7,-s*wing*(1+b.bank*.5)),py(-body*.7,-s*wing*(1+b.bank*.5)));ctx.quadraticCurveTo(px(body*.05,-s*.55),py(body*.05,-s*.55),px(body*.9,0),py(body*.9,0));ctx.quadraticCurveTo(px(body*.05,s*.55),py(body*.05,s*.55),px(-body*.7,s*wing*(1-b.bank*.5)),py(-body*.7,s*wing*(1-b.bank*.5)));ctx.stroke();ctx.beginPath();ctx.moveTo(px(body*1.15,0),py(body*1.15,0));ctx.lineTo(px(-body*.65,-s*.24),py(-body*.65,-s*.24));ctx.lineTo(px(-body*1.1,0),py(-body*1.1,0));ctx.lineTo(px(-body*.65,s*.24),py(-body*.65,s*.24));ctx.closePath();ctx.fill();}ctx.globalAlpha=1;}
function frame(now){if(hidden||!active)return;if(fullyCovered){last=now;ctx.clearRect(0,0,W,H);raf=requestAnimationFrame(frame);return;}const raw=last?Math.max(0,(now-last)/1000):1/60,elapsed=Math.min(raw,2);last=now;if(!reduced){const steps=Math.min(12,Math.max(1,Math.ceil(elapsed/.04)));for(let i=0;i<steps;i++)step(elapsed/steps);clock+=Math.max(0,raw-elapsed);}draw();canvas.dataset.count=String(count);setState();if(!reduced)raf=requestAnimationFrame(frame);}
function trackPointer(e){if(!active)return;const now=performance.now()/1000,previousX=mouse.x,previousY=mouse.y,dt=now-wind.lastTime;mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=e.pointerType!=='touch';if(mouse.active&&dt>0&&dt<.25&&previousX>-900){const dx=mouse.x-previousX,dy=mouse.y-previousY,d=Math.hypot(dx,dy),velocity=Math.min(2200,d/Math.max(.012,dt));if(d>.4){const ux=dx/d,uy=dy/d,oldSpeed=Math.hypot(wind.vx,wind.vy),curl=oldSpeed>10?clamp((wind.vx*uy-wind.vy*ux)/oldSpeed*3,-1,1):0,acceleration=Math.abs(velocity-oldSpeed)/Math.max(.012,dt),power=clamp(velocity/1200+acceleration/24000,.03,1);wind.energy=Math.max(wind.energy,power);wind.vx=mix(wind.vx,ux*velocity,.35);wind.vy=mix(wind.vy,uy*velocity,.35);if(now-wind.lastSample>.04){wind.samples.push({x:mouse.x,y:mouse.y,dx:ux,dy:uy,power,curl,born:clock});if(wind.samples.length>28)wind.samples.shift();wind.lastSample=now;}}}else{wind.vx=wind.vy=0;}wind.lastTime=now;}

function pause(){active=false;cancelAnimationFrame(raf);raf=0;last=0;clearTimeout(scrollTimer);clearTimeout(resizeTimer);}
function refresh(){
  pause();dark=document.documentElement.dataset.theme==='dark';
  if(disabled()){canvas.hidden=true;ctx.clearRect(0,0,W,H);return;}
  canvas.hidden=false;count=innerWidth<600?500:innerWidth<1000?900:1400;
  formation=null;sceneAmount=0;clock=0;nextAuto=3;autoRound=0;wind.samples=[];wind.pulses=[];wind.energy=0;
  resize();create();active=true;hidden=document.hidden;if(!hidden)raf=requestAnimationFrame(frame);
}
document.addEventListener('pointermove',trackPointer,{passive:true});
document.addEventListener('pointerdown',e=>{
  if(!active||e.pointerType==='touch'||e.target.closest('a,button,input,select,textarea,summary,[role="button"]'))return;
  if(protectedRects.some(r=>e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))return;
  wind.pulses.push({x:e.clientX,y:e.clientY,born:clock});if(wind.pulses.length>5)wind.pulses.shift();
},{passive:true});
document.addEventListener('pointerleave',()=>mouse.active=false);
// Reuse the About page's existing background pause control.
document.addEventListener('click',e=>{if(e.target.closest('[data-spiral-toggle]'))refresh();});
addEventListener('scroll',()=>{
  if(!active)return;scrollParallax=clamp(scrollParallax+(scrollY-lastScroll)*.012,-4,4);lastScroll=scrollY;
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{spaces();trigger();},80);
},{passive:true});
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(refresh,150);});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;cancelAnimationFrame(raf);raf=0;last=0;if(active&&!hidden)raf=requestAnimationFrame(frame);});
document.addEventListener('pjax:send',pause);
document.addEventListener('pjax:complete',refresh);
addEventListener('pageshow',refresh);
motion.addEventListener('change',refresh);
document.addEventListener('toggle',()=>{if(active)spaces();},true);
document.addEventListener('load',e=>{if(active&&e.target.tagName==='IMG')spaces();},true);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(active)spaces();}).observe(document.body);
new MutationObserver(()=>{dark=document.documentElement.dataset.theme==='dark';}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
window.__moyuanInkBirds={refresh,pause};
refresh();

})();
