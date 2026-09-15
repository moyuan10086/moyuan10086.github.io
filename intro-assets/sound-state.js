export const soundCues = [
  [.025,'drop'],[.145,'phoenix'],[.245,'brush'],[.393,'brush'],[.434,'drop'],
  [.505,'grow'],[.54,'brush'],[.59,'wind'],[.615,'pass'],[.63,'review'],[.643,'return'],
  [.69,'brush'],[.746,'brush'],[.80,'brush'],[.852,'shutter'],[.868,'shutter'],[.892,'shutter'],[.95,'phoenix']
];
// Small changes leave the user's chosen loudness intact; reading-heavy
// sections make a little room for text, and the landscape opens back up.
export function sceneMusicLevel(progress) {
  const stops = [[0,1],[.33,1],[.40,.94],[.51,1],[.59,.94],[.69,1],[.84,.90],[.91,.90],[.96,1],[1,1]];
  const p = Math.max(0,Math.min(1,Number(progress)||0));
  for (let i=1;i<stops.length;i++) {
    const [end,to]=stops[i], [start,from]=stops[i-1];
    if(p<=end) {const t=(p-start)/(end-start), smooth=t*t*(3-2*t);return from+(to-from)*smooth;}
  }
  return 1;
}
export function sceneTrack(progress, previous='jiangnan') {
  // Hysteresis around chapter boundaries prevents track chatter when a
  // touchpad moves back and forth by a few pixels.
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const boundaries=[.37,.65,.925];
  if(boundaries.some(b=>Math.abs(p-b)<.004))return previous;
  return p<.37||p>=.925?'jiangnan':p<.65?'xiaoshan':'guqin';
}
export function createCueTracker() {
  let previous=0,last=-Infinity,replaying=false;
  const played=new Set();
  return {
    reset(p=0) {previous=p;},
    replay() {played.clear();replaying=previous>.002;last=-Infinity;},
    update(p,now) {
      const from=previous;previous=p;
      if(replaying) {if(p<=.002)replaying=false;return null;}
      if(p<=from) return null;
      const crossed=soundCues.map(([at,kind],id)=>({at,kind,id})).filter(c=>c.at>from&&c.at<=p&&!played.has(c.id));
      crossed.forEach(c=>played.add(c.id));
      // Fast jumps consume crossed cues without queuing a burst of sound.
      if(p-from>.045||crossed.length!==1||now-last<750) return null;
      last=now;return crossed[0].kind;
    }
  };
}
