import { narrativeState, narrativeCopy, judgmentPoint, treeGrowth } from './narrative-state.js';

const clamp = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ink = '#393833', gold = '#a38a60', paper = '#f4f3ef';
const assets = ['03-structure-v2.png', '04-tree-reference.png', '05-judgment-gate-v2.png'];
// Positions refer to the generated artwork, not to the viewport. Resize uses
// the same transform for image, live motion and HTML labels.
const skillAnchors = [[.265,.22],[.23,.39],[.52,.12],[.70,.15],[.77,.47],[.86,.27]];
// Each reveal follows a real branch in the reference artwork, root to tip.
const trunkPath = [[.48,.77],[.445,.68],[.48,.59],[.51,.51],[.52,.43],[.53,.36]];
const branchPaths = [
  [[.51,.52],[.49,.42],[.44,.33],[.36,.26],[.265,.22],[.235,.12]],
  [[.51,.51],[.47,.39],[.40,.33],[.32,.36],[.23,.34],[.205,.29]],
  [[.52,.43],[.555,.33],[.53,.25],[.505,.19],[.49,.13],[.51,.075]],
  [[.54,.44],[.565,.32],[.575,.25],[.63,.21],[.70,.15],[.75,.075]],
  [[.49,.55],[.60,.44],[.66,.40],[.72,.43],[.78,.47],[.84,.50]],
  [[.51,.51],[.61,.42],[.71,.35],[.78,.33],[.86,.27],[.905,.20]]
];
const outcomeAnchors = [[.90,.255],[.555,.46],[.588,.77]];
const centers = [[.62,.36],[.77,.51],[.91,.38],[.48,.40]];
const graphNodes = [[.535,.345],[.585,.455],[.645,.583],[.708,.448],[.83,.458],[.87,.378],[.78,.32]];
const graphEdges = [[0,1],[1,2],[1,3],[3,4],[4,5]];
let seed = 9173;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.0001, random()))) * Math.cos(2 * Math.PI * random());

export function mountNarrative(root, getProgress, getLanguage) {
  const host = root.querySelector('.my-narrative');
  if (!host) return { dispose() {} };
  const canvas = host.querySelector('canvas'), ctx = canvas.getContext('2d');
  const sceneCanvas = document.createElement('canvas'), scene = sceneCanvas.getContext('2d');
  const maskCanvas = document.createElement('canvas'), mask = maskCanvas.getContext('2d');
  const treeCache=document.createElement('canvas'),treeCacheContext=treeCache.getContext('2d');
  treeCache.width=1600;treeCache.height=900;let treeCacheKey='';
  const treeLabels = [...host.querySelectorAll('[data-tree-label]')], gateLabels = [...host.querySelectorAll('[data-gate-label]')];
  const phases = [...host.querySelectorAll('.my-structure-phases > span')], note = host.querySelector('.my-tree-note');
  const treeMist = host.querySelector('.my-tree-mist');
  const images = assets.map(name => { const img = new Image(); img.src = '/intro-assets/' + name; return img; });
  let w = 0, h = 0, dpr = 1, rect, frame = 0, disposed = false, previous = '', last = 0;
  const grains = Array.from({ length: 1050 }, (_, i) => {
    const center = centers[i % centers.length], t = random();
    return { source: [.13 + t * .28, .09 + t * .39 + (random()-.5)*Math.sin(t*Math.PI)*.15],
      loose: [center[0]+gaussian()*.077, center[1]+gaussian()*.080],
      cluster: [center[0] + gaussian() * .039, center[1] + gaussian() * .047],
      tree: [.50 + gaussian() * .016, .18 + t * .59],
      phase: random() * Math.PI * 2, radius: .35 + random() * .68, alpha: .12 + random() * .37, gold: i % 19 === 0 };
  });
  function resize() {
    w = host.clientWidth; h = host.clientHeight; dpr = Math.min(devicePixelRatio || 1, 1.7);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    // A phone gets a complete, slightly enlarged composition above its copy.
    const width = w < 701 ? w * 1.08 : w;
    const height = width * 9 / 16;
    rect = { x: (w - width) / 2, y: w < 701 ? h * .19 : Math.max(0, (h - height) * .18), w: width, h: height };
    for (const c of [sceneCanvas, maskCanvas]) { c.width = 1600; c.height = 900; }
    previous = '';
  }
  const point = a => [rect.x + rect.w * a[0], rect.y + rect.h * a[1]];
  function position(el, xy) { const [x, y] = point(xy), margin = el.offsetWidth / 2 + 12; el.style.left = Math.max(margin,Math.min(w-margin,x)) + 'px'; el.style.top = y + 'px'; }
  function labels(s, language) {
    const c = narrativeCopy[language], key = [language, s.layers[1].toFixed(3), s.layers[2].toFixed(3), s.growth.toFixed(3), s.treeDetails.toFixed(3), s.decision.toFixed(3), s.phase, w, h].join('|');
    if (key === previous) return; previous = key;
    host.setAttribute('aria-label', language === 'en' ? 'Structure, growth and judgment' : '结构、生长与判断');
    const growth = treeGrowth(s.growth);
    treeLabels.forEach((el, i) => { el.querySelector('[data-label-copy]').textContent = c.skills[i]; position(el, skillAnchors[i]); const a = s.layers[1] * growth.labels[i] * s.treeDetails; el.style.opacity = a; el.setAttribute('aria-hidden', String(a < .3)); });
    gateLabels.forEach((el, i) => { el.querySelector('[data-label-copy]').textContent = c.outcomes[i]; position(el, outcomeAnchors[i]); const a = s.layers[2] * smooth(.12, .7, s.decision); el.style.opacity = a; el.setAttribute('aria-hidden', String(a < .3)); });
    const noteAlpha = s.layers[1] * smooth(.6,.9,s.growth) * s.treeDetails;
    note.textContent = c.note; note.style.opacity = noteAlpha; note.setAttribute('aria-hidden', String(noteAlpha < .3));
    treeMist.style.opacity = s.layers[1] * .38;
    treeMist.style.setProperty('--mist-rise', (8 * (1-s.growth)) + 'px');
    phases.forEach((el, i) => { el.querySelector('[data-label-copy]').textContent = c.phases[i]; el.classList.toggle('is-current', s.phase === i); });
    host.querySelector('.my-structure-phases').style.opacity = s.layers[0] * smooth(.02, .1, s.structure);
  }
  function line(points, width, color, alpha) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach((p, i) => { const xy = point(p); if (i) ctx.lineTo(...xy); else ctx.moveTo(...xy); }); ctx.stroke();
  }
  function dot(xy, radius, color, alpha) {
    ctx.globalAlpha = clamp(alpha); ctx.fillStyle = color; ctx.beginPath();ctx.arc(...point(xy), radius, 0, Math.PI * 2);ctx.fill();
  }
  function imageLayer(index, alpha, paintMask, cacheKey) {
    const img = images[index]; if (alpha < .002 || !img.complete || !img.naturalWidth) return;
    if(index===1&&cacheKey===treeCacheKey){
      ctx.globalAlpha=alpha;ctx.globalCompositeOperation='multiply';ctx.drawImage(treeCache,rect.x,rect.y,rect.w,rect.h);ctx.globalCompositeOperation='source-over';return;
    }
    scene.globalCompositeOperation = 'source-over'; scene.globalAlpha = 1; scene.clearRect(0,0,1600,900);
    scene.drawImage(img,0,0,1600,900);
    mask.globalCompositeOperation = 'source-over'; mask.clearRect(0,0,1600,900); mask.fillStyle = '#fff'; mask.globalAlpha = 1;
    paintMask(mask);
    // Fade page edges and the empty title zone into the actual warm paper.
    mask.globalCompositeOperation = 'destination-in';
    const edge = mask.createLinearGradient(0,0,0,900); edge.addColorStop(0,'transparent');edge.addColorStop(.1,'white');edge.addColorStop(.65,'white');edge.addColorStop(.9,'transparent');
    mask.fillStyle=edge;mask.fillRect(0,0,1600,900);
    scene.globalCompositeOperation = 'destination-in';scene.filter='blur(22px)';scene.drawImage(maskCanvas,0,0);scene.filter='none';
    if(index===0){
      // A pocket of clear paper protects the existing brand/navigation.
      scene.globalCompositeOperation='destination-out';
      const quiet=scene.createRadialGradient(110,45,80,110,45,205);quiet.addColorStop(0,'white');quiet.addColorStop(1,'transparent');
      scene.fillStyle=quiet;scene.fillRect(0,0,360,260);
    }
    if(index===1){treeCacheContext.clearRect(0,0,1600,900);treeCacheContext.drawImage(sceneCanvas,0,0);treeCacheKey=cacheKey;}
    ctx.globalAlpha=alpha;ctx.globalCompositeOperation=index===1?'multiply':'source-over';ctx.drawImage(sceneCanvas,rect.x,rect.y,rect.w,rect.h);ctx.globalCompositeOperation='source-over';
  }
  function structure(s, time) {
    const a = s.layers[0];
    imageLayer(0, a, m => {
      // Preserve the single feather; the trailing fibers open into data.
      const end = lerp(.365,.99,s.dissolve), g = m.createLinearGradient((end-.13)*1600,0,end*1600,0);
      g.addColorStop(0,'white');g.addColorStop(1,'transparent');m.fillStyle=g;m.fillRect(0,0,1600,900);
      // The departing grains open small gaps in the trailing feather fibers.
      // This changes the feather itself, rather than merely panning a poster.
      m.globalCompositeOperation='destination-out';
      grains.slice(0,65).forEach(grain=>{
        if(grain.source[0]<.29)return;
        const x=grain.source[0]*1600,y=grain.source[1]*900,r=(9+grain.radius*14)*s.dissolve;
        if(r<.1)return;
        const hole=m.createRadialGradient(x,y,0,x,y,r);hole.addColorStop(0,'rgba(0,0,0,.8)');hole.addColorStop(1,'transparent');m.fillStyle=hole;m.fillRect(x-r,y-r,r*2,r*2);
      });
      m.globalCompositeOperation='source-over';
    });
    if (s.graph > 0) {
      graphEdges.forEach(([i,j]) => line([graphNodes[i],graphNodes[j]],.6,gold,a*s.graph*.28));
      graphNodes.forEach((p,i) => dot(p, i===0?2.3:1.6, i%3===0?gold:ink,a*s.graph*.55));
    }
    if (s.dissolve < .005 && s.toTree < .005) return;
    const transfer = smooth(.2,1,s.toTree), motion = smooth(.0,.65,s.dissolve);
    grains.forEach(g => {
      let x = lerp(g.source[0],lerp(g.loose[0],g.cluster[0],s.cluster),motion);
      let y = lerp(g.source[1],lerp(g.loose[1],g.cluster[1],s.cluster),motion);
      x=lerp(x,g.tree[0],transfer);y=lerp(y,g.tree[1],transfer);
      x+=Math.sin(time*.22+g.phase)*.002;y+=Math.cos(time*.17+g.phase)*.0015;
      dot([x,y],g.radius*(w<701?.6:1),g.gold?gold:ink,g.alpha*s.dissolve*(1-s.toGate)*(1-transfer*.5)*(1-smooth(.08,.42,s.growth)));
    });
  }
  function tree(s, time) {
    const a=s.layers[1] * (1-smooth(.12,.85,s.toGate)); if(a<.002)return;
    const growth=treeGrowth(s.growth);
    imageLayer(1,a,m=>{
      if(growth.finish===1){m.fillStyle='white';m.fillRect(0,0,1600,900);return;}
      const wash=(x,y,rx,ry,alpha)=>{
        m.save();m.translate(x*1600,y*900);m.scale(rx*1600,ry*900);
        const g=m.createRadialGradient(0,0,.15,0,0,1);g.addColorStop(0,'white');g.addColorStop(.5,'rgba(255,255,255,.85)');g.addColorStop(1,'transparent');
        m.globalAlpha=alpha;m.fillStyle=g;m.fillRect(-1,-1,2,2);m.restore();
      };
      // Distant ridges and fallen twigs establish the ground before growth.
      wash(.06,.54,.33,.18,.20);wash(.94,.54,.33,.18,.20);
      wash(.48,.76,.54,.14,.60);wash(.84,.80,.20,.10,.48);
      const trace=(points,progress,radius)=>{
        const samples=60;
        for(let i=0;i<=samples;i++){
          const t=i/samples;if(t>progress)break;
          const location=t*(points.length-1),segment=Math.min(points.length-2,Math.floor(location)),local=location-segment;
          const x=lerp(points[segment][0],points[segment+1][0],local),y=lerp(points[segment][1],points[segment+1][1],local);
          const taper=lerp(1,.48,t),front=smooth(0,.09,progress-t);
          wash(x,y,radius*taper,radius*taper*1.7,front*.72);
        }
      };
      trace(trunkPath,growth.trunk,.095);
      branchPaths.forEach((path,i)=>trace(path,growth.branches[i],.065));
      // The final wash brings the fine leaves into focus, not a page-wide wipe.
      m.globalAlpha=growth.finish;m.fillStyle='white';m.fillRect(0,0,1600,900);m.globalAlpha=1;
    },s.growth.toFixed(4));
    // The reference provides the actual fallen branches and seedlings.
    skillAnchors.forEach((p,i)=>{
      for(let j=0;j<9;j++){
        const t=(j/9+time*.012)%1, x=p[0]-.018+Math.sin(j*19+i)*.009, y=p[1]+.023-t*.024;
        dot([x,y],.6,j%4===0?gold:ink,a*growth.branches[i]*Math.sin(t*Math.PI)*.18);
      }
    });
    // On leaving the tree, the same three branches extend into evidence lanes.
    if(s.toGate>.02)for(let lane=0;lane<3;lane++){
      const pts=Array.from({length:40},(_,i)=>{
        const t=i/39, p=judgmentPoint(lane,t*.57);
        return [lerp(.50,p.x,s.toGate),lerp(.73-t*.30,p.y,s.toGate)];
      });line(pts,.8,lane===0?gold:ink,a*s.toGate*.42);
    }
  }
  function gate(s,time){
    const a=s.layers[2]*smooth(.25,.9,s.toGate);if(a<.002)return;
    imageLayer(2,a,m=>{
      // Keep the vertical threshold legible while the evidence approaches it.
      m.fillRect(992,20,67,690);
      const reach=lerp(.03,.622,s.arrival);
      const g=m.createLinearGradient((reach-.055)*1600,0,reach*1600,0);
      g.addColorStop(0,'white');g.addColorStop(1,'transparent');m.fillStyle=g;m.fillRect(0,110,reach*1600,530);
      // The upper result extends beyond the gate. No such reveal is allowed
      // on the review or blocked lanes.
      const exit=lerp(.625,1,s.decision);
      m.fillStyle='white';m.globalAlpha=s.decision;m.fillRect(990,125,(exit-.618)*1600,125);
      m.globalAlpha=1;
    });
    for(let lane=0;lane<3;lane++){
      const color=[gold,'#777770','#886354'][lane];
      const reach=s.arrival*.57+s.decision*.43;
      // Fine dashed tails and dust read as ink moving, not a large glowing orb.
      for(let j=0;j<42;j++){
        const u=clamp(reach-j*.003), p=judgmentPoint(lane,u);
        dot([p.x,p.y],j===0?1.7:.45+(j%3)*.13,color,a*p.alpha*(1-j/44)*.60);
      }
      for(let j=0;j<52;j++){
        const cycle=(j/52+time*(lane===1?.038:.065))%1;
        const p=judgmentPoint(lane,Math.min(reach,cycle));
        if(cycle>reach)continue;
        const jitter=Math.sin(j*71+time*.5)*.004;
        dot([p.x,p.y+jitter],.35+(j%5)*.13,color,a*p.alpha*.40);
      }
    }
  }
  function render(now){
    if(disposed)return;frame=requestAnimationFrame(render);
    if(document.hidden||now-last<32)return;last=now;
    const p=getProgress(),s=narrativeState(p);
    host.style.visibility=s.active?'visible':'hidden';host.style.opacity=String(s.opacity);host.setAttribute('aria-hidden',String(!s.active||s.opacity<.3));
    if(!s.active)return;
    if(w<701){
      const width=w*lerp(lerp(1.08,1.35,s.toTree),1.08,s.toGate);
      rect={x:lerp((w-width)/2,w*.5-width*.50,s.layers[1]),y:h*lerp(.22,.25,s.toTree),w:width,h:width*9/16};
    }
    labels(s,getLanguage());ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=paper;ctx.fillRect(0,0,w,h);
    ctx.lineCap='round';ctx.lineJoin='round';
    const time=now/1000;
    structure(s,time);tree(s,time);gate(s,time);ctx.globalAlpha=1;
    host.dataset.chapter=p<.49?'structure':p<.57?'tree':'judgment';host.dataset.local=(p<.49?s.structure:p<.57?s.tree:s.gate).toFixed(3);
    host.dataset.images=String(images.filter(i=>i.complete&&i.naturalWidth).length);
  }
  const observer=new ResizeObserver(resize);observer.observe(host);resize();frame=requestAnimationFrame(render);
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();}
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();},{once:true});
  return {dispose};
}
