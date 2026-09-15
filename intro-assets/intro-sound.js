import {createCueTracker,sceneMusicLevel,sceneTrack} from './sound-state.js';

const intro = document.querySelector('#intro');
const button = document.querySelector('#my-sound-toggle');
if (intro && button && !window.__moyuanIntroSound) {
  window.__moyuanIntroSound = true;
  const tracks = [...intro.querySelectorAll('audio[data-track]')];
  let bgm = document.querySelector('#my-bgm');
  const ambient = document.querySelector('#my-ambient');
  const ambientSwitch = document.querySelector('#my-sound-ambient');
  const melodySwitch = document.querySelector('#my-sound-melody');
  const catalog = {
    jiangnan:{zh:'烟雨江南',en:'Mist Over Jiangnan',level:1,url:'https://pixabay.com/music/rnb-烟雨江南-mist-over-jiangnan-428654/'},
    xiaoshan:{zh:'空山箫语',en:'Whisper of Empty Mountains',level:.72,url:'https://pixabay.com/music/beats-空山箫语-whisper-of-empty-mountains-428655/'},
    guqin:{zh:'琴语晨思',en:'Guqin Reflection',level:.62,url:'https://pixabay.com/music/beautiful-plays-track-3-guqin-reflection-琴语晨思-420783/'}
  };
  const player = document.querySelector('.my-sound-player');
  const panel = document.querySelector('#my-sound-panel');
  const details = document.querySelector('#my-sound-details');
  const volume = document.querySelector('#my-sound-volume');
  const effects = document.querySelector('#my-sound-effects');
  let ctx, master, noiseBuffer, suspendTimer;
  let enabled = true, waiting = false, failed = false, request = 0;
  let userVolume = .25, duckTimer, mixFrame = 0, duck = 1, mixTarget = '', uiKey = '';
  let transitionUntil = 0, ambientFailed = false;
  let lastGesture = -Infinity;
  const voices = new Set(), cues = createCueTracker();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = () => Number(intro.dataset.progress || 0);
  const active = () => enabled && (!bgm.paused || !ambient.paused) && !document.hidden && ctx?.state === 'running';
  const words = {
    zh: ['点击播放', '暂停音乐', '播放音乐', '重试播放', '正在载入', '音乐与音量', '音量', '背景音乐', '已调整响度与编码'],
    en: ['Tap to play', 'Pause music', 'Play music', 'Retry music', 'Loading', 'Music & volume', 'Volume', 'BACKGROUND MUSIC', 'Loudness adjusted; re-encoded']
  };
  function syncUI() {
    const w = words[intro.dataset.language === 'en' ? 'en' : 'zh'];
    const playing = enabled && ((!bgm.paused && bgm.readyState >= 3) || (!melodySwitch.checked && !ambient.paused && ambient.readyState>=3));
    const key=[intro.dataset.language,playing,failed,waiting,enabled,userVolume,bgm.dataset.track,melodySwitch.checked,ambientFailed].join('|');
    if(key===uiKey)return;uiKey=key;
    // The control reflects the visitor's sound preference. A blocked autoplay
    // remains enabled and needs no separate opt-in; animation reflects actual playback.
    const label = failed ? w[3] : enabled ? w[1] : w[2];
    button.querySelector('.my-sound-action').textContent = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(enabled));
    button.dataset.state = failed ? 'error' : waiting ? 'waiting' : !enabled ? 'off' : playing ? 'on' : 'loading';
    player.classList.toggle('is-playing',playing);
    details.setAttribute('aria-label',w[5]);
    volume.setAttribute('aria-label',w[6]);
    player.querySelector('[data-volume-label]').textContent = w[6];
    player.querySelector('[data-music-label]').textContent = w[7];
    player.querySelector('[data-music-modified]').textContent = intro.dataset.language === 'en' ? 'AI-generated music' : 'AI 生成音乐';
    player.querySelector('[data-effects-label]').textContent = intro.dataset.language === 'en' ? 'Interaction sounds' : '动作音效';
    player.querySelector('[data-mix-label]').textContent = intro.dataset.language === 'en' ? 'SOUNDS OF THE PROLOGUE' : '序章 · 随景而声';
    player.querySelector('[data-melody-label]').textContent = intro.dataset.language === 'en' ? 'Soft music' : '轻音乐';
    player.querySelector('[data-ambient-label]').textContent = intro.dataset.language === 'en' ? (ambientFailed?'Stream unavailable':'Quiet stream') : (ambientFailed?'溪流暂不可用':'溪流底声');
    player.querySelector('[data-track-title]').textContent = melodySwitch.checked ? catalog[bgm.dataset.track][intro.dataset.language==='en'?'en':'zh'] : (intro.dataset.language==='en'?'A quiet stream':'静听溪流');
    player.querySelector('[data-track-credit]').href = catalog[bgm.dataset.track].url;
    player.classList.toggle('is-muted',userVolume===0);
  }
  function mix(duration = 700) {
    const target = userVolume * sceneMusicLevel(progress()) * duck * catalog[bgm.dataset.track].level;
    const all=[...tracks,ambient];
    const targets=all.map(a=>a===ambient?(ambientSwitch.checked?userVolume*.3:0):a===bgm&&melodySwitch.checked?target:0);
    const key=targets.map(v=>v.toFixed(3)).join('|');
    if(duration!==0 && key===mixTarget) return;
    mixTarget=key;
    cancelAnimationFrame(mixFrame);
    if (!enabled || document.hidden || duration===0) {all.forEach((a,i)=>a.volume=targets[i]);tracks.forEach(a=>{if(a!==bgm||!melodySwitch.checked)a.pause();});return;}
    duration=Math.max(duration,transitionUntil-performance.now());
    const from=all.map(a=>a.volume), start=performance.now();
    const step=now=>{
      const t=Math.min(1,(now-start)/duration), smooth=t*t*(3-2*t);
      all.forEach((a,i)=>a.volume=Math.max(0,Math.min(1,from[i]+(targets[i]-from[i])*smooth)));
      if(t<1)mixFrame=requestAnimationFrame(step);
      else tracks.forEach(a=>{if(a!==bgm||!melodySwitch.checked)a.pause();});
    };
    mixFrame=requestAnimationFrame(step);
  }
  function selectTrack() {
    const next=sceneTrack(progress(),bgm.dataset.track);
    if(next===bgm.dataset.track)return;
    bgm=tracks.find(a=>a.dataset.track===next);
    player.dataset.track=next;mixTarget='';
    transitionUntil=enabled&&!waiting&&!document.hidden?performance.now()+2400:0;
    if(enabled&&!waiting&&!document.hidden)resume();else mix(0);
    syncUI();
  }
  function envelope(destination, at, duration, level, attack = .025) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + Math.min(attack, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.00001, at + duration);
    gain.gain.setValueAtTime(0, at + duration + .01);
    gain.connect(destination); return gain;
  }
  function track(source, nodes, at, duration) {
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); nodes.forEach(n => n.disconnect()); };
    source.start(at); source.stop(at + duration + .03);
  }
  function note(frequency, duration, level, delay = 0, end = frequency, bus = master, attack = .03) {
    const at = ctx.currentTime + delay, oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    const gain = envelope(bus, at, duration, level, attack);
    oscillator.connect(gain); track(oscillator, [gain], at, duration);
  }
  function rustle(duration, level, frequency, delay = 0, end = frequency, type = 'bandpass') {
    const at = ctx.currentTime + delay, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    source.buffer = noiseBuffer; filter.type = type; filter.Q.value = .65;
    filter.frequency.setValueAtTime(frequency, at);
    filter.frequency.exponentialRampToValueAtTime(end, at + duration);
    const gain = envelope(master, at, duration, level, .045);
    source.connect(filter).connect(gain); track(source, [filter, gain], at, duration);
  }
  function visual(kind, point) {
    if (reduced.matches) return;
    const target = kind === 'shutter' ? intro.querySelector('.my-project-visual') : null;
    if (target) target.animate([{filter:'brightness(1)'},{filter:'brightness(1.18)',offset:.12},{filter:'brightness(1)'}],{duration:330});
    if (point) {
      const ring = document.createElement('i'); ring.className = 'my-ink-touch';
      ring.style.left = `${point.x}px`; ring.style.top = `${point.y}px`;
      intro.querySelector('.my-stage').append(ring);
      const animation = ring.animate([{opacity:.42,transform:'translate(-50%,-50%) scale(.12)'},{opacity:0,transform:'translate(-50%,-50%) scale(1)'}],{duration:1000,easing:'ease-out'});
      animation.onfinish = () => ring.remove();
    }
  }
  function play(kind) {
    visual(kind);
    if (!active() || !effects.checked || userVolume===0) return;
    // Give the short interaction cue a little room in the mix without
    // stopping or seeking the continuous recording.
    duck = .72; mix(110);
    clearTimeout(duckTimer);
    duckTimer = setTimeout(() => {
      duck = 1; mix(850);
    }, kind==='phoenix' ? 1600 : kind==='grow' ? 700 : 420);
    if (kind === 'drop') {
      note(1040,.24,.10,0,480); note(540,.7,.035,.07,390);
    } else if (kind === 'brush') {
      rustle(.65,.16,1800,0,480); rustle(.26,.065,3400,.16,1200);
    } else if (kind === 'grow') {
      rustle(.85,.24,370,0,110,'lowpass');
      [0,.16,.37].forEach((delay,i) => {rustle(.11,.13,650+i*270,delay,250);note(150+i*35,.16,.026,delay);});
    } else if (kind === 'shutter') {
      rustle(.032,.35,2300,0,1200); rustle(.075,.24,1050,.065,360); note(190,.065,.07,.03,90);
    } else if (kind === 'phoenix') {
      note(620,1.8,.025,0,1020,master,.35); note(940,2,.014,.22,700,master,.4); rustle(1.9,.045,1600,0,780);
    } else if (kind === 'pass') {
      note(523,.8,.045); note(784,1,.024,.10);
    } else if (kind === 'review') {
      note(392,.45,.033); note(392,.7,.023,.23);
    } else if (kind === 'return') {
      rustle(.5,.08,640,0,180); note(220,.65,.025,0,110);
    } else {rustle(1.1,.065,900,0,480); note(294,1.2,.022);}
  }
  function setup() {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) throw new Error('Web Audio unavailable');
    ctx = new Constructor(); master = ctx.createGain(); master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -18; compressor.ratio.value = 4;
    master.connect(compressor).connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1,ctx.sampleRate*6,ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
    // The recording supplies its own rain texture. No synthetic music or noise bed.
    ctx.addEventListener('statechange',syncUI);
  }
  function stopVoices() {for (const source of voices) {try {source.stop();} catch {}}}
  function unlockEffects() {
    if (!enabled || document.hidden || !effects.checked) return;
    try {
      if (!ctx) setup();
      clearTimeout(suspendTimer);
      ctx.resume().then(()=>{
        if (!enabled || document.hidden) return;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(effects.checked ? .55*userVolume/.65 : 0,ctx.currentTime,.12);
      }).catch(()=>{});
    } catch { /* A browser without Web Audio can still play the real BGM. */ }
  }
  async function resume() {
    if (!enabled || document.hidden) return;
    const current = ++request;
    waiting = false; failed = false; syncUI();
    try {
      const selected=bgm;
      const requests=[];
      if(melodySwitch.checked)requests.push(selected.play());
      if(ambientSwitch.checked)requests.push(ambient.play().then(()=>{ambientFailed=false;},error=>{
        ambientFailed=true;if(!melodySwitch.checked)throw error;
      }));
      await Promise.all(requests);
      if (current !== request || !enabled || document.hidden) return;
      waiting = false; failed = false;
      mixTarget='';mix(transitionUntil>performance.now()?2400:900);
    } catch (error) {
      if (current !== request || !enabled) return;
      waiting = error.name === 'NotAllowedError';
      failed = !waiting && error.name !== 'AbortError';
    }
    syncUI();
  }
  function pause() {
    ++request;transitionUntil=0;tracks.forEach(a=>a.pause());ambient.pause();clearTimeout(suspendTimer); clearTimeout(duckTimer); duck=1;mix(0);
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0,ctx.currentTime,.055);
    suspendTimer = setTimeout(() => {if (!enabled || document.hidden) {stopVoices();ctx.suspend().catch(()=>{});}},300);
  }
  button.addEventListener('click',() => {
    if (enabled && !failed) {enabled=false;pause();}
    else {enabled=true;unlockEffects();resume();}
    cues.reset(progress()); syncUI();
  });
  function update() {
    const p = progress(), cue = cues.update(p,performance.now());
    selectTrack();
    mix();
    if (cue) play(cue);
    syncUI();
  }
  window.addEventListener('moyuan:intro-progress',update);
  window.addEventListener('moyuan:replay',() => cues.replay());
  document.addEventListener('visibilitychange',() => {
    cues.reset(progress()); if (!enabled) return;
    if (document.hidden) pause(); else {resume();if(ctx)unlockEffects();}
  });
  window.addEventListener('pagehide',() => {pause();stopVoices();ctx?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',event => {if(event.persisted&&enabled)resume();});
  function gesture(event) {
    if (!event.isTrusted || event.target.closest('.my-sound-player') || !enabled) return;
    if (event.type==='keydown' && (event.repeat || ['Shift','Alt','Control','Meta','Escape','Tab'].includes(event.key))) return;
    unlockEffects(); if (waiting) resume();
  }
  document.addEventListener('click',gesture);
  document.addEventListener('touchend',gesture,{passive:true});
  document.addEventListener('keydown',gesture);
  details.addEventListener('click',()=>{panel.hidden=!panel.hidden;details.setAttribute('aria-expanded',String(!panel.hidden));});
  document.addEventListener('click',event=>{if(!player.contains(event.target)){panel.hidden=true;details.setAttribute('aria-expanded','false');}});
  player.addEventListener('keydown',event=>{if(event.key==='Escape'){panel.hidden=true;details.setAttribute('aria-expanded','false');details.focus();}});
  volume.addEventListener('input',()=>{
    userVolume=Number(volume.value)/100;
    mix(0);
    player.querySelector('output').textContent=volume.value+'%';
    if(active())master.gain.setTargetAtTime(effects.checked ? .55*userVolume/.65 : 0,ctx.currentTime,.08);
    syncUI();
  });
  effects.addEventListener('change',()=>{
    if(!effects.checked){stopVoices();clearTimeout(duckTimer);duck=1;mix();}
    if(ctx)master.gain.setTargetAtTime(effects.checked ? .55*userVolume/.65 : 0,ctx.currentTime,.08);
    if(effects.checked)unlockEffects();
  });
  for(const toggle of [melodySwitch,ambientSwitch])toggle.addEventListener('change',()=>{
    // At least one sound layer stays selected; the main button pauses both.
    if(!melodySwitch.checked&&!ambientSwitch.checked){(toggle===melodySwitch?ambientSwitch:melodySwitch).checked=true;}
    if(!ambientSwitch.checked)ambient.pause();
    mixTarget='';mix();if(enabled)resume();syncUI();
  });
  for(const a of [...tracks,ambient]){
    a.addEventListener('playing',()=>{if(!enabled||document.hidden||(a!==ambient&&a!==bgm&&a.volume===0)){a.pause();return;}syncUI();});
    for(const event of ['pause','waiting','canplay'])a.addEventListener(event,syncUI);
    a.addEventListener('error',()=>{if(a===ambient)ambientFailed=true;else if(a===bgm){failed=true;waiting=false;}syncUI();});
  }
  intro.addEventListener('pointerdown',event => {
    if (event.button!==0 || event.target.closest('a,button,input') || performance.now()-lastGesture<900) return;
    lastGesture = performance.now(); visual('drop',{x:event.clientX,y:event.clientY});
    if (active()) play(progress()<.37?'drop':'brush');
  });
  intro.addEventListener('click',event => {
    if (!active()) return;
    if (event.target.closest('#my-project-window')) play('shutter');
    else if (event.target.closest('#my-language,.my-exits a')) play('brush');
  });
  [...tracks,ambient].forEach(a=>{a.volume=0;a.loop=true;});
  player.dataset.track=bgm.dataset.track;mix(0);bgm.autoplay=true;
  cues.reset(progress()); syncUI(); resume();
}
