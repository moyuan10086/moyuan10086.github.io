(() => {
  if(window.moyuanOriginReady)return;
  window.moyuanOriginReady=true;
  const close=()=>document.querySelectorAll('[data-origin-note].is-open').forEach(note=>{
    note.classList.remove('is-open');note.querySelector('.origin-trigger').setAttribute('aria-expanded','false');
    const panel=note.querySelector('.origin-panel');if(panel)panel.hidden=true;
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('.origin-trigger');
    if(!button){if(!event.target.closest('.origin-panel'))close();return;}
    const note=button.closest('[data-origin-note]'),opening=!note.classList.contains('is-open');
    close();note.classList.toggle('is-open',opening);button.setAttribute('aria-expanded',String(opening));
    const panel=note.querySelector('.origin-panel');if(panel)panel.hidden=!opening;
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const note=document.querySelector('[data-origin-note].is-open');if(note?.contains(document.activeElement))note.querySelector('.origin-trigger').focus();close();}});
  document.addEventListener('pjax:complete',close);
})();
