(() => {
  if(window.MoyuanI18n)return;
  const entries = {
    '序章':'Prologue',
    '首页':'Home','分类':'Categories','归档':'Archives','文章':'Writing','图库':'Gallery','精选画廊':'Curated gallery','随机次元':'Random art','游戏':'Games','小游戏':'Games','音乐':'Music','关于':'About','关于我':'About me','标签':'Tags','公告':'Notice','最新文章':'Recent posts','网站信息':'Site info',
    '✦ 探索星场':'✦ Explore stars','✕ 退出星场':'✕ Exit stars','打开终端':'Open terminal','关闭终端':'Close terminal','首页互动':'Home interactions','你好，我是墨鵷':"Hi, I'm Moyuan",'记录 · 探索 · 构建':'Record · Explore · Build','在代码与世界之间，':'Between code and the world,','保持好奇，持续生长。':'stay curious, and keep growing.','保持好奇，认真构建。':'stay curious and build with care.','LLM Systems · AI 安全 · Agent 工程':'LLM Systems · AI Safety · Agent Engineering','网络安全 · 密码学 · CTF · AI':'Cybersecurity · Cryptography · CTF · AI','阅读文章':'Read writing','查看项目':'View projects','墨鵷 · 保持好奇，认真生活':'Moyuan · Stay curious. Live fully.','技术、思考，和一点二次元。':'Code, ideas, and a little anime.','保持好奇，验证假设。':'Stay curious. Test your assumptions.','输入 help 查看命令，试试 cat flag。':'Type help for commands. Try cat flag.','执行 ↵':'Run ↵','终端命令':'Terminal command','浏览器模拟终端 · ↑↓ 历史 · Tab 补全 · Esc 关闭':'Browser shell · ↑↓ History · Tab Complete · Esc Close',
    '把思考，写下来。':'Ideas, put into words.','关于技术，也关于技术之外的世界。':'On technology, and the world beyond it.','阅读全文':'Read essay','查看完整归档':'Browse the archive','按时间阅读':'Read chronologically','让想法，发生。':'Bring ideas to life.','更多关于我':'More about me','与 AI，一起探索。':'Explore with AI.','从代码、推理到长文阅读，认识模型背后的不同探索。':'Explore different approaches to code, reasoning, and long-form reading.','社区同人 · 点击查看':'Fan art · Select to explore','暂时离开主线。':'Take a little detour.','这里也收藏旋律、像素和不期而遇。':'A collection of melodies, pixels, and happy discoveries.','音乐馆':'Music room','游戏室':'Arcade','光影集':'Visual archive','摄影：':'Photography:','给认真构建的日子，加一点可爱。':'A little playfulness for days spent building.','鲸鱼娘档案馆 ↗':'Whale-chan archive ↗','AI Girls 素材集 ↗':'AI Girls collection ↗','程序员历史上的今天':'Today in computing history','月份':'Month','日期':'Day','查询':'Search','今天':'Today','展开后加载历史事件。':'Expand to load historical events.','每天留一眼世界':'A daily window on the world','展开后加载今日热点。':'Expand to load today’s news.','阅读今日热点':'Read today’s news','小站公告':'Site notes','欢迎来到墨鵷的小站。这里记录技术实践，也留一点空间给音乐、游戏和日常的好奇心。':'Welcome to my corner of the web: a record of technical work, with room for music, games, and everyday curiosity.','认真生活，保持好奇。':'Live fully. Stay curious.','EDITORIAL NOTE / 片尾摘录':'EDITORIAL NOTE / Closing thoughts','我以为这是我经历的最艰难时候，多年以后才发现，这仅仅是开始。':'I thought this was the hardest time of my life. Years later, I realized it was only the beginning.','不要怕，坚持下去，坚持到最后的胜利。':'Do not be afraid. Keep going, all the way to the finish.',
    '在音乐里，找到另一个世界。':'Find another world in music.','歌词加载中...':'Loading lyrics…','今天的歌单已就绪':'Your playlist is ready','播放列表':'Playlist','搜索歌曲或歌手':'Search songs or artists','播放':'Play','暂停':'Pause','上一首':'Previous track','下一首':'Next track','开启声音':'Enable sound','关闭声音':'Mute sound','播放视频':'Play video','暂停视频':'Pause video','开启视频声音':'Enable video sound','关闭视频声音':'Mute video','播放进度':'Playback position','查看歌单':'View playlist','音量':'Volume','本地':'Local','云端':'Cloud','正在播放':'Playing','已暂停':'Paused','正在载入歌曲…':'Loading track…','正在解析云端音源…':'Resolving cloud audio…','正在获取云端音源…':'Resolving cloud audio…','正在载入本地母带音源...':'Loading local audio…','点击播放继续收听。':'Press play to continue listening.','已恢复上次歌曲，点击播放继续。':'Last track restored. Press play to continue.','音频加载失败，点击播放重试或切换歌曲。':'Audio could not load. Press play to retry or choose another track.','音源请求超时，请手动重试。':'The audio request timed out. Please retry.','未找到音源，请选择其他歌曲。':'No audio source found. Choose another track.','云端音源暂时不可用，请选择标有“本地”的歌曲。':'Cloud audio is unavailable. Choose a track marked Local.','音源暂时不可用，点击播放重试，或选择标有本地的歌曲。':'Audio is unavailable. Press play to retry or choose a Local track.','没有找到匹配的歌曲':'No matching tracks','无匹配歌曲':'No matching tracks','MELODY / 随身听':'MELODY / ON THE GO','随时听一首':'A song for the moment','边阅读，边听歌':'Listen while you read','打开音乐馆 ↗':'Open music room ↗','点击播放，默认选择可用的本地歌曲。':'Press play to start with an available local track.','展开音乐播放器':'Expand music player','收起播放器':'Collapse player','迷你音乐播放器':'Mini music player',
    '小游戏实验室':'The game lab','魔方练习台':'Cube studio','五子棋':'Gomoku','飞行萝卜':'Flying carrot','一笔连珠':'Aqua labyrinth','六花方块':'Rikka Tetris','一个都不能死':'No one left behind','扫雷':'Minesweeper','推箱子':'Sokoban','吃豆人':'Pac-Man','坦克大战':'Battle City','切积木':'Block cut','最强眼力':'Color challenge','← 返回游戏大厅':'← Back to arcade','重新开始':'Restart','游戏结束':'Game over','开始':'Start','重开':'Restart','旋转':'Rotate','硬降':'Hard drop','悔棋':'Undo','全屏':'Fullscreen','全屏练习':'Practice fullscreen','复位':'Reset','算法复原':'Solve cube','慢速':'Slow','标准':'Normal','快速':'Fast','新窗口打开':'Open in new tab','游戏说明 ☆':'How to play ☆','操作说明':'Controls','游戏目标':'Goal','得分规则':'Scoring','游戏特色':'Features','方向键滑动合并，压缩数组 + 满行检测判负':'Slide and merge tiles; array compression and game-over detection.','Kociemba 两阶段求解器，step-by-step 动画回放':'Kociemba two-phase solver with step-by-step playback.','Minimax + Alpha-Beta 剪枝，棋型评分引擎驱动 AI':'Minimax with alpha-beta pruning and pattern-based evaluation.','Three.js 3D 动画：TweenMax 循环 + OrbitControls 视角':'Three.js animation with TweenMax loops and OrbitControls.','哈密顿路径建模，事件驱动状态机 + Tilemap 碰撞':'Hamiltonian paths, event-driven state, and tilemap collisions.','小鸟游六花主题 Tetris：7-bag 随机、Hold、Ghost 与墙踢':'Rikka-themed Tetris with 7-bag randomization, hold, ghost, and wall kicks.','双通道 Canvas 渲染 + 渐进加速障碍生成 + 碰撞检测':'Dual-lane canvas rendering, accelerating obstacles, and collision detection.','Fisher-Yates 布雷 + BFS 递归展开连通区域':'Fisher-Yates mine placement and connected-area expansion.','数字编码地图 + 历史栈撤销 + 100 关预置图谱':'Encoded maps, stack-based undo, and 100 built-in levels.','Tile 地图 + 幽灵状态机（追逐/散开/逃跑）+ AABB 碰撞':'Tile maps, ghost states, and AABB collisions.','分层 Canvas 渲染 + 对象池子弹 + AABB 碰撞系统':'Layered canvas, pooled projectiles, and AABB collisions.','Box2D 物理模拟 + 鼠标轨迹多边形切割判定':'Box2D physics and pointer-driven polygon slicing.','HSL 色彩空间 + 指数衰减色差 + 随机位置算法':'HSL color space, decreasing color differences, and random placement.','这里是我用纯前端技术复刻的经典小游戏合集。每个游戏下方都记录了核心算法、数据结构与实现思路——不是游戏说明书的复读，而是写给同行看的「代码是怎么想的」。':'Classic games recreated for the browser. Each game includes notes on its algorithms, data structures, and implementation, showing how the code works.',
    'VISUAL ARCHIVE · 光影收藏':'VISUAL ARCHIVE','收藏一些，喜欢的画面。':'Keep the scenes you love.','二次元壁纸、城市夜景与 AI 同人收藏。保留完整画面，点击查看大图。':'Anime wallpapers, city nights, and AI fan art. Explore each image in its original composition.','精选收录:':'Collection:','核心主题:':'Themes:','托管形式:':'Hosting:','极速直链':'Direct links','图床格式:':'Format:','Markdown 一键调用':'Copy as Markdown','随机次元生成中':'Random artwork','次元跃迁缓冲中...':'Loading artwork…','随机图片 · 实时图床直链':'Random image · Direct link','🎲 随机次元 · 动漫壁纸直链 API':'🎲 Discover a random anime wallpaper','自适应高清二次元壁纸 API，每次调用实时重定向至一张全新精美动漫插画。随时用于外链图床、博客封面、随机背景或 Markdown 引用。':'Discover another illustration with each request. Preview the full image or copy its link for your collection.','复制直链':'Copy link','换一张':'Another image','复制 Markdown':'Copy Markdown','全屏查看':'View fullscreen','已复制！':'Copied!','查看大图':'View full image','下载原图':'Download original','复制外链':'Copy image link','关闭':'Close','搜索壁纸或封面...':'Search wallpapers or covers…','壁纸收藏':'Wallpapers','城市夜景':'City nights','AI 同人':'AI fan art','全部':'All','角色专题':'Characters','同人插画':'Fan art','日间 · 首页收藏':'Daylight · Wallpaper','夜间 · 首页收藏':'Nightfall · Wallpaper','旋律 · 音乐馆收藏':'Melody · Wallpaper','夜色中的日式街巷':'A Japanese lane at night','霓虹灯下的涩谷街口':'Neon at a Shibuya intersection','安静的日本夜间街道':'A quiet Japanese street at night',
    '社会为什么总在劝你合群？因为“我们”是最便宜的组织方式':'Why does society ask us to fit in? “We” is the cheapest way to organize.','什么都能解释的理论，跟“啥都能圆”的算命有啥区别？':'If a theory explains everything, what sets it apart from fortune-telling?','网上那么多“上岸经验”，到底有多少是在事后编故事？':'How much online success advice is a story written after the fact?','依赖定价机制：全球化越深，为什么世界反而开始造“第二套系统”？':'The price of dependence: why a globalized world builds backup systems.',
    'AIGC 内容安全':'AIGC Safety','证据驱动的 AI 审稿工作台，让每一条评审意见都能回到原文。':'An evidence-driven AI review workspace that traces feedback back to the source.','面向昇腾 NPU 的 OCR 模型适配与评测，连接模型能力与国产算力。':'OCR adaptation and evaluation on Ascend NPUs, connecting models with hardware.','多模态内容检测与审计，用可解释的证据支持安全判断。':'Multimodal content detection and auditing with interpretable evidence.',
    '一个共同的名字，如何让陌生人开始协作？从校友、同好到推荐算法，重新审视归属感带来的连接，以及它悄悄转移的代价。':'How does a shared identity help strangers cooperate? Explore the connections it creates and the costs it quietly shifts.','解释得通，不等于经得起检验。让现实有机会说“不”，才是知识继续生长的起点。':'A plausible explanation is not necessarily a testable one. Knowledge grows when reality is allowed to say no.','当偶然被整理成必然，经验就变成了故事。如何从成功叙事中找回条件、概率与边界？':'When chance becomes inevitability, experience turns into a story. Recover the conditions, probabilities, and limits.','效率之外，系统为什么需要第二种选择？从全球分工与依赖关系，理解冗余的价值。':'Why do systems need a second option? Explore the value of redundancy beyond efficiency.'
  };
  entries['记录 · 探索 · 构建'] = 'Record · Explore · Build';
  entries['3D 作品集'] = '3D Portfolio';
  Object.assign(entries,{
    'DeepSeek · 从推理、代码到开放模型研究。这里关注问题如何拆解、结论如何验证，以及模型如何进入真实工程流程。':'DeepSeek · Reasoning, coding, and open-model research: breaking down problems, checking conclusions, and bringing models into engineering workflows.',
    'GLM · 中文问答、代码与智能体应用。阅读文档、组织工具调用和验证输出，是理解这类模型的三个入口。':'GLM · Chinese-language assistance, coding, and agents. Explore document reading, tool orchestration, and output validation.',
    '用拟人角色记录 AI 社区的日常：写代码、读论文、整理资料，也会遇到幻觉、上下文遗漏和工具调用失败。欣赏创作之外，更重要的是保持验证习惯。':'A playful view of the AI community: coding, reading papers, and organizing information, alongside hallucinations, missing context, and failed tool calls. Enjoy the art, and keep checking the results.',
    'GLM · 日常使用中，明确任务背景、输入约束和验收条件，往往比反复追加一句“再想想”更有效。':'GLM · Clear context, input constraints, and acceptance criteria usually help more than repeatedly asking a model to think harder.',
    'GLM · 模型给出的建议需要经过运行、测试与来源核对。把回答变成可检查的结果，才算完成一次协作。':'GLM · Run, test, and check sources before accepting model suggestions. Collaboration ends with a result you can verify.',
    'Grok · 关注对话、信息探索与多模态交互。面对实时信息，应同时检查原始来源、时间与上下文。':'Grok · Conversation, information discovery, and multimodal interaction. Check original sources, dates, and context for current information.',
    'Kimi · 长文阅读与资料整理。把问题对应到具体段落，区分原文证据与模型推断，能让阅读辅助更可靠。':'Kimi · Long-form reading and information organization. Tie questions to source passages and distinguish evidence from model inference.',
    '（原作：上善无形、ZipZipPipe）。其余原图：':' (original creators: 上善无形 and ZipZipPipe). Other artwork: ',
    'LINUX DO · soeur 及原帖创作者':'LINUX DO · soeur and the original contributors',
    '。非官方同人，版权归各自作者。':'. Unofficial fan art. Rights remain with the original creators.',
    '鲸鱼娘原作：上善无形 · 二次设计：ZipZipPipe · 整理：EDMOK。':'Original Whale-chan: 上善无形 · Redesign: ZipZipPipe · Collection: EDMOK.','，非官方同人。':', unofficial fan art.',
    '浅色氛围的二次元壁纸。点击预览完整构图。':'A light-toned anime wallpaper. Open the preview for the full composition.',
    '深色氛围的二次元壁纸。原图展示，不裁切人物。':'A dark-toned anime wallpaper, shown without cropping the character.',
    '音乐馆的全景背景。用画面与旋律留住片刻。':'The panoramic backdrop of the music room, bringing imagery and melody together.',
    'AI 社区的拟人形象与表情创作。保留原图展示，点击可查看完整画面。':'Character interpretations and expressive artwork from the AI community. Open an image to see the full composition.',
    '合并到 2048，你能做到吗？':'Can you merge your way to 2048?',
    '用方向键或滑动移动方块，相同数字碰在一起会合并。不断叠加，直到拼出 2048。':'Use arrow keys or swipe to move tiles. Matching numbers merge. Keep combining them until you reach 2048.',
    '为什么有时候滑了没反应？':'Why did that move do nothing?',
    '操作前后棋盘状态完全相同时，不会生成新方块——这一步对局面没有意义。':'If the board does not change, no new tile appears. Only moves that change the position count.',
    '双击魔方开始打乱':'Double-click the cube to scramble',
    '双击魔方开始':'Double-click the cube to begin',
    '点击「算法复原」，看魔方自己转回去':'Select Solve cube to watch the solution',
    '得分':'Score','最高':'Best','行数':'Lines','等级':'Level','黑棋':'Black','白棋':'White','人机对战':'Play against AI','双人对战':'Two players','正在思考...':'Thinking…',
    '点击页面后开始播放':'Click to begin playback','正在缓冲音频...':'Buffering audio…','正在准备播放...':'Preparing playback…',
    '历史事件暂时无法加载，请点击“今天”或“查询”重试。':'History is unavailable. Select Today or Search to retry.',
    '正在查询历史事件…':'Loading historical events…','这一天暂时没有收录的事件。':'No events are listed for this day.',
    '今日热点':'Today’s news','今日热点暂时无法加载，稍后重新展开可重试。':'News is unavailable. Close and reopen this section to retry.',
    '图片暂时加载失败，已保留当前图片，请稍后再试。':'The new image could not load. Your current image has been kept; please try again later.'
  });
  let language='zh';try{language=localStorage.getItem('moyuan-ui-language')==='en'?'en':'zh';}catch{}
  const originals=new WeakMap(), attributes=new WeakMap();
  function english(text){
    if(window.MoyuanPostTitles?.[text])return window.MoyuanPostTitles[text];
    if(entries[text])return entries[text];
    let m;if((m=text.match(/^(\d+) 首$/)))return m[1]+' tracks';
    if((m=text.match(/^(\d+) 张$/)))return m[1]+' images';
    if((m=text.match(/^(\d+) 大分类$/)))return m[1]+' categories';
    if((m=text.match(/^(全部|壁纸收藏|城市夜景|AI 同人)\s*\((\d+)\)$/)))return entries[m[1]]+' ('+m[2]+')';
    if((m=text.match(/^AI (图鉴|形象收藏) (\d+)$/)))return 'AI collection '+m[2];
    if((m=text.match(/^今天的歌单已就绪 (\(.*\))$/)))return 'Playlist ready '+m[1];
    if((m=text.match(/^摄影：(.*?) \/ Unsplash。霓虹与街巷，记录城市入夜后的另一种节奏。$/)))return 'Photo: '+m[1]+' / Unsplash. Neon and quiet lanes reveal the city’s after-dark rhythm.';
    if((m=text.match(/^(AI 图鉴 \d+|GLM · 日常|GLM · 表情|DeepSeek|Grok|Kimi) · (.+)$/))&&entries[m[2]])return english(m[1])+' · '+entries[m[2]];
    return text;
  }
  Object.assign(entries,{
    '在代码与世界之间，':'Somewhere between code and the world',
    '保持好奇，持续生长。':'I stay curious, and keep building',
    '阅读文章':'Read essays',
    '按时间阅读':'Browse by date',
    '探索星场':'Explore the starfield',
    '✦ 探索星场':'✦ Explore the starfield'
  });
  let sourceTitle=document.title,renderedTitle=document.title;
  function apply(){
    observer.disconnect();
    document.documentElement.dataset.uiLang=language;document.documentElement.lang=language==='en'?'en':'zh-CN';
    if(document.title!==renderedTitle)sourceTitle=document.title;
    const parts=sourceTitle.split(' | ');
    renderedTitle=language==='en'?[english(parts[0]),...parts.slice(1)].join(' | '):sourceTitle;
    if(document.title!==renderedTitle)document.title=renderedTitle;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,textarea,code,pre,[data-language],#post #article-container,#playlist,.mm-list,#track-title,#track-artist'))continue;
      const old=originals.get(node);let source=old&&node.nodeValue===old.rendered?old.source:node.nodeValue;
      const trimmed=source.trim();if(!trimmed)continue;
      const output=language==='en'?source.replace(trimmed,english(trimmed)):source;
      originals.set(node,{source,rendered:output});if(node.nodeValue!==output)node.nodeValue=output;
    }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{
      if(el.closest('[data-language],#post #article-container'))return;
      const old=attributes.get(el)||{};
      for(const key of ['placeholder','aria-label','title']){if(!el.hasAttribute(key))continue;const now=el.getAttribute(key),item=old[key];const source=item&&now===item.rendered?item.source:now;const output=language==='en'?english(source):source;old[key]={source,rendered:output};if(now!==output)el.setAttribute(key,output);}
      attributes.set(el,old);
    });
    let button=document.querySelector('#ui-language-toggle');
    if(!button&&document.querySelector('#nav')){button=document.createElement('button');button.id='ui-language-toggle';button.type='button';document.querySelector('#nav').append(button);button.onclick=()=>setLanguage(language==='zh'?'en':'zh');}
    if(button){button.textContent=language==='zh'?'EN':'中文';button.setAttribute('aria-label',language==='zh'?'Switch to English':'切换为中文');}
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  }
  let pending=false;
  const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;apply();});}});
  function setLanguage(value){language=value;try{localStorage.setItem('moyuan-ui-language',value);}catch{}apply();window.dispatchEvent(new CustomEvent('moyuan:language',{detail:value}));}
  window.MoyuanI18n={t:text=>language==='en'?english(text):text,get language(){return language;},setLanguage,refresh:apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  document.addEventListener('pjax:complete',apply);
})();
