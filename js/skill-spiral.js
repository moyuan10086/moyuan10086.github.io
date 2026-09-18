/* Page-wide scroll choreography. No network runtime and no idle JS loop. */
(() => {
  if (window.MoyuanSkillSpiral) { window.MoyuanSkillSpiral.init(); return; }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const instances = new Map();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let frame = 0;
  function schedule() {
    if (!frame && !document.hidden && instances.size) frame = requestAnimationFrame(update);
  }
  function destroy(root, state) {
    state.resize.disconnect(); state.intersection.disconnect(); state.events.abort();
    state.toggle.remove();
    instances.delete(root);
  }
  function control(state) {
    const en = window.MoyuanI18n?.language === 'en';
    state.toggle.setAttribute('aria-pressed', String(state.paused || motion.matches));
    state.toggle.disabled = motion.matches;
    state.toggle.textContent = motion.matches ? (en ? 'Reduced motion' : '已减弱背景动效') : state.paused ? (en ? 'Resume background' : '继续背景动效') : (en ? 'Pause background' : '暂停背景动效');
  }
  function update() {
    frame = 0;
    let unsettled = false;
    const readings = [];
    instances.forEach((s, root) => {
      if (!root.isConnected) { destroy(root, s); return; }
      const rect = s.stage.getBoundingClientRect();
      readings.push({ s, root, rect, visible:rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight });
    });
    for (const { s, root, rect, visible } of readings) {
      const running = visible && !s.paused && !motion.matches;
      root.dataset.running = String(running);
      s.toggle.hidden = !visible;
      if (!visible) continue;
      if (s.dirty) {
        // Recompute actual pixel distances only when the page size changes.
        let length = 0;
        s.points = s.samples.map((p, i) => {
          const x = p.x / 1000 * rect.width, y = p.y / 6000 * rect.height;
          if (i) { const prev = s.samples[i-1]; length += Math.hypot(x - prev.x / 1000 * rect.width, y - prev.y / 6000 * rect.height); }
          return { x, y, distance:length };
        });
        s.length = length;
      }
      const focusY = clamp(-rect.top + innerHeight * .52, 0, rect.height);
      const anchor = s.points.findIndex(p => p.y >= focusY);
      const a = s.points[Math.max(0, anchor-1)], b = s.points[anchor < 0 ? s.points.length-1 : anchor];
      const desired = a.distance + (b.distance-a.distance) * clamp((focusY-a.y)/(b.y-a.y || 1),0,1);
      if (s.distance === null) s.distance = desired;
      const target = running ? desired : s.distance;
      s.distance += (target-s.distance) * .14;
      if (Math.abs(target-s.distance) > .1) unsettled = true;
      const gap = rect.width < 700 ? 48 : 90;
      const halfSpan = (s.cubes.length-1)/2*gap;
      const center = clamp(s.distance, halfSpan, s.length-halfSpan);
      for (let i=0; i<s.cubes.length; i++) {
        const cube = s.cubes[i];
        const distance = center + (i-(s.cubes.length-1)/2)*gap;
        let low=0, high=s.points.length-1;
        while (low < high) { const mid=(low+high)>>1; if(s.points[mid].distance<distance) low=mid+1; else high=mid; }
        const p=s.points[Math.max(0,low-1)], q=s.points[low];
        const blend=(distance-p.distance)/(q.distance-p.distance || 1);
        const x=p.x+(q.x-p.x)*blend, y=p.y+(q.y-p.y)*blend;
        const depth=Math.sin(i*.47+s.distance/650), scale=.65+(depth+1)*.28;
        // Quiet behind the reading column; clearer in the outside margins.
        const edge=clamp((Math.abs(x-rect.width/2)-Math.min(430,rect.width*.32))/120,0,1);
        cube.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px) translate(-50%,-50%) scale('+scale.toFixed(3)+')';
        cube.style.opacity=((.13+edge*.48)*(.7+(depth+1)*.15)).toFixed(3);
        cube.style.zIndex=String(Math.round((depth+1)*10));
        cube.dataset.visible=String(y+rect.top>-100 && y+rect.top<innerHeight+100);
        s.rotations[i].style.transform='rotateX('+(-18+depth*16)+'deg) rotateY('+(30+i*31+s.distance*.08)+'deg) rotateZ('+(-10+depth*16)+'deg)';
      }
      s.dirty=false;
    }
    if (unsettled) schedule();
  }
  function init() {
    instances.forEach((s,r) => { if(!r.isConnected) destroy(r,s); });
    document.querySelectorAll('[data-skill-spiral]').forEach(root => {
      if(instances.has(root))return;
      const stage=root.querySelector('.spiral-stage'), path=root.querySelector('path');
      if(!path?.getTotalLength || !window.ResizeObserver || !window.IntersectionObserver)return;
      const length=path.getTotalLength();
      if(!length)return;
      const s={stage, cubes:[...root.querySelectorAll('[data-spiral-cube]')], rotations:[...root.querySelectorAll('.spiral-cube')], toggle:root.querySelector('[data-spiral-toggle]'), samples:Array.from({length:1201},(_,i)=>path.getPointAtLength(length*i/1200)), distance:null, paused:false, dirty:true, events:new AbortController()};
      s.resize=new ResizeObserver(()=>{s.dirty=true;schedule();});
      s.intersection=new IntersectionObserver(schedule);
      s.resize.observe(stage); s.intersection.observe(stage);
      instances.set(root,s); root.dataset.enhanced='true';
      document.body.append(s.toggle);
      control(s);
      s.toggle.addEventListener('click',()=>{s.paused=!s.paused;control(s);schedule();},{signal:s.events.signal});
    });
    schedule();
  }
  function stop() { cancelAnimationFrame(frame);frame=0;instances.forEach((s,r)=>{r.dataset.running='false';}); }
  window.MoyuanSkillSpiral={init};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('moyuan:language',()=>{instances.forEach(s=>{s.dirty=true;control(s);});schedule();});
  motion.addEventListener('change',()=>{instances.forEach(control);schedule();});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():schedule());
  window.addEventListener('pagehide',stop); window.addEventListener('pageshow',schedule);
  document.addEventListener('pjax:send',()=>{stop();instances.forEach((s,r)=>destroy(r,s));});
  document.addEventListener('pjax:complete',init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
