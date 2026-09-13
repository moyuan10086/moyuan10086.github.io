(() => {
  'use strict';
  if(window.__moyuanLabInstalled)return;
  window.__moyuanLabInstalled=true;
  let dispose=()=>{};
  function init(){
    dispose();
    const hero=document.querySelector('.home-hero-fullscreen');
    if(!hero)return;
    const controller=new AbortController(),{signal}=controller;
    const on=(node,event,fn)=>node.addEventListener(event,fn,{signal});
    const dialog=document.querySelector('#security-terminal'),input=document.querySelector('#shell-input'),output=document.querySelector('#shell-output');
    const open=document.querySelector('#shell-open'),close=document.querySelector('#shell-close'),form=document.querySelector('#shell-form');
    const interact=document.querySelector('#star-interact'),host=hero.querySelector('.starfield');
    const shell=new window.MoyuanSecurityShell();
    const vendors=document.querySelector('.ai-vendors');
    if(vendors){
      if(!vendors.parentElement.classList.contains('vendor-marquee')){const frame=document.createElement('div');frame.className='vendor-marquee';vendors.before(frame);frame.append(vendors);}
      vendors.querySelectorAll('[data-vendor-clone]').forEach(e=>e.remove());
      [...vendors.children].forEach(el=>{const clone=el.cloneNode(true);clone.dataset.vendorClone='true';clone.tabIndex=-1;clone.setAttribute('aria-hidden','true');vendors.append(clone);});
    }
    const viewport=document.querySelector('.ai-character-grid');
    if(viewport&&!viewport.parentElement.classList.contains('ai-marquee')){const frame=document.createElement('div');frame.className='ai-marquee';viewport.before(frame);frame.append(viewport);}
    // Duplicate only the visual track; clones stay out of keyboard/a11y navigation.
    viewport?.querySelectorAll('[data-ai-clone]').forEach(e=>e.remove());
    const originals=viewport?[...viewport.children]:[];
    originals.forEach(el=>{const clone=el.cloneNode(true);clone.dataset.aiClone='true';clone.tabIndex=-1;clone.setAttribute('aria-hidden','true');viewport.append(clone);});
    document.querySelectorAll('.ai-character').forEach(button=>on(button,'click',()=>{
      document.querySelectorAll('.ai-character').forEach(other=>{const selected=other===button;other.classList.toggle('is-selected',selected);other.setAttribute('aria-pressed',String(selected));});
      document.querySelector('#ai-description').textContent=button.querySelector('strong').textContent+' · '+button.dataset.description;
    }));
    const history=[];let cursor=0,stars,idle;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const exitInteraction=()=>{hero.classList.remove('star-interacting');interact.setAttribute('aria-pressed','false');interact.setAttribute('aria-label','探索星场');interact.textContent='✦ 探索星场';host.removeAttribute('tabindex');host.setAttribute('aria-hidden','true');};
    const unavailable=()=>{exitInteraction();interact.hidden=true;};
    on(hero,'starfield-unavailable',unavailable);
    on(interact,'click',()=>{
      if(!stars)return;
      const active=interact.getAttribute('aria-pressed')!=='true';
      if(!active){exitInteraction();return;}
      hero.classList.add('star-interacting');interact.setAttribute('aria-pressed','true');interact.textContent='✕ 退出星场';interact.setAttribute('aria-label','退出星场');
      host.removeAttribute('aria-hidden');host.setAttribute('tabindex','0');host.setAttribute('role','application');host.setAttribute('aria-label','拖拽或用方向键旋转星场，Escape 退出');host.focus();
    });
    on(host,'keydown',e=>{if(e.key==='Escape'){exitInteraction();interact.focus();}});
    on(open,'click',()=>{exitInteraction();dialog.showModal();stars?.pause(true);input.focus();});
    on(close,'click',()=>dialog.close());
    on(dialog,'close',()=>{stars?.pause(false);open.focus();});
    const append=(text,cls)=>{if(!text)return;const pre=document.createElement('pre');pre.className=cls||'';pre.textContent=text;output.append(pre);while(output.children.length>100)output.firstElementChild.remove();};
    on(form,'submit',async e=>{
      e.preventDefault();const command=input.value.trim();if(!command)return;
      append('guest@moyuan '+shell.cwd.replace('/home/guest','~')+' % '+command,'shell-command');
      history.push(command);if(history.length>50)history.shift();cursor=history.length;input.value='';
      const result=shell.run(command);
      if(result.clear)output.replaceChildren();else append(result.output,result.flag?'shell-flag':'');
      if(result.links){
        const links=document.createElement('div');links.className='shell-ai-links';
        result.links.forEach(site=>{const a=document.createElement('a');a.href=site.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=site.name+' ↗';links.append(a);});
        output.append(links);
      }
      if(result.flag)stars?.pulse();
      document.querySelector('#shell-prompt').textContent='guest@moyuan '+shell.cwd.replace('/home/guest','~')+' %';
      if(result.exit)dialog.close();
      if(result.navigate){dialog.close();location.assign(result.navigate);return;}
      input.scrollIntoView({block:'nearest'});input.focus({preventScroll:true});
    });
    on(input,'keydown',e=>{
      if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();cursor=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1)));input.value=history[cursor]||'';}
      if(e.key==='Tab'){const choices=['help','whoami','pwd','ls','ls -a','cd notes','cat flag','cat about.txt','cat projects.txt','clear','open writing','open projects','open music','ai','ai deepseek','ai doubao','ai gemini','ai chatgpt','ai claude','exit'].filter(c=>c.startsWith(input.value));if(choices.length===1){e.preventDefault();input.value=choices[0];}}
      if(e.key==='l'&&e.ctrlKey){e.preventDefault();output.replaceChildren();}
    });
    const start=async()=>{
      if(signal.aborted||reduced.matches)return;
      try{const module=await import('/js/starfield.js');if(signal.aborted||reduced.matches)return;stars=module.mountStarfield(host,hero,signal);interact.disabled=false;}
      catch(_){unavailable();}
    };
    interact.disabled=true;
    if(!reduced.matches)idle=setTimeout(start,350);else unavailable();
    on(reduced,'change',()=>{if(reduced.matches){stars?.dispose();stars=null;host.replaceChildren();unavailable();}else{interact.hidden=false;start();}});
    dispose=()=>{controller.abort();clearTimeout(idle);stars?.dispose();viewport?.querySelectorAll('[data-ai-clone]').forEach(e=>e.remove());vendors?.querySelectorAll('[data-vendor-clone]').forEach(e=>e.remove());if(dialog.open)dialog.close();};
  }
  document.addEventListener('pjax:send',()=>dispose());
  document.addEventListener('pjax:complete',init);
  window.addEventListener('pagehide',()=>dispose());
  window.addEventListener('pageshow',e=>{if(e.persisted)init();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
