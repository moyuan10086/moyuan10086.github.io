(() => {
  if(window.__moyuanPortfolio)return;window.__moyuanPortfolio=true;
  let dispose=()=>{};
  const init=()=>{
    dispose();const root=document.querySelector('.portfolio-shell');if(!root)return;
    const controller=new AbortController(),{signal}=controller;
    const chapters=[...root.querySelectorAll('.pf-chapter')],links=[...root.querySelectorAll('.pf-chapters a')];
    const prev=root.querySelector('.pf-prev'),next=root.querySelector('.pf-forward'),motion=root.querySelector('.pf-motion');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let current=0,scene,paused=reduced.matches;
    const on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
    function update(){
      let closest=Infinity;chapters.forEach((chapter,i)=>{const distance=Math.abs(chapter.getBoundingClientRect().top-64);if(distance<closest){closest=distance;current=i;}});
      links.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
      root.querySelector('.pf-location').textContent=['01 / IDENTITY','02 / SYSTEMS','03 / SECURITY','04 / CONNECT'][current];prev.disabled=current===0;next.disabled=current===3;
    }
    function go(i){chapters[Math.max(0,Math.min(3,i))].scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});}
    links.forEach((a,i)=>on(a,'click',e=>{e.preventDefault();go(i);}));
    on(prev,'click',()=>go(current-1));on(next,'click',()=>go(current+1));
    function motionLabel(){motion.setAttribute('aria-pressed',String(!paused));motion.innerHTML=paused?'<span data-language="zh">开启动效</span><span data-language="en">Enable motion</span>':'<span data-language="zh">暂停动效</span><span data-language="en">Pause motion</span>';scene?.pause(paused);}
    on(motion,'click',()=>{paused=!paused;motionLabel();});on(reduced,'change',()=>{paused=reduced.matches;motionLabel();});
    on(window,'scroll',update);on(window,'resize',update);update();motionLabel();
    import('/js/portfolio-scene.js').then(module=>{if(signal.aborted)return;scene=module.mount(root,signal);scene.pause(paused);}).catch(()=>{root.querySelector('.pf-fallback').textContent='Static view · 3D unavailable';motion.hidden=true;});
    dispose=()=>{controller.abort();scene?.dispose();};
  };
  document.addEventListener('pjax:send',()=>dispose());document.addEventListener('pjax:complete',init);
  window.addEventListener('pagehide',()=>dispose());window.addEventListener('pageshow',e=>{if(e.persisted)init();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
