(() => {
  'use strict';
  if(window.__moyuanMiniMusic)return;
  window.__moyuanMiniMusic=true;
  const key='moyuan-music-state-v1';
  let saved=null;try{saved=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
  let tracks=[],current=null,token=0,loading=false,request=null,seek=0,lastSave=0,dragging=false,leaving=false;
  const audio=new Audio();audio.preload='none';audio.volume=.45;
  const box=document.createElement('aside');box.id='mini-music';box.setAttribute('aria-label','迷你音乐播放器');
  box.innerHTML='<button class="mm-launch" type="button" aria-label="展开音乐播放器" aria-expanded="false">♫</button><section class="mm-panel" hidden><header><span>MELODY / 随身听</span><button class="mm-collapse" type="button" aria-label="收起播放器">−</button></header><div class="mm-track"><img alt="歌曲封面" width="44" height="44"><div><strong class="mm-title">随时听一首</strong><span class="mm-artist">边阅读，边听歌</span></div></div><div class="mm-controls"><button class="mm-prev" type="button" aria-label="上一首">‹</button><button class="mm-play" type="button" aria-label="播放">▶</button><button class="mm-next" type="button" aria-label="下一首">›</button></div><div class="mm-volume-row"><label>音量<input class="mm-volume" type="range" min="0" max="1" step="0.05" value="0.45"></label></div><input class="mm-seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="播放进度"><div class="mm-times"><span class="mm-elapsed">0:00</span><span class="mm-duration">0:00</span></div><details class="mm-library"><summary>播放列表 <span class="mm-count"></span></summary><input class="mm-search" type="search" placeholder="搜索歌曲或歌手" aria-label="搜索歌单"><div class="mm-list"></div></details><p class="mm-status" role="status">点击播放，默认选择可用的本地歌曲。</p><a href="/music/">打开音乐馆 ↗</a></section>';
  document.body.append(box);box.append(audio);
  const q=s=>box.querySelector(s),status=text=>q('.mm-status').textContent=text;
  q('img').src='/images/newnewlogo.png';q('img').onerror=()=>{q('img').onerror=null;q('img').src='/images/newnewlogo.png';};
  const save=(playing=!audio.paused)=>{if(current&&!loading&&!leaving&&audio.readyState>0)try{sessionStorage.setItem(key,JSON.stringify({id:current.id,time:audio.currentTime||0,playing,volume:audio.volume}));}catch{}};
  const clock=t=>{t=Number.isFinite(t)?t:0;return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');};
  const setUI=()=>{q('.mm-play').textContent=audio.paused?'▶':'Ⅱ';q('.mm-play').setAttribute('aria-label',audio.paused?'播放':'暂停');box.classList.toggle('is-playing',!audio.paused);};
  let catalogue;
  async function getTracks(){
    if(tracks.length)return tracks;
    if(!catalogue)catalogue=fetch('/music/catalog.json').then(r=>{if(!r.ok)throw Error('歌单暂时无法加载');return r.json();}).then(data=>{
      tracks=data;renderList();
      return tracks;
    }).catch(e=>{catalogue=null;throw e;});
    return catalogue;
  }
  async function play(){
    try{await audio.play();status('正在播放');}
    catch{status('点击播放继续收听。');setUI();}
  }
  async function choose(id,autoplay=true,time=0){
    const mine=++token;loading=true;dragging=false;q('.mm-seek').disabled=true;request?.abort();audio.pause();audio.removeAttribute('src');audio.load();
    try{
      await getTracks();if(mine!==token)return;
      current=tracks.find(t=>t.id===Number(id))||tracks.find(t=>t.file)||tracks[0];
      q('.mm-title').textContent=current.name;q('.mm-artist').textContent=current.artist;renderList();
      q('img').src=(current.cover||'/images/newnewlogo.png').replace(/^http:/,'https:');
      status(current.file?'正在载入歌曲…':'正在解析云端音源…');
      let source=current.file;
      if(!source){
        request=new AbortController();const active=request;const timer=setTimeout(()=>active.abort(),10000);
        try{const response=await fetch('https://oiapi.net/api/Kuwo?msg='+encodeURIComponent(current.name+' '+current.artist)+'&n=1&br=1',{signal:active.signal});if(!response.ok)throw Error('云端音源暂时不可用，请选择标有“本地”的歌曲。');const data=await response.json();source=data?.data?.url;if(!source)throw Error('未找到音源，请选择其他歌曲。');}finally{clearTimeout(timer);}
      }
      if(mine!==token)return;
      seek=time;audio.src=source.replace(/^http:/,'https:');audio.load();loading=false;
      if(autoplay)await play();else status('已恢复上次歌曲，点击播放继续。');
    }catch(e){if(mine===token){loading=false;status(e.name==='AbortError'?'音源请求超时，请手动重试。':e.message);setUI();}}
  }
  function expand(){q('.mm-panel').hidden=false;q('.mm-launch').hidden=true;q('.mm-launch').setAttribute('aria-expanded','true');}
  function collapse(){q('.mm-panel').hidden=true;q('.mm-launch').hidden=false;q('.mm-launch').setAttribute('aria-expanded','false');q('.mm-launch').focus();}
  q('.mm-launch').onclick=()=>{expand();if(!tracks.length)getTracks().catch(e=>status(e.message));};
  q('.mm-collapse').onclick=collapse;
  q('.mm-play').onclick=async()=>{if(loading)return;if(!audio.paused){audio.pause();return;}if(!audio.getAttribute('src')||audio.error){await choose(current?.id??saved?.id,true,saved?.time||0);}else await play();};
  async function step(delta){try{await getTracks();const list=tracks.filter(t=>t.file);const position=list.findIndex(t=>t.id===current?.id);await choose(list[(position+delta+list.length)%list.length]?.id);}catch(e){status(e.message);}}
  q('.mm-prev').onclick=()=>step(-1);q('.mm-next').onclick=()=>step(1);
  function renderList(){
    const search=q('.mm-search').value.trim().toLowerCase();
    const visible=tracks.filter(t=>(t.name+' '+t.artist).toLowerCase().includes(search));
    q('.mm-count').textContent=visible.length+' 首';q('.mm-list').replaceChildren();
    for(const t of [...visible].sort((a,b)=>Number(!!b.file)-Number(!!a.file))){
      const button=document.createElement('button');button.type='button';button.className='mm-song';button.setAttribute('aria-pressed',String(t.id===current?.id));
      const name=document.createElement('strong');name.textContent=t.name;
      const artist=document.createElement('span');artist.textContent=t.artist;
      const badge=document.createElement('small');badge.textContent=t.file?'本地':'云端';
      button.append(name,artist,badge);button.onclick=()=>choose(t.id);q('.mm-list').append(button);
    }
    if(!visible.length)q('.mm-list').textContent='没有找到匹配的歌曲';
  }
  q('.mm-search').oninput=renderList;
  q('.mm-volume').oninput=e=>{audio.volume=Number(e.target.value);save();};
  const slider=q('.mm-seek');slider.disabled=true;
  const updateSeek=()=>{
    const ready=Number.isFinite(audio.duration)&&audio.duration>0&&audio.seekable.length>0;
    slider.disabled=!ready;
    q('.mm-duration').textContent=clock(audio.duration);
    if(ready&&seek>0){const target=Math.min(seek,audio.duration);if(audio.seekable.end(audio.seekable.length-1)>=target){audio.currentTime=target;seek=0;}}
  };
  const commitSeek=()=>{if(!slider.disabled){audio.currentTime=audio.duration*Number(slider.value)/100;q('.mm-elapsed').textContent=clock(audio.currentTime);}dragging=false;};
  slider.addEventListener('pointerdown',()=>{dragging=true;});
  slider.addEventListener('input',()=>{q('.mm-elapsed').textContent=clock(audio.duration*Number(slider.value)/100);});
  slider.addEventListener('change',commitSeek);
  window.addEventListener('pointerup',()=>{if(dragging)commitSeek();});
  window.addEventListener('pointercancel',()=>{dragging=false;});
  ['loadedmetadata','durationchange','canplay','progress'].forEach(event=>audio.addEventListener(event,updateSeek));
  audio.addEventListener('seeked',()=>save());
  audio.addEventListener('play',()=>{document.querySelector('#music-audio')?.pause();document.querySelector('.portfolio-source-shell iframe')?.contentWindow?.postMessage({type:'portfolio-bgm-pause'},location.origin);setUI();save(true);});
  window.addEventListener('message',event=>{
    const frame=document.querySelector('.portfolio-source-shell iframe');
    if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow||event.data?.type!=='portfolio-bgm-playing')return;
    audio.pause();document.querySelector('#music-audio')?.pause();
  });
  audio.addEventListener('pause',()=>{setUI();save(false);if(!loading)status('已暂停');});
  audio.addEventListener('timeupdate',()=>{if(!dragging){q('.mm-elapsed').textContent=clock(audio.currentTime);q('.mm-seek').value=Number.isFinite(audio.duration)?audio.currentTime/audio.duration*100:0;}q('.mm-duration').textContent=clock(audio.duration);if(Date.now()-lastSave>2000){lastSave=Date.now();save();}});
  audio.addEventListener('ended',()=>step(1));
  audio.addEventListener('error',()=>{status('音频加载失败，点击播放重试或切换歌曲。');setUI();});
  // Normal article navigation uses PJAX, so this body-level audio stays alive.
  // Full-page navigation can only restore position; autoplay remains browser-controlled.
  function bindPage(){
    box.hidden=location.pathname.startsWith('/music/');
    const full=document.querySelector('#music-audio');
    if(full&&!full.dataset.miniBridge){
      full.dataset.miniBridge='true';
      const record=()=>{const active=document.querySelector('#playlist button.is-active');if(!active||leaving||window.__musicPageLeaving||full.readyState===0)return;try{sessionStorage.setItem(key,JSON.stringify({id:Number(active.dataset.trackId),time:full.currentTime,playing:!full.paused,volume:full.volume}));}catch{}};
      full.addEventListener('play',()=>{audio.pause();record();});full.addEventListener('pause',record);full.addEventListener('timeupdate',record);full.addEventListener('volumechange',record);full.addEventListener('seeked',record);
      window.addEventListener('pagehide',()=>{record();leaving=true;},{once:true,capture:true});
    }
  }
  bindPage();document.addEventListener('pjax:complete',bindPage);
  window.addEventListener('pagehide',()=>{if(!box.hidden){save();leaving=true;}request?.abort();},{capture:true});
  window.addEventListener('pageshow',event=>{leaving=false;if(event.persisted&&!box.hidden){try{const state=JSON.parse(sessionStorage.getItem(key)||'null');if(state){audio.volume=state.volume??.45;q('.mm-volume').value=audio.volume;choose(state.id,state.playing,state.time);}}catch{}}});
  if(saved&&!box.hidden){audio.volume=Math.max(0,Math.min(1,saved.volume??.45));q('.mm-volume').value=audio.volume;expand();choose(saved.id,!!saved.playing,saved.time||0);}
})();
