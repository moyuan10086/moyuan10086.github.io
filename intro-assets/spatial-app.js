import {ease,pulse,clamp,copy,stageAt,proseChapterAt,worldProgress,projectAt} from './story-state.js';
import {updateBuild} from './build-motion.js';
import {updateEvidence} from './evidence-motion.js';
const intro=document.querySelector('#intro'),host=document.querySelector('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const q=s=>intro.querySelector(s),portal=q('#my-project-window'),labels=[...intro.querySelectorAll('.my-node-labels button')];
let progress=0,language=window.MoyuanI18n?.language==='en'?'en':'zh';
const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
function prose(el,value){
  if(!el||el.dataset.prose===value)return;
  el.dataset.prose=value;
  el.replaceChildren(...value.split('\n').map(line=>{
    const span=document.createElement('span');span.className='my-prose-line';
    span.textContent=line;return span;
  }));
}
const urls=JSON.parse(portal.dataset.projects);
function read(){
  progress=reduced?1:clamp((scrollY-intro.offsetTop)/Math.max(1,intro.offsetHeight-innerHeight));
  const c=copy[language],stage=stageAt(progress),chapter=proseChapterAt(progress),p=projectAt(progress),project=c.projects[p];
  intro.dataset.chapter=String(chapter);
  intro.dataset.language=language;intro.dataset.stage=String(stage);intro.dataset.progress=progress.toFixed(4);
  updateBuild(intro,progress,language);
  // The old evidence panel is superseded only in Intro 03–05.
  updateEvidence(intro,-1,language);
  text(q('#my-kicker'),c.stages[chapter][0]);
  prose(q('#my-title'),c.stages[chapter][1]);prose(q('#my-copy'),c.stages[chapter][2]);
  text(q('.my-brand-caption'),c.brand);text(q('#my-skip'),c.skip);text(q('#my-replay'),c.replay);text(q('.my-scroll'),progress>.96?'':c.scroll+' ↓');
  text(q('#my-language'),language==='zh'?'EN':'中文');q('#my-language').setAttribute('aria-label',language==='zh'?'Switch to English':'切换为中文');
  ['#my-enter','#my-stars','#my-build'].forEach((s,j)=>text(q(s),c.paths[j]));text(q('#my-terminal'),c.terminal);
  portal.dataset.project=String(p);portal.href=urls[p];
  ['small','strong','.my-project-thesis','.my-project-description'].forEach((s,j)=>text(portal.querySelector(s),project[j]));
  text(portal.querySelector('em'),(language==='zh'?'查看项目':'View project')+' ↗');
  portal.querySelectorAll('.my-project-process li').forEach((el,j)=>text(el,project[4][j]));
  const local=clamp((progress-.84-p*(.07/3))/(.07/3));
  portal.style.setProperty('--step',String(Math.min(3,Math.floor(local*4))));
  portal.querySelectorAll('.my-project-process li').forEach((el,j)=>el.classList.toggle('is-current',j===Math.min(3,Math.floor(local*4))));
  const show=pulse(.84,.855,.905,.92,progress),enabled=show>.8;
  portal.style.opacity=String(show);portal.style.transform='translate(-50%,-50%) perspective(1400px) rotateY('+((1-ease(.65,.68,progress))*-22)+'deg) scale('+(.88+.12*show)+')';
  portal.style.pointerEvents=enabled?'auto':'none';portal.tabIndex=enabled?0:-1;portal.setAttribute('aria-hidden',String(!enabled));
  const w=worldProgress(progress),labelOn=false;
  q('.my-node-labels').style.opacity=labelOn?'1':'0';q('.my-node-labels').setAttribute('aria-hidden',String(!labelOn));
  labels.forEach((el,j)=>{const words=stage===4?c.evidence:stage===5?c.security:c.signal;const current=stage===5?j===2: j===Math.min(4,Math.floor(clamp((progress-(stage===4?.49:.37))/(stage===4?.08:.12))*5));
    const visible=labelOn&&current;el.hidden=!visible;el.tabIndex=visible?0:-1;el.style.pointerEvents=visible?'auto':'none';text(el.querySelector('span'),words[j]||'');text(el.querySelector('small'),stage===5?(language==='zh'?'依据可复核':'A reviewable source'):'');});
  q('#my-risk').hidden=true;
  // Build scenes own their headings; the work chapter has a separate text column.
  const captionOpacity=chapter===9?ease(.84,.85,progress):1-pulse(.65,.675,.921,.94,progress);
  q('.my-caption').style.opacity=String(captionOpacity);
  q('.my-caption').setAttribute('aria-hidden',String(captionOpacity<.1));
  const closing=reduced?1:ease(.93,.963,progress);q('.my-exits').style.opacity=String(closing);q('.my-exits').style.pointerEvents=closing>.7?'auto':'none';
  q('.my-exits').setAttribute('aria-hidden',String(closing<.7));q('.my-exits').querySelectorAll('a').forEach(el=>el.tabIndex=closing>.7?0:-1);
  q('.my-finale').style.opacity=String(reduced?.75:ease(.935,.97,progress)*.78);
  q('.my-dock-logo').style.opacity=String(ease(.91,.935,progress));
  q('.my-final-brand').style.opacity=String(ease(.93,.965,progress));
  q('.my-final-clouds').style.opacity=String(ease(.91,.97,progress));
  q('.my-final-note').style.opacity=String(ease(.94,.975,progress));
  q('.my-final-note').setAttribute('aria-hidden',String(progress<.95));
  text(q('.my-final-note'),language==='zh'?'从墨出发\n向更远处':'FROM INK\nTOWARD\nFARTHER SKIES');
  text(q('.my-final-name b'),language==='zh'?'墨鵷':'MOYUAN');
  text(q('.my-final-name span'),language==='zh'?'MOYUAN':'');
  q('.my-stage').style.clipPath='none';
  host.dataset.worldProgress=w.toFixed(4);
  window.dispatchEvent(new Event('moyuan:intro-progress'));
}
q('#my-replay').addEventListener('click',()=>{scrollTo({top:0,behavior:reduced?'instant':'smooth'});window.dispatchEvent(new Event('moyuan:replay'));});
q('#my-language').addEventListener('click',()=>{language=language==='zh'?'en':'zh';window.MoyuanI18n?.setLanguage(language);read();});
window.addEventListener('moyuan:language',e=>{language=e.detail==='en'?'en':'zh';read();});
let scrollFrame=0;
function scheduleRead(){if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;read();});}
window.addEventListener('scroll',scheduleRead,{passive:true});window.addEventListener('resize',scheduleRead);
read();
if(!reduced)import('/intro-assets/spatial-scene.js').then(m=>m.mount(host,()=>worldProgress(progress))).catch(e=>{q('#fallback').classList.add('visible');console.error(e);});
if(!reduced)import('/intro-assets/narrative-scene.js').then(m=>m.mountNarrative(intro,()=>progress,()=>language)).catch(e=>console.error('Narrative scene failed',e));
