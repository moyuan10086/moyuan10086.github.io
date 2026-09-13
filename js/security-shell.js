/* Virtual filesystem only: input is never evaluated as JavaScript or OS commands. */
(function (root) {
  'use strict';
  const files = {
    '/home/guest/about.txt': '墨鸢 / Moyuan\n网络空间安全 · 密码学 · CTF · AI 安全\n保持好奇，验证假设，以证据构建判断。',
    '/home/guest/flag': 'flag{stay_curious_verify_everything}\n[✓] Flag captured. 欢迎来到我的安全实验室。',
    '/home/guest/notes/README.md': '这里记录 Web 安全、密码学与 AI 安全实践。\n输入 open writing 阅读文章，open projects 查看项目。',
    '/home/guest/projects.txt': 'PeerAssist — 证据驱动的 AI 审稿\nUnlimited-OCR — NPU 适配与评测\nAIGC Safety — 内容安全审计',
    '/home/guest/.hint': '不需要提权。真正的线索，一直在当前目录。cat flag'
  };
  const aiSites = {
    deepseek:{name:'DeepSeek',url:'https://chat.deepseek.com/'},
    doubao:{name:'豆包',url:'https://www.doubao.com/chat/'},
    gemini:{name:'Gemini',url:'https://gemini.google.com/app'},
    chatgpt:{name:'ChatGPT',url:'https://chatgpt.com/'},
    claude:{name:'Claude',url:'https://claude.ai/'}
  };
  const aliases = {'豆包':'doubao','深度求索':'deepseek',gpt:'chatgpt'};
  function aiResult(name) {
    if(!name || name==='list') return {output:'AI 入口：deepseek · doubao · gemini · chatgpt · claude\n用法：ai deepseek（也支持 open deepseek）',links:Object.values(aiSites)};
    const key=aliases[name.toLowerCase()]||name.toLowerCase();
    return aiSites[key] ? {output:'点击链接，在新标签页打开 '+aiSites[key].name+'：',links:[aiSites[key]]} : {output:'未找到这个 AI。输入 ai 查看可用入口。'};
  }
  class SecurityShell {
    constructor() { this.cwd = '/home/guest'; }
    path(value = '.') {
      if (value === '~') return '/home/guest';
      const parts = (value.startsWith('/') ? value : this.cwd + '/' + value).split('/');
      const result = [];
      for (const p of parts) { if (p === '..') result.pop(); else if (p && p !== '.') result.push(p); }
      return '/' + result.join('/');
    }
    directory(p) { return Object.keys(files).some(f => f.startsWith(p === '/' ? '/' : p + '/')); }
    run(input) {
      const [command, ...args] = input.trim().split(/\s+/);
      const text = output => ({output});
      if (!command) return text('');
      if (input.length > 240) return text('命令过长。');
      switch (command) {
        case 'help': return text('help  whoami  pwd  ls [-a] [目录]  cd [目录]\ncat <文件>  echo <文本>  clear  date  uname\nai [名称] — 查看 AI 官方入口\nopen writing|projects|music|about\nexit\n提示：cat flag');
        case 'ai': return aiResult(args[0]);
        case 'whoami': return text('guest — 探索者\n站长：Moyuan / 墨鸢 · 网络空间安全');
        case 'pwd': return text(this.cwd);
        case 'uname': return text('Moyuan Security Lab / Browser Shell 1.0');
        case 'date': return text(new Date().toLocaleString('zh-CN'));
        case 'echo': return text(args.join(' '));
        case 'clear': return {clear:true};
        case 'exit': return {exit:true};
        case 'cd': {
          const target = this.path(args[0] || '~');
          if (!this.directory(target)) return text('cd: 目录不存在: ' + target);
          this.cwd = target; return text('');
        }
        case 'ls': {
          const hidden = args.includes('-a');
          const target = this.path(args.find(a => !a.startsWith('-')) || '.');
          if (!this.directory(target)) return text('ls: 目录不存在: ' + target);
          const prefix = target === '/' ? '/' : target + '/';
          const names = [...new Set(Object.keys(files).filter(f => f.startsWith(prefix)).map(f => { const rest=f.slice(prefix.length); return rest.split('/')[0] + (rest.includes('/') ? '/' : ''); }))];
          return text(names.filter(n => hidden || !n.startsWith('.')).join('  '));
        }
        case 'cat': {
          if (!args.length) return text('用法：cat <文件>');
          const paths = args.map(a => this.path(a));
          return {output:paths.map(p => files[p] ?? 'cat: 文件不存在: ' + p).join('\n'),flag:paths.includes('/home/guest/flag')};
        }
        case 'open': {
          const key=(args[0]||'').toLowerCase();
          if(aiSites[key]||aliases[key])return aiResult(key);
          const routes = {writing:'/posts/',projects:'/#research-projects',music:'/music/',about:'/about/'};
          return routes[args[0]] ? {navigate:routes[args[0]]} : text('用法：open writing|projects|music|about，或输入 ai 查看 AI 入口');
        }
        default: return text(command + ': 未找到命令。输入 help 查看可用命令。');
      }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = SecurityShell;
  else root.MoyuanSecurityShell = SecurityShell;
})(typeof window === 'undefined' ? globalThis : window);
