(() => {
  if(window.moyuanOriginReady)return;
  window.moyuanOriginReady=true;
  const close=()=>document.querySelectorAll('[data-origin-note].is-open').forEach(note=>{
    note.classList.remove('is-open');note.querySelector('.origin-trigger').setAttribute('aria-expanded','false');
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('.origin-trigger');
    if(!button){close();return;}
    const note=button.closest('[data-origin-note]'),opening=!note.classList.contains('is-open');
    close();note.classList.toggle('is-open',opening);button.setAttribute('aria-expanded',String(opening));
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  document.addEventListener('pjax:complete',close);
})();
