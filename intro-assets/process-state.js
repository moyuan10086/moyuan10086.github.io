const clamp = value => Math.max(0, Math.min(1, value));
const smooth = (a,b,t) => { const n=clamp((t-a)/(b-a)); return n*n*(3-2*n); };
export const calculationNodes=[
  [-.65,.38,-.28],[-.65,.18,-.18],[-.65,-.02,-.08],
  [-.22,.43,-.04],[-.22,.24,.06],[-.22,.05,.16],
  [.24,.34,-.12],[.24,.11,-.02],[.67,.23,-.16],
  [.22,-.20,.11]
];
export const calculationEdges=[[0,3],[0,4],[1,4],[1,5],[2,5],[3,6],[4,6],[4,7],[5,7],[6,8],[7,8],[7,9],[9,8]];
export function processState(t) {
  return {
    structure: smooth(.45,.48,t)*(1-smooth(.64,.68,t)),
    unfold: smooth(.45,.61,t),
    travel: smooth(.46,.645,t),
    calculation: smooth(.49,.53,t)*(1-smooth(.637,.66,t)),
    activation: smooth(.51,.64,t),
    evidence: smooth(.65,.672,t)*(1-smooth(.73,.75,t)),
    boundary: smooth(.73,.747,t)*(1-smooth(.805,.82,t)),
    decision: smooth(.75,.805,t),
    phase: t<.65?Math.min(3,Math.floor(clamp((t-.45)/.20)*4)):t<.73?4:5
  };
}
