export const clamp = x => Math.max(0, Math.min(1, x));
export const ease = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
export const pulse = (a,b,c,d,t) => ease(a,b,t) * (1-ease(c,d,t));
export const beats = [0,.13,.23,.37,.49,.57,.65,.91];
export function worldProgress(t){const a=[0,.13,.23,.37,.49,.57,.65,.90,.96,1],b=[0,.18,.28,.45,.65,.73,.81,.87,.94,1];let i=0;while(i<a.length-2&&t>a[i+1])i++;return b[i]+(b[i+1]-b[i])*clamp((t-a[i])/(a[i+1]-a[i]));}
export function projectAt(t){return Math.min(2,Math.max(0,Math.floor((t-.84)/(.07/3))));}
// The second movement has its own cadence: capability field, working process,
// one flagship question, then three concrete projects.
export function buildChapterAt(t){
  if(t<.65||t>=.91)return -1;
  if(t<.725)return 0;
  if(t<.78)return 1;
  if(t<.84)return 2;
  return 3+projectAt(t);
}
export function stageAt(t) { let i=0; while(i<beats.length-1 && t>=beats[i+1])i++; return i; }
// Copy can turn a page within an animation without changing its scene timing.
const proseBeats = [0,.13,.23,.37,.49,.57,.61,.65,.78,.84,.91];
export function proseChapterAt(t) { let i=0; while(i<proseBeats.length-1 && t>=proseBeats[i+1])i++; return i; }
export function cameraAt(t, aspect=1.778) {
  const fit=Math.max(1,1.25/aspect), close=pulse(.23,.29,.32,.40,t), feather=pulse(.41,.47,.50,.55,t);
  const travel=pulse(.59,.70,.78,.88,t);
  return {x:-.42*close+.25*feather+.08*travel,y:.2*close+.12*feather,
    z:(1.62-.97*close-.68*feather-.12*travel)*fit, targetZ:-.12*travel};
}
export const copy = {
  zh: {
    stages:[['00 / 水境','墨鵷','择善而栖，向远而生。'],['01 / 穿云','从一念而起。','墨，流向更远处。'],['02 / 墨鵷','向远而生。','在智能与安全之间，构建系统。'],['03 / 羽化','始于好奇。','羽翼散开，形态改变。'],['04 / 信号','循迹而行。','每一缕信号，都有它的方向。'],['05 / 智能','信号，汇成结构。','连接模型、上下文与推理。'],['06 / 安全','边界，在扰动中显现。','以证据重新建立信任。'],['07 / 作品','想法，成为作品。','从抽象结构，回到真实构建。'],['08 / 墨鵷','记录世界，','也构建一点世界。'],['09 / 归栖','墨，是表达。','鵷，是方向。']],
    signal:['词元','上下文','路由','推理'],network:['大模型系统','长上下文','推理加速','昇腾 NPU'],security:['模型','工具','证据','风险'],
    detail:['Qwen3-235B','HSP Compression','Ascend 910C','AIGC'],
    skip:'进入主页',stars:'探索星场',terminal:'打开终端',replay:'重播序章',scroll:'继续',brand:'墨鵷 · 亦作墨鸢',
    project:['01 / 内容安全 · 审计','AIGC 内容安全','多模态内容检测与审计，用可解释的证据支持安全判断。','查看项目'],risk:'提示词注入',
  },
  en: {
    stages:[['00 / WATER','MOYUAN','Choose with care. Grow toward distant skies.'],['01 / CLOUD','From a single thought.','Ink finds a way beyond.'],['02 / MOYUAN','Toward farther skies.','I build systems between intelligence and security.'],['03 / FEATHER','It begins with curiosity.','The form changes. The curiosity stays.'],['04 / SIGNAL','Follow the signal.','Every thread finds its direction.'],['05 / INTELLIGENCE','Signals become structure.','Models, context, and inference, connected.'],['06 / SECURITY','Boundaries emerge under pressure.','Rebuilding trust through evidence.'],['07 / PROJECTS','Ideas become things.','From abstract structures to real systems.'],['08 / MOYUAN','To record the world,','and build a little of it.'],['09 / HOME','Ink is expression.','Flight is direction.']],
    signal:['TOKENS','CONTEXT','ROUTING','INFERENCE'],network:['LLM SYSTEMS','LONG CONTEXT','INFERENCE','ASCEND NPU'],security:['MODEL','TOOL','EVIDENCE','RISK'],
    detail:['Qwen3-235B','HSP Compression','Ascend 910C','AIGC'],
    skip:'Enter home',stars:'Explore stars',terminal:'Open terminal',replay:'Replay intro',scroll:'Continue',brand:'MOYUAN · PERSONAL SPACE',
    project:['01 / AI SAFETY · AUDIT','AIGC Safety','Multimodal content detection and auditing with interpretable evidence.','View project'],risk:'Prompt injection',
  },
};
// Brand narrative and project copy share one language boundary.
copy.zh.stages=[
  ['00 / 水境','择善而栖\n向远而生','一滴墨落进水里\n涟漪替它去往远处'],
  ['01 / 好奇','始于好奇','有些答案\n要先靠近世界'],
  ['02 / 探索','循迹而行','一片羽毛留下方向\n风把路带向更深处'],
  ['03 / 结构','在复杂中\n看见结构','看似无序\n也有脉络可循'],
  ['04 / 技能','技能不是收藏','学得越多\n越要知道什么值得生长'],
  ['05 / 证据','不是所有信号\n都值得相信','留下证据\n再作判断'],
  ['06 / 边界','边界\n在判断中显现','承认不确定\n才能看见边界'],
  ['07 / 构建','工具很多\n方向只有一个','工具会更替\n系统要真正落地'],
  ['08 / 问题','一张图\n是真是假','从一次判断\n长成一套系统'],
  ['09 / 作品','想法\n成为作品','把方法交给现实\n让结果经得起使用'],
  ['10 / 墨鵷','记录世界\n也构建一点世界','墨是表达\n鵷是方向']
];
copy.en.stages=[
  ['00 / WATER','Choose where to belong\nGrow toward wider skies','A drop of ink meets water\nRipples carry it on'],
  ['01 / CURIOSITY','It begins with curiosity','Some answers only appear\nwhen you move closer'],
  ['02 / EXPLORE','Follow the traces','A feather marks the way\nThe wind pulls us deeper'],
  ['03 / STRUCTURE','Find structure\nin complexity','What looks like noise\nmay still have a pattern'],
  ['04 / SKILLS',"Skills aren't collectibles",'The more you learn\nthe more carefully you choose what to grow'],
  ['05 / EVIDENCE','Not every signal\ndeserves your trust','Keep the evidence\nthen make the call'],
  ['06 / BOUNDARY','Boundaries take shape\nthrough judgment','Leave room for uncertainty\nbefore drawing the line'],
  ['07 / BUILD','Many tools\none direction','Tools come and go\nsystems have to work'],
  ['08 / QUESTION','One image\nreal or fabricated','A single question\ngrowing into a system'],
  ['09 / WORK','Ideas\nmade real','Put the method to work\nlet reality test the result'],
  ['10 / MOYUAN','Observe the world\nleave something built behind','Ink leaves the trace\nDirection carries it onward']
];
copy.zh.projects=[['01 / 原文 · 证据 · 评审','PeerAssist','判断，需要回到原文。','PDF 范围阅读、引用核查与人工确认，让评审意见可以追溯。',['PDF 原文','论点','证据','评审']],['02 / 模型 · 系统 · 算力','Unlimited-OCR','让模型，落到真实算力之上。','面向昇腾 NPU 的 OCR 模型适配与评测，连接模型能力与国产算力。',['模型','CUDA','torch_npu','昇腾']],['03 / 内容 · 证据 · 审计','AIGC 内容安全','不只给出判断，也说明为什么。','汇集视觉、文字与溯源证据，区分内容风险与生成来源，留下可复核的审计报告。',['内容','视觉证据','文字证据','审计']]];
copy.en.projects=[['01 / SOURCE · EVIDENCE · REVIEW','PeerAssist','Judgment returns to the source.','PDF range reading, citation checks and human confirmation make a review traceable.',['PDF','Claim','Evidence','Review']],['02 / MODEL · SYSTEM · COMPUTE','Unlimited-OCR','Bring models to real hardware.','OCR model adaptation and evaluation on Ascend NPU, connecting model capability with infrastructure.',['Model','CUDA','torch_npu','Ascend']],['03 / CONTENT · EVIDENCE · AUDIT','AIGC Safety','Not only a verdict. A reason.','Bring visual, textual and provenance evidence together. Separate content risk from origin, and keep a reviewable audit trail.',['Content','Visual evidence','Text evidence','Audit']]];
copy.zh.paths=['记录','探索','构建'];copy.en.paths=['RECORD','EXPLORE','BUILD'];
copy.zh.brand='墨鵷 · 个人空间';copy.en.brand='PERSONAL SPACE';
copy.zh.signal=['上下文','推理','智能体','工具','模型'];copy.en.signal=['CONTEXT','INFERENCE','AGENT','TOOL','MODEL'];
copy.zh.evidence=['原文','日志','图像','模型输出','工具调用'];copy.en.evidence=['SOURCE','LOG','IMAGE','MODEL OUTPUT','TOOL CALL'];
export const topology=[{role:'model',p:[.48,.3,-.15],r:.10},{role:'evidence',p:[.18,.03,.05],r:.032},{role:'risk',p:[.85,.02,-.14],r:.036},{role:'tool',p:[.35,.49,-.45],r:.018},{role:'agent',p:[.94,.39,-.65],r:.022},{role:'data',p:[.06,.38,-.8],r:.013},{role:'archive',p:[.62,-.13,-.75],r:.015}];
export const relations=[[1,0,1],[0,2,1],[3,0,.25],[4,2,.25],[5,1,.07],[1,6,.07]];
