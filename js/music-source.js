(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else if(!root.MoyuanMusicSource)root.MoyuanMusicSource=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const cache=new Map(),localFiles=new Map(),matchedTracks=new Map();
 const endpoint='https://oiapi.net/api/Kuwo';
 const identity=t=>t.uid||[t.source,t.meta?.hash||t.meta?.songId||'',t.name,t.artist,t.interval].join('|');
 const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s·]/g,'');
 const versionTag=/live|dj|remix|mix|ver\b|cover|slowed|sped|speed|acoustic|instrumental|explicit|clean|edit|remaster|demo|karaoke|\d(?:\.\d+)?x|版|合唱|伴奏|片段|翻唱|改编|纯音乐|纯享|变调|变速|降调|升调/i;
 const titleStem=s=>String(s||'').normalize('NFKC').replace(/\(([^)]*)\)/g,(all,inside)=>versionTag.test(inside)?all:'').trim();
 const artistKey=s=>String(s||'').normalize('NFKC').split(/[、,&/]/).map(normalize).filter(Boolean).sort().join('|');
 function sameArtists(expected,actual){const a=artistKey(expected).split('|'),b=artistKey(actual).split('|');return a[0]&&a.every(name=>b.includes(name))&&b.length-a.length<=2;}
 function seconds(value){
  if(typeof value==='number')return value;
  if(!/^\d+(?::\d{1,2}){0,2}$/.test(String(value)))return NaN;
  return String(value).split(':').reduce((total,n)=>total*60+Number(n),0);
 }
 function durationMatches(track,actual){const expected=seconds(track.interval);return Number.isFinite(expected)&&expected>0&&Number.isFinite(Number(actual))&&Math.abs(Number(actual)-expected)<=3;}
 function matches(track,candidate){
  return normalize(titleStem(track.name))===normalize(titleStem(candidate.song))&&sameArtists(track.artist,candidate.singer)&&durationMatches(track,seconds(candidate.time));
 }
 function selectCandidate(track,candidates){
  if(!Array.isArray(candidates))throw Error('云端搜索未返回曲目列表');
  const index=candidates.findIndex(c=>matches(track,c)&&(track.source!=='kw'||!track.meta?.songId||String(c.rid).replace(/^MUSIC_/,'')===String(track.meta.songId)));
  if(index<0)throw Error('没有找到曲名、歌手和时长一致的云端版本，已停止自动匹配');
  return {index,candidate:candidates[index]};
 }
 function assetUrl(file){
  if(/^https?:\/\//.test(file)||file.startsWith('/')||file.startsWith('blob:'))return file;
  if(/^[A-Za-z]:|^\\\\|\.\./.test(file))throw Error('本地路径不能作为网页音频地址');
  return '/music/songs/'+encodeURIComponent(file);
 }
 async function resolveCloud(track,options={}){
  const key=identity(track);
  const saved=cache.get(key);if(saved&&saved.expires>Date.now())return saved.result;
  const request=options.fetch||globalThis.fetch;
  const params=new URLSearchParams({msg:titleStem(track.name)+' '+String(track.artist||'').replace(/[、&/]/g,' ')});
  async function json(url){const r=await request(url,{signal:options.signal});if(!r.ok)throw Error('云端音源暂时不可用');return r.json();}
  const found=await json(endpoint+'?'+params);
  const {index,candidate}=selectCandidate(track,found.data);
  matchedTracks.set(key,candidate);
  params.set('n',String(index+1));params.set('br','1');
  const answer=await json(endpoint+'?'+params),resolved=answer.data;
  if(!resolved||resolved.rid!==candidate.rid||!matches(track,resolved))throw Error('云端返回的曲目身份发生变化，已停止播放');
  if(typeof resolved.url!=='string'||!/^https?:\/\//.test(resolved.url))throw Error('云端未返回可播放音频');
  const url=new URL(resolved.url);if(url.protocol==='http:')url.protocol='https:';
  const result={url:url.href,provider:'kw',providerKey:'oiapi',source:'kw',matchedId:resolved.rid,originalSource:track.source,label:'酷我音乐'};
  cache.set(key,{result,expires:Date.now()+5*60*1000});return result;
 }
 function probeUrl(url,track,signal){
  if(typeof Audio==='undefined')return Promise.resolve({duration:seconds(track.interval)});
  return new Promise((resolve,reject)=>{
   const audio=new Audio();audio.preload='metadata';let settled=false;
   const timer=setTimeout(()=>finish(Error('音频加载超时')),8000);
   const abort=()=>{const e=new Error('Cancelled');e.name='AbortError';finish(e);};
   function finish(error){if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);const duration=audio.duration;audio.oncanplay=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();error?reject(error):resolve({duration});}
   audio.onerror=()=>finish(Error('音频链接不可播放'));
   audio.oncanplay=()=>finish(durationMatches(track,audio.duration)?null:Error('音频时长不匹配'));
   if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});audio.src=url;audio.load();
  });
 }
 function haitang(track){
  const mapping=track.alternatives?.find(t=>t.source==='kw');
  const match=matchedTracks.get(identity(track))||(mapping?{rid:'MUSIC_'+mapping.songId}:null);
  const source=match?'kw':track.source;
  const id=match?String(match.rid).replace(/^MUSIC_/,''):source==='kg'?track.meta?.hash:track.meta?.songId;
  const endpoints={kw:'https://musicapi.haitangw.net/music/kw.php',kg:'https://music.haitangw.cc/kgqq/kg.php',mg:'https://music.haitangw.cc/musicapi/mg.php'};
  if(!id||!endpoints[source])throw Error('该备用音源不支持此曲目');
  return {url:endpoints[source]+'?'+new URLSearchParams({type:'mp3',id,level:'standard'}),provider:'haitang',providerKey:'haitang',source,matchedId:source==='kw'?'MUSIC_'+id:id,label:'海棠音乐'};
 }
 async function resolve(track,options={}){
  const key=identity(track);
  if(track.source==='local'){
   if(localFiles.has(key))return {url:localFiles.get(key),provider:'local',label:'本机原文件'};
   if(track.file)return {url:assetUrl(track.file),provider:'local',label:'本站音频'};
   throw Error('这是本地录音，请选择原音频文件；不会搜索同名云端歌曲');
  }
  const excluded=new Set(options.excludeProviders||[]),probe=options.probe||probeUrl;
  let lastError;
  for(const providerKey of ['oiapi','haitang','site']){
   if(excluded.has(providerKey)||providerKey==='site'&&!track.file)continue;
   try{
    const result=providerKey==='oiapi'?await resolveCloud(track,options):providerKey==='haitang'?haitang(track):{url:assetUrl(track.file),provider:'local',providerKey:'site',source:track.source,label:'本站备份'};
    const checked=await probe(result.url,track,options.signal);
    return {...result,duration:checked?.duration};
   }catch(error){
    if(error.name==='AbortError'||options.signal?.aborted)throw error;
    lastError=error;cache.delete(key);
   }
  }
  throw lastError||Error('没有可播放的音源');
 }
 function invalidate(track){cache.delete(identity(track));}
 function userMessage(error){return /匹配|时长|身份/.test(error.message||'')?'这首歌暂时无法播放，请换一首或稍后重试。':error.message;}
 function bindLocalFile(track,file){
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file),audio=new Audio();audio.preload='metadata';
   const timer=setTimeout(()=>finish(Error('本地音频读取超时')),15000);
   function finish(error){clearTimeout(timer);audio.onloadedmetadata=audio.onerror=null;audio.removeAttribute('src');audio.load();if(error){URL.revokeObjectURL(url);reject(error);}else{const key=identity(track),old=localFiles.get(key);if(old)URL.revokeObjectURL(old);localFiles.set(key,url);resolve(url);}}
   audio.onloadedmetadata=()=>finish(durationMatches(track,audio.duration)?null:Error('所选音频时长与 LX 原曲不一致，未替换'));
   audio.onerror=()=>finish(Error('无法读取所选音频'));audio.src=url;
  });
 }
 return {selectCandidate,seconds,resolve,durationMatches,assetUrl,invalidate,bindLocalFile,userMessage};
});
