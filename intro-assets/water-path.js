const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const IMPACT_TIME=1.35;
// Continue along the viewing ray after crossing the fixed impact point.
export function waterCameraAt(progress){
  const dive=smooth(.025,.19,progress),angle=.21+.72*smooth(0,.84,dive);
  const distance=3.7*(1-dive)-.25*dive;
  const forward=[0,-Math.sin(angle),-Math.cos(angle)];
  return {origin:forward.map(v=>-v*distance),forward,dive,distance};
}
export function dropHeight(opening){return .96*(1-Math.min(1,Math.max(0,opening/IMPACT_TIME))**2);}
export const dropProfile=[[0,-.041],[.018,-.035],[.030,-.018],[.034,.004],[.028,.025],[.016,.051],[.006,.079],[0,.108]];
