import {copy} from './story-state.js';
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = value => { const n = clamp(value); return n * n * (3 - 2 * n); };
const lerp = (a, b, t) => a + (b - a) * t;
const ranges = [[.65, .725], [.725, .78], [.78, .84]];
const skillStages = [
  ['Web', '让想法可以被看见、被使用。', 'Make an idea visible and usable.'],
  ['后端', '把界面接到服务、状态与数据。', 'Connect the interface to services, state and data.', 'Backend'],
  ['部署', '让一次运行成为可复现的环境。', 'Turn a one-off run into a reproducible environment.', 'Deployment'],
  ['AI', '从模型能力，走向实际任务。', 'Bring model capabilities into real tasks.'],
  ['推理', '理解速度背后的运行路径。', 'Understand the runtime behind inference.', 'Inference'],
  ['异构算力', '让系统走出单一硬件环境。', 'Take a system beyond a single hardware environment.', 'Infrastructure']
];
const processNames = [['拆解问题', 'Frame the question'], ['构建实验', 'Build the experiment'], ['记录迭代', 'Record the changes'], ['检验依据', 'Review the evidence'], ['整理交付', 'Prepare the handoff']];
const flagNames = [['图文语义', 'Image-text semantics'], ['多模态理解', 'Multimodal understanding'], ['内容安全', 'Content safety'], ['安全边界', 'Safety boundaries'], ['智能体审计', 'Agent auditing'], ['证据溯源', 'Evidence provenance'], ['昇腾部署', 'Ascend deployment']];

export function buildState(progress) {
  const p = Number.isFinite(progress) ? progress : 0;
  const chapter = ranges.findIndex(([start, end]) => p >= start && p < end);
  const locals = ranges.map(([start, end]) => clamp((p - start) / (end - start)));
  const layers = locals.map((local, index) => chapter === index ? smooth(local / .055) * (1 - smooth((local - .945) / .055)) : 0);
  const focus = locals[0] * 14;
  const ridgeGroups = [[0,1,2,3,4],[8,7,6,5,9],[10,11,12,14,13]];
  const ridgeGroup = Math.min(2,Math.floor(locals[0]*3)), ridgeLocal = locals[0]*3-ridgeGroup;
  const ridgeAnchors = [[40,79.5],[52,71],[64,62],[75,51],[83.5,33]];
  const skills = Array.from({ length: 15 }, (_, index) => {
    const slot = ridgeGroups[ridgeGroup].indexOf(index), anchor=ridgeAnchors[Math.max(0,slot)];
    const arrival=smooth((ridgeLocal-slot*.075)/.22), departure=1-smooth((ridgeLocal-.90)/.10);
    return {
      opacity:chapter===0&&slot>=0?arrival*departure:0,
      x:anchor[0], y:anchor[1]-10+(1-arrival)*3,
      z:0, scale:.94+.06*arrival,rotation:0,rotateX:0,rotateY:0,focus:arrival
    };
  });
  const skillStage = focus < 1.8 ? 0 : focus < 5.7 ? 1 : focus < 8.7 ? 2 : focus < 11.6 ? 3 : focus < 12.8 ? 4 : 5;
  return { chapter, locals, layers, skills, skillStage, ridgeGroup, processStep: Math.min(4, Math.floor(locals[1] * 5)), flagshipStep: Math.min(6, Math.floor(locals[2] * 7)) };
}

const domCache = new WeakMap();
function getNodes(root) {
  if (domCache.has(root)) return domCache.get(root);
  const world = root.querySelector('.my-build-world');
  if (!world) return null;
  const nodes = { world, layers: [...world.querySelectorAll('[data-build-layer]')], marks: [...world.querySelectorAll('[data-skill-mark]')], desk: [...world.querySelectorAll('[data-desk-object]')], modules: [...world.querySelectorAll('[data-flag-module]')], bilingual: [...world.querySelectorAll('[data-bzh]')], images: [...world.querySelectorAll('[data-alt-zh]')], language: null };
  domCache.set(root, nodes);
  return nodes;
}
function setText(element, value) { if (element && element.textContent !== value) element.textContent = value; }

export function updateBuild(root, progress, language = 'zh') {
  const nodes = getNodes(root);
  const state = buildState(progress);
  if (!nodes) return state;
  const english = language === 'en';
  if (nodes.language !== language) {
    nodes.bilingual.forEach(element => setText(element, english ? element.dataset.ben : element.dataset.bzh));
    nodes.layers.forEach((layer, index) => {
      const words=copy[language].stages[index===2?8:7];
      layer.querySelectorAll('.my-build-heading > small,.my-build-heading > h2,.my-build-heading > p').forEach((element, i)=>setText(element,words[i]));
    });
    nodes.images.forEach(element => element.alt = english ? element.dataset.altEn : element.dataset.altZh);
    nodes.marks.forEach(element => element.setAttribute('aria-label', element.dataset.labelName + ': ' + element.querySelector('.my-build-tooltip').textContent));
    nodes.language = language;
  }
  nodes.world.style.opacity = state.chapter < 0 ? '0' : '1';
  nodes.world.setAttribute('aria-hidden', String(state.chapter < 0));
  nodes.layers.forEach((layer, index) => {
    const enabled = state.layers[index] > .8;
    layer.style.opacity = String(state.layers[index]);
    layer.style.visibility = state.chapter === index ? 'visible' : 'hidden';
    layer.style.pointerEvents = enabled ? 'auto' : 'none';
    layer.setAttribute('aria-hidden', String(!enabled));
    layer.querySelectorAll('a').forEach(anchor => {
      const ready = enabled && state.locals[index] > .72;
      anchor.tabIndex = ready ? 0 : -1;
      anchor.style.opacity = String(ready ? 1 : 0);
      anchor.style.pointerEvents = ready ? 'auto' : 'none';
      anchor.setAttribute('aria-hidden', String(!ready));
    });
  });
  nodes.marks.forEach((element, index) => {
    const mark = state.skills[index];
    element.style.left = mark.x + '%';
    element.style.top = mark.y + '%';
    element.style.transform = `translate(-50%, -50%) translateZ(${mark.z}px) rotateX(${mark.rotateX}deg) rotateY(${mark.rotateY}deg) rotateZ(${mark.rotation}deg) scale(${mark.scale})`;
    element.style.opacity = String(mark.opacity);
    element.style.visibility = mark.opacity > .01 ? 'visible' : 'hidden';
    const enabled = state.layers[0] > .8 && mark.opacity > .55;
    element.tabIndex = enabled ? 0 : -1;
    element.style.pointerEvents = enabled ? 'auto' : 'none';
    element.setAttribute('aria-hidden', String(!enabled));
  });
  const stage = skillStages[state.skillStage];
  const ridgeNames=[['界面与服务','Interfaces & services'],['系统与交付','Systems & delivery'],['模型与算力','Models & compute']];
  setText(nodes.world.querySelector('.my-skill-index'), `0${state.ridgeGroup + 1} / 03`);
  setText(nodes.world.querySelector('.my-skill-stage-name'), ridgeNames[state.ridgeGroup][english?1:0]);
  setText(nodes.world.querySelector('.my-skill-stage-copy'), stage[english ? 2 : 1]);
  setText(nodes.world.querySelector('.my-process-stage-name'), processNames[state.processStep][english ? 1 : 0]);
  setText(nodes.world.querySelector('.my-flag-stage-name'), flagNames[state.flagshipStep][english ? 1 : 0]);
  nodes.desk.forEach((element, index) => {
    const distance = index - state.processStep;
    const active = distance === 0;
    element.style.opacity = active ? '1' : Math.abs(distance) === 1 ? '.18' : '0';
    element.style.visibility = Math.abs(distance) <= 1 ? 'visible' : 'hidden';
    element.style.setProperty('--desk-offset', String(distance));
    element.style.zIndex = active ? '3' : '1';
    element.setAttribute('aria-hidden', String(!active));
  });
  nodes.modules.forEach((element, index) => {
    const arrival = smooth((state.locals[2] * 7 - index) * 2);
    element.style.opacity = String(arrival * (index === state.flagshipStep ? 1 : .5));
    element.style.transform = `translate(${(1 - arrival) * 25}px, ${(1 - arrival) * 8}px)`;
    element.classList.toggle('is-current', index === state.flagshipStep);
    element.setAttribute('aria-hidden', String(arrival < .5));
  });
  const plate = nodes.world.querySelector('.my-flag-image');
  plate.style.setProperty('--flag-progress', String(state.locals[2]));
  plate.style.transform = `perspective(1100px) rotateY(${lerp(-13, -3, state.locals[2])}deg) rotateZ(${lerp(-3, -1, state.locals[2])}deg)`;
  return state;
}
