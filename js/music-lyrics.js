(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoyuanLyrics=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function parse(text){
  const offset=Number(String(text).match(/\[offset:([+-]?\d+)\]/i)?.[1]||0)/1000,cues=[];
  for(const line of String(text||'').split(/\r\n|\r|\n/)){
   const times=[...line.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];if(!times.length)continue;
   const words=line.replace(/\[\d+:\d{2}(?:[.:]\d{1,3})?\]/g,'').replace(/<-?\d+,-?\d+>/g,'').replace(/<\d+:\d+(?:\.\d+)?>/g,'').trim();
   for(const t of times)cues.push({time:Number(t[1])*60+Number(t[2])+Number('0.'+(t[3]||'0'))-offset,text:words});
  }
  cues.sort((a,b)=>a.time-b.time);
  if(/^\[kuwo:/m.test(String(text))){
   // Kuwo places a translation at the following line's timestamp.
   const main=[],translations=[],seen=new Set();
   for(const cue of cues){
    if(seen.has(cue.time)){if(main.length<2)continue;const translated=main.pop();translated.time=main[main.length-1].time;translations.push(translated);main.push(cue);}
    else{main.push(cue);seen.add(cue.time);}
   }
   cues.splice(0,cues.length,...main,...translations);cues.sort((a,b)=>a.time-b.time);
  }
  const result=[];
  for(const cue of cues){const last=result.at(-1);if(last&&last.time===cue.time){if(cue.text&&!last.text)last.text=cue.text;else if(cue.text&&cue.text!==last.text)last.text+='\n'+cue.text;}else result.push(cue);}
  return result;
 }
 function at(cues,time){let low=0,high=cues.length-1,best=-1;while(low<=high){const mid=(low+high)>>1;if(cues[mid].time<=time){best=mid;low=mid+1;}else high=mid-1;}return best<0?null:cues[best];}
 async function decodeKuwo(buffer){
  const bytes=new Uint8Array(buffer);let start=-1;
  for(let i=0;i<bytes.length-3;i++)if(bytes[i]===13&&bytes[i+1]===10&&bytes[i+2]===13&&bytes[i+3]===10){start=i+4;break;}
  if(start<0)throw Error('No lyric payload');
  const header=new TextDecoder().decode(bytes.slice(0,start));if(!/^tp=content/i.test(header))throw Error('No lyric content');
  const text=await new Response(new Blob([bytes.slice(start)]).stream().pipeThrough(new DecompressionStream('deflate'))).text();
  if(!/lrcx=1/i.test(header))return text;
  const data=Uint8Array.from(atob(text.trim()),c=>c.charCodeAt(0)),key=new TextEncoder().encode('yeelion');
  for(let i=0;i<data.length;i++)data[i]^=key[i%key.length];
  return new TextDecoder().decode(data);
 }
 function createLoader({fetch:request=globalThis.fetch,onChange=()=>{}}={}){
  let revision=0,controller;
  function cancel(){revision++;controller?.abort();}
  async function load(track,resolved){
   cancel();const current=revision;controller=new AbortController();const active=controller;onChange([]);
   const timer=setTimeout(()=>active.abort(),10000);
   async function localLyric(){const response=await request(track.lrc,{signal:active.signal});if(!response.ok)throw Error('Lyrics unavailable');return response.text();}
   try{
    let text;
    if(resolved?.source==='kw'||resolved?.provider==='kw'){
     const id=String(resolved.matchedId||'').replace(/^MUSIC_/,'');if(!/^\d+$/.test(id))throw Error('Missing lyric identity');
     try{
      const response=await request('https://mlyric.kuwo.cn/mobi.s?'+new URLSearchParams({f:'web',type:'lyric',lrcx:'1',rid:id,encode:'utf8'}),{signal:active.signal});
      if(!response.ok)throw Error('Lyrics unavailable');text=await decodeKuwo(await response.arrayBuffer());
     }catch(error){if(active.signal.aborted||!track.lrc||track.lyricIdentity!==track.uid)throw error;text=await localLyric();}
    }else{
     if(!track.lrc)throw Error('No matching lyrics');
     text=await localLyric();
    }
    const cues=parse(text);if(current===revision)onChange(cues);return current===revision?cues:[];
   }catch{if(current===revision)onChange([]);return [];}
   finally{clearTimeout(timer);}
  }
  return {load,cancel};
 }
 return {parse,at,decodeKuwo,createLoader};
});
