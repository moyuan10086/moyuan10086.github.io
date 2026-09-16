(() => {
  if (window.moyuanAboutReady) return;
  window.moyuanAboutReady = true;
  function select(button) {
    const explorer = button.closest('[data-skill-explorer]');
    if (!explorer) return;
    explorer.querySelectorAll('[data-skill]').forEach(node => {
      const active = node === button;
      node.setAttribute('aria-expanded', String(active));
      document.getElementById(node.getAttribute('aria-controls')).hidden = !active;
    });
  }
  document.addEventListener('click', e => { const b=e.target.closest('.about-page [data-skill]'); if(b)select(b); });
  document.addEventListener('focusin', e => { const b=e.target.closest('.about-page [data-skill]'); if(b)select(b); });
  document.addEventListener('pointerover', e => {
    if(e.pointerType !== 'mouse')return;
    const b=e.target.closest('.about-page [data-skill]'); if(b)select(b);
  });
  function nameAnchor() {
    if(!document.querySelector('.about-page'))return;
    const name=location.hash.slice(1).replace(/-(zh|en)$/,'');
    if(!name)return;
    const lang=window.MoyuanI18n?.language || 'zh';
    document.getElementById(name+'-'+lang)?.scrollIntoView();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',nameAnchor,{once:true});else nameAnchor();
  window.addEventListener('hashchange',nameAnchor);
  window.addEventListener('moyuan:language',nameAnchor);
  document.addEventListener('pjax:complete',nameAnchor);
})();
