// Logical Intro progress, shared by the artwork, particles and live labels.
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function treeGrowth(growth) {
  const branches = [[.24,.72],[.18,.64],[.34,.83],[.38,.86],[.26,.73],[.32,.80]].map(([start,end])=>smooth(start,end,growth));
  return {trunk:smooth(0,.44,growth),branches,labels:branches.map(value=>smooth(.94,1,value)),finish:smooth(.86,1,growth)};
}
export const narrativeCopy = {
  zh: { skills: ['前端', '后端', 'AI', '系统', '基础设施', '部署'], outcomes: ['通过', '待复核', '阻回'], note: '不是每一根树枝，都要握在手里。', phases: ['纤维', '解体', '聚类', '结构'] },
  en: { skills: ['Web', 'Backend', 'AI', 'Systems', 'Infra', 'Deploy'], outcomes: ['Pass', 'Review', 'Return'], note: 'Not every branch needs to be held.', phases: ['Fiber', 'Dissolve', 'Cluster', 'Structure'] }
};
export function narrativeState(p) {
  const structure = clamp((p - .37) / .12), tree = clamp((p - .49) / .08), gate = clamp((p - .57) / .08);
  const toTree = smooth(.482, .505, p), toGate = smooth(.563, .584, p);
  return {
    active: p >= .352 && p <= .665,
    opacity: smooth(.352, .37, p) * (1 - smooth(.65, .665, p)),
    layers: [1 - toTree, toTree * (1 - toGate), toGate],
    structure, tree, gate, toTree, toGate,
    dissolve: smooth(.08, .58, structure), cluster: smooth(.35, .78, structure), graph: smooth(.63, .92, structure),
    growth: smooth(.04, .78, tree), arrival: smooth(.04, .45, gate), decision: smooth(.43, .88, gate),
    treeDetails: 1 - smooth(.558,.57,p),
    phase: Math.min(3, Math.floor(structure * 4))
  };
}
// Three distinct motions in image coordinates. Review and return never cross
// the membrane at x=.625; only the upper evidence path can reach its far side.
export function judgmentPoint(lane, amount) {
  const t = clamp(amount), edge = .623, y = [.232, .395, .54][lane];
  if (t < .57) {
    const u = t / .57;
    return { x: .06 + (edge - .06) * u, y: y + Math.sin(u * Math.PI * 2) * .016, alpha: 1 };
  }
  const u = (t - .57) / .43;
  if (lane === 0) return { x: edge + u * .31, y: y + Math.sin(u * Math.PI) * .01, alpha: 1 };
  if (lane === 1) return { x: edge - .045 * (1 - Math.cos(u * Math.PI * 2)), y: y - .032 * Math.sin(u * Math.PI * 2), alpha: 1 };
  return { x: edge - .055 * u - .008 * Math.sin(u * Math.PI), y: y + .20 * u * u, alpha: 1 - smooth(.65, 1, u) };
}
