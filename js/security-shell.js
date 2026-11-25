/* Virtual filesystem & Kali QTerminal command processor:
   Input is evaluated only against virtual commands in browser context. */
(function (root) {
  'use strict';

  const files = {
    '/home/guest/about.txt': '墨鵷 / Moyuan\n网络空间安全 · 密码学 · CTF · AI 安全 · Agent 工程\n保持好奇，验证假设，以证据构建判断。',
    '/home/guest/flag': 'flag{stay_curious_verify_everything_kali}\n[✓] Flag captured. 恭喜攻破安全挑战，欢迎探索 Moyuan 赛博空间！',
    '/home/guest/notes/README.md': '这里记录 Web 安全、密码学与 AI 安全工程实践。\n输入 open writing 阅读文章，open score 体验光轨音谱，open hello 环游世界，或输入 tools 开启安全工具箱。',
    '/home/guest/notes/ctf_tips.txt': '1. 善用 nmap 探测隐藏端口。\n2. flag 藏在熟悉的文件系统里。\n3. 可直接运行 base64 / hex / rot13 / jwt 分析可疑载荷。',
    '/home/guest/projects.txt': '1. PeerAssist — 证据驱动的 AI 审稿工作台\n2. Unlimited-OCR — 面向国产 NPU 的适配与评测\n3. AIGC Safety — 多模态内容安全与可解释审计',
    '/home/guest/.hint': '不需要提权。真正的线索一直在当前目录。试试 tree、cat flag 或执行 nmap'
  };

  const aiSites = {
    deepseek: { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
    doubao: { name: '豆包', url: 'https://www.doubao.com/chat/' },
    gemini: { name: 'Gemini', url: 'https://gemini.google.com/app' },
    chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com/' },
    claude: { name: 'Claude', url: 'https://claude.ai/' }
  };

  const extendedAiSites = {
    kimi: { name: 'Kimi', url: 'https://www.kimi.com/' },
    qwen: { name: '通义千问', url: 'https://qwen.ai/' },
    grok: { name: 'Grok', url: 'https://x.ai/' },
    glm: { name: '智谱 GLM', url: 'https://chatglm.cn/' },
    minimax: { name: 'MiniMax 海螺', url: 'https://hailuoai.com/' },
    hunyuan: { name: '腾讯混元', url: 'https://yuanbao.tencent.com/' },
    ernie: { name: '文心一言', url: 'https://yiyan.baidu.com/' },
    llama: { name: 'Meta Llama', url: 'https://www.llama.com/' }
  };

  const aliases = { '豆包': 'doubao', '深度求索': 'deepseek', gpt: 'chatgpt', seed: 'doubao', '千问': 'qwen', '智谱': 'glm', '混元': 'hunyuan', '文心': 'ernie' };

  function aiResult(name) {
    if (!name || name === 'list') {
      return {
        output: '可用 AI 官方矩阵：\ndeepseek · doubao · gemini · chatgpt · claude (另支持 kimi, qwen, grok)\n用法示例：ai deepseek',
        links: Object.values(aiSites)
      };
    }
    const key = aliases[name.toLowerCase()] || name.toLowerCase();
    const site = aiSites[key] || extendedAiSites[key];
    return site
      ? { output: '点击链接在新标签页启动 ' + site.name + '：', links: [site] }
      : { output: '未找到该 AI 入口。输入 ai 查看完整列表。' };
  }

  // 1:1 Authentic Kali Dragon ASCII from Neofetch / Fastfetch
  const DRAGON_ART_LINES = [
    "..............",
    "            ..,;:ccc,.",
    "          ......''';lxO.",
    ".....''''..........,:ld;",
    "           .';;;:::;,,.x*",
    "      ..'''.            0Xxoc:,.  ...",
    "  ...*/x....            ,ONkc;,;cok0dc',.",
    "    .                   OMo         ':ddo.",
    "                        dMc            :00;",
    "                        0M.              .:0.",
    "                        ;Wd",
    "                         ;XO,",
    "                           ,d00dlc;,..",
    "                              ..',;:cd00d::,.",
    "                                     .:d;.'::.",
    "                                       'd,    '",
    "                                        ;l",
    "                                         .0",
    "                                           c",
    "                                            ."
  ];

  const DETAILS_LINES = [
    "kali@kali",
    "---------",
    "OS: Kali GNU/Linux Rolling",
    "Host: Moyuan Cyber Lab Workstation",
    "Kernel: 6.12.25-amd64",
    "Uptime: 42 days, 13 hours, 37 mins",
    "Packages: 310 (hexo blog articles)",
    "Shell: zsh 5.9 (x86_64-debian-linux-gnu)",
    "Resolution: 1920x1080",
    "DE: Xfce 4.18",
    "WM: Xfwm4",
    "WM Theme: Kali-Dark",
    "Theme: Kali-Dark [GTK2/3]",
    "Icons: Flat-Remix-Blue-Dark",
    "Terminal: qterminal",
    "CPU: AMD Ryzen 9 7950X (16) @ 4.50GHz",
    "Memory: 2048MiB / 65536MiB",
    "",
    "[■][■][■][■][■][■][■][■]",
    "[■][■][■][■][■][■][■][■]"
  ];

  const KALI_NEOFETCH_RAW = DRAGON_ART_LINES.map((line, idx) => {
    const right = DETAILS_LINES[idx] || '';
    return line.padEnd(48, ' ') + right;
  }).join('\n');

  const KALI_NEOFETCH_HTML = `<div class="neofetch-wrapper">
  <pre class="neofetch-art">${DRAGON_ART_LINES.join('\n')}</pre>
  <div class="neofetch-info">
    <div class="nf-user-title"><span class="nf-user">kali</span><span class="nf-at">@</span><span class="nf-host">kali</span></div>
    <div class="nf-dash">---------</div>
    <div class="nf-row"><span class="nf-key">OS:</span> <span class="nf-val">Kali GNU/Linux Rolling</span></div>
    <div class="nf-row"><span class="nf-key">Host:</span> <span class="nf-val">Moyuan Cyber Lab Workstation</span></div>
    <div class="nf-row"><span class="nf-key">Kernel:</span> <span class="nf-val">6.12.25-amd64</span></div>
    <div class="nf-row"><span class="nf-key">Uptime:</span> <span class="nf-val">42 days, 13 hours, 37 mins</span></div>
    <div class="nf-row"><span class="nf-key">Packages:</span> <span class="nf-val">310 (hexo blog articles)</span></div>
    <div class="nf-row"><span class="nf-key">Shell:</span> <span class="nf-val">zsh 5.9 (x86_64-debian-linux-gnu)</span></div>
    <div class="nf-row"><span class="nf-key">Resolution:</span> <span class="nf-val">1920x1080</span></div>
    <div class="nf-row"><span class="nf-key">DE:</span> <span class="nf-val">Xfce 4.18</span></div>
    <div class="nf-row"><span class="nf-key">WM:</span> <span class="nf-val">Xfwm4</span></div>
    <div class="nf-row"><span class="nf-key">WM Theme:</span> <span class="nf-val">Kali-Dark</span></div>
    <div class="nf-row"><span class="nf-key">Theme:</span> <span class="nf-val">Kali-Dark [GTK2/3]</span></div>
    <div class="nf-row"><span class="nf-key">Icons:</span> <span class="nf-val">Flat-Remix-Blue-Dark</span></div>
    <div class="nf-row"><span class="nf-key">Terminal:</span> <span class="nf-val">qterminal</span></div>
    <div class="nf-row"><span class="nf-key">CPU:</span> <span class="nf-val">AMD Ryzen 9 7950X (16) @ 4.50GHz</span></div>
    <div class="nf-row"><span class="nf-key">Memory:</span> <span class="nf-val">2048MiB / 65536MiB</span></div>
    <div class="nf-palette-blocks">
      <div class="nf-block-row">
        <span class="pblk-0"></span><span class="pblk-1"></span><span class="pblk-2"></span><span class="pblk-3"></span><span class="pblk-4"></span><span class="pblk-5"></span><span class="pblk-6"></span><span class="pblk-7"></span>
      </div>
      <div class="nf-block-row">
        <span class="pblk-8"></span><span class="pblk-9"></span><span class="pblk-10"></span><span class="pblk-11"></span><span class="pblk-12"></span><span class="pblk-13"></span><span class="pblk-14"></span><span class="pblk-15"></span>
      </div>
    </div>
  </div>
</div>`;

  // Canonical Metasploit Framework Logos from data/logos/
  const MSF_LOGOS = [
    {
      name: 'metasploit-shield',
      text: `  ______________________________________________________________________________
 |                                                                              |
 |                               Metasploit                                     |
 |                                                                              |
 |____________-[ Programming: HD Moore, spoonm, et al. ]-______________________|
 |____________-[ Metasploit Community & Rapid7 ]-______________________________|
                                                                
                  .,,.                  .                                       
                .ck00kdc.             .xOxc.                                    
               'd0000000x'           ;k0000d.                                   
              .d000000000k;        .ck000000o.                                  
              :000000000000;       ;k00000000o                                  
              ;000000000000d.     ;k000000000d                                  
              ,0000000000000c    :00000000000o                                  
              .k0000000000000l  ;000000000000:                                  
               c00000000000000;:000000000000;                                   
                o0000000000000k000000000000l                                    
                .d000000000000000000000000o.                                    
                 .o0000000000000000000000x.                                     
                   ;k0000000000000000000c                                       
                    .d0000000000000000o.                                        
                      :k0000000000000l.                                         
                       .l0000000000x;                                           
                         'd0000000d.                                            
                           ,d0000c.                                             
                             'ok:                                               
                               .                                                `
    },
    {
      name: 'cow-head',
      text: ` _____________________________
< Welcome to Metasploit v6.4! >
 -----------------------------
       \\   ^__^
        \\  (oo)\\_______
           (__)\\       )\\/\\
               ||----w |
               ||     ||`
    },
    {
      name: 'ninja',
      text: `                 .---.
                /     \\
               | () () |
                \\  _  /
                 \`---'
               ___| |___
              /    |    \\
             |  |  |  |  |
             |  |  |  |  |`
    },
    {
      name: 'branded-longhorn',
      text: `  ______________________________________________________________________________
 |                                                                              |
 |                     Metasploit Penetration Testing                           |
 |______________________________________________________________________________|
                                                                
     \\   /
      \\ /
     (o.o)   --- Rapid7 Metasploit Framework ---
      / \\
     /   \\`
    },
    {
      name: 'metasploit-frame',
      text: `  _|_|_|  _|_|_|  _|      _|  _|_|_|    _|_|    _|      _| 
_|        _|    _|  _|  _|    _|    _|  _|    _|  _|  _|   
  _|_|    _|_|_|      _|      _|_|_|    _|_|_|_|    _|     
      _|  _|        _|  _|    _|        _|    _|  _|  _|   
_|_|_|    _|      _|      _|  _|        _|    _|  _|      _|
                 =[ metasploit framework ]`
    }
  ];

  const MSF_TELEMETRY = `       =[ metasploit v6.4.25-dev                          ]
+ -- --=[ 2428 exploits - 1282 auxiliary - 428 post       ]
+ -- --=[ 1465 payloads - 47 encoders - 13 nops          ]
+ -- --=[ 9 evasion                                       ]

Metasploit tip: Use the 'search' command to find modules of interest`;

  class SecurityShell {
    constructor() {
      this.cwd = '/home/guest';
      this.user = 'guest';
      this.host = 'moyuan';
      this.mode = 'shell'; // 'shell' | 'msf'
      this.msfModule = null;
    }

    getPrompt() {
      if (this.mode === 'msf') {
        if (this.msfModule) {
          return {
            top: '',
            bottom: `msf6 exploit(${this.msfModule}) > `,
            user: 'msf',
            mode: 'msf',
            arrow: 'msf6 >'
          };
        }
        return {
          top: '',
          bottom: 'msf6 > ',
          user: 'msf',
          mode: 'msf',
          arrow: 'msf6 >'
        };
      }

      const folder = this.cwd === '/home/guest' ? '~' : this.cwd;
      if (this.user === 'root') {
        return {
          top: `┌──(root㉿kali)-[${folder}]`,
          bottom: '└─# ',
          user: 'root',
          mode: 'shell',
          arrow: '└─#'
        };
      }
      return {
        top: `┌──(guest㉿moyuan)-[${folder}]`,
        bottom: '└─$ ',
        user: 'guest',
        mode: 'shell',
        arrow: '└─$'
      };
    }

    path(value = '.') {
      if (value === '~') return '/home/guest';
      const parts = (value.startsWith('/') ? value : this.cwd + '/' + value).split('/');
      const result = [];
      for (const p of parts) {
        if (p === '..') result.pop();
        else if (p && p !== '.') result.push(p);
      }
      return '/' + result.join('/');
    }

    directory(p) {
      return Object.keys(files).some(f => f.startsWith(p === '/' ? '/' : p + '/'));
    }

    getRandomMsfBanner() {
      const banner = MSF_LOGOS[Math.floor(Math.random() * MSF_LOGOS.length)];
      return banner.text + '\n\n' + MSF_TELEMETRY;
    }

    runMsfCommand(input) {
      const trimmed = input.trim();
      const [cmd, ...args] = trimmed.split(/\s+/);
      const text = output => ({ output });

      if (!cmd) return text('');

      switch (cmd.toLowerCase()) {
        case 'help':
        case '?':
          return text(`Core Commands
=============
    Command       Description
    -------       -----------
    banner        Display an awesome metasploit banner
    version       Show framework and console library version numbers
    search        Search module names and descriptions (e.g. search ssh, search redis)
    use           Interact with a module by name (e.g. use exploit/multi/handler)
    show          Displays modules of a given type, or all modules
    exploit / run Launch the current exploit module
    back          Move back from the current context
    clear         Clear the terminal screen
    exit / quit   Exit the console and return to Kali terminal`);

        case 'banner':
          return {
            output: this.getRandomMsfBanner(),
            isMsfBanner: true
          };

        case 'version':
          return text(`Framework: 6.4.25-dev
Console  : 6.4.25-dev`);

        case 'search': {
          const term = (args[0] || '').toLowerCase();
          return text(`Matching Modules (${term ? `filter: '${term}'` : 'top recommended'})
================================================================================

   #  Name                                   Disclosure Date  Rank       Check  Description
   -  ----                                   ---------------  ----       -----  -----------
   0  exploit/linux/redis/redis_replication  2019-07-09       excellent  Yes    Redis Remote Code Execution
   1  exploit/multi/http/ssh_agent_auth      2023-07-19       excellent  Yes    OpenSSH Agent Remote Code Execution
   2  auxiliary/scanner/ssh/ssh_login        2012-09-01       normal     Yes    SSH Login Check Scanner
   3  exploit/unix/webapp/wp_admin_shell     2021-03-15       excellent  Yes    WordPress Admin Shell Upload
   4  exploit/multi/handler                  2006-04-01       manual     No     Generic Payload Handler`);
        }

        case 'use': {
          const mod = args[0] || 'multi/handler';
          const clean = mod.replace(/^exploit\//, '').replace(/^0$/, 'linux/redis/redis_replication');
          this.msfModule = clean;
          return {
            output: `[*] Using module: ${clean}\n[*] Type 'show options' or 'exploit' to proceed.`,
            promptChange: true
          };
        }

        case 'show': {
          if (args[0] === 'options' || this.msfModule) {
            return text(`Module options (${this.msfModule || 'exploit/multi/handler'}):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   RHOSTS   127.0.0.1        yes       The target host(s)
   RPORT    6379             yes       The target port
   LHOST    127.0.0.1        yes       The listen address
   LPORT    4444             yes       The listen port

Payload options (linux/x64/meterpreter/reverse_tcp):
   LHOST    127.0.0.1        yes       The listen address
   LPORT    4444             yes       The listen port`);
          }
          return text(`Type 'show options' to display settings for the current module.`);
        }

        case 'exploit':
        case 'run':
          return text(`[*] Started reverse TCP handler on 127.0.0.1:4444 
[*] Sending stage (201283 bytes) to target 127.0.0.1:6379...
[*] Meterpreter session 1 opened (127.0.0.1:4444 -> 127.0.0.1:58392) at ${new Date().toLocaleTimeString()}
[*] Exploit completed, session 1 active in background. [Simulation successful]`);

        case 'back':
          this.msfModule = null;
          return { output: '', promptChange: true };

        case 'clear':
          return { clear: true };

        case 'exit':
        case 'quit':
          this.mode = 'shell';
          this.msfModule = null;
          return {
            output: `[*] Exiting Metasploit console... Returned to Kali terminal.`,
            promptChange: true
          };

        default:
          return {
            output: `[-] Unknown command: ${cmd}. Type 'help' for a list of valid commands.`,
            error: true
          };
      }
    }

    run(input) {
      const trimmed = input.trim();
      const [command, ...args] = trimmed.split(/\s+/);
      const text = output => ({ output });

      if (!command) return text('');
      if (input.length > 300) return { output: '命令超出最大长度限制。', error: true };

      // If in Metasploit mode, dispatch to MSF interpreter
      if (this.mode === 'msf') {
        return this.runMsfCommand(input);
      }

      switch (command.toLowerCase()) {
        case 'help':
        case '?':
          return text(`────────────────────────────────────
  KALI LINUX / MOYUAN CYBER WORKSPACE
────────────────────────────────────
[系统与侦察]
  neofetch / fastfetch  — 显示系统配置与龙标
  msfconsole / msf      — 启动 Metasploit 模拟
  su / sudo su          — 提权至 root 控制台
  nmap [目标]           — 启动网络端口扫描探测
  cmatrix               — 黑客帝国数字雨 (q 退出)
  reboot                — 重启系统与 BIOS 自检
  whoami / uname / ps   — 查询凭据与进程状态
  ifconfig / ip a       — 查看网络适配器状态
  apt / hexo            — 软件包与博客部署指令

[文件与导航]
  ls [-a] / tree        — 列出目录文件与树形结构
  cd [路径] / pwd       — 切换或查看工作目录
  cat <文件> / grep <词> — 读取或检索虚拟文件内容
  open <页面>           — 跳转 writing|projects|music|score|hello|games|portfolio|cv

[安全与密码学 CLI]
  base64 [-e|-d] <文本> — UTF-8 Base64 编解码
  hex [-e|-d] <文本>    — Hex 十六进制编解码
  rot13 <文本>          — ROT13 凯撒移位
  jwt [token]           — 解析 JWT Header / Payload JSON
  tools / history       — 打开图形安全工具箱 / 历史记录

[数学与编程 REPL]
  calc / math <表达式>  — 科学计算与数论 (gcd/modpow/modinv/factor/isprime)
  mat / matlab <操作>   — MATLAB 风格矩阵运算 (det/inv/mul/trans/rank)
  js / node <代码>      — 运行 JavaScript 表达式或脚本 (console.log / BigInt)
  py / python <代码>    — 运行 Python 表达式/推导式/print

[密码学实验演练]
  rsa [m] [p] [q] [e]   — RSA 密钥生成、加解密与模逆完整推演
  elgamal [m] [p] [g]   — ElGamal 公钥加解密与离散对数推演
  shamir [S] [t] [n]    — Shamir (t,n) 门限秘密分割与拉格朗日重构

[数学与编程 REPL]
  calc / math <表达式>  — 科学计算与数论 (gcd/modpow/modinv/factor/isprime)
  mat / matlab <操作>   — MATLAB 风格矩阵运算 (det/inv/mul/trans/rank)
  js / node <代码>      — 运行 JavaScript 表达式或脚本 (console.log / BigInt)
  py / python <代码>    — 运行 Python 表达式/推导式/print

[密码学实验演练]
  rsa [m] [p] [q] [e]   — RSA 密钥生成、加解密与模逆完整推演
  elgamal [m] [p] [g]   — ElGamal 公钥加解密与离散对数推演
  shamir [S] [t] [n]    — Shamir (t,n) 门限秘密分割与拉格朗日重构

[工具与环境]
  about                 — 墨鵷简介卡片 (about.txt)
  theme <color>         — 切换荧光配色 (cyan|green|amber|purple)
  fx <on|off>           — 切换 CRT 扫描线暗角
  sound <on|off>        — 开启/关闭按键音效

[互联与 AI]
  ai [模型名]           — 唤起 AI 官方探索入口
  clear / exit          — 清屏 (Ctrl+L) 或退出
────────────────────────────────────`);

        case 'neofetch':
        case 'fastfetch':
          return {
            output: KALI_NEOFETCH_RAW,
            html: KALI_NEOFETCH_HTML
          };

        case 'msfconsole':
        case 'msf':
          this.mode = 'msf';
          this.msfModule = null;
          return {
            output: this.getRandomMsfBanner(),
            isMsfBanner: true,
            promptChange: true
          };

        case 'su':
        case 'login':
        case 'sudo': {
          if (command.toLowerCase() === 'sudo' && args.length > 0 && !['-i', '-s', 'su', 'root'].includes(args[0])) {
            return this.run(args.join(' '));
          }
          const isRootCmd = command.toLowerCase() === 'login' || 
                            args.includes('root') || 
                            args.includes('-i') || 
                            args.includes('su');
          if (isRootCmd || command.toLowerCase() === 'su') {
            this.user = 'root';
            this.host = 'kali';
            return {
              output: `Kali GNU/Linux Rolling kali tty1

kali login: root
Password: ••••••••

Linux kali 6.12.25-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.12.25-1kali1 x86_64

The programs included with the Kali GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Kali GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.

[✓] 欢迎进入 Kali Linux Root 超级管理员控制台。输入 help 查看命令，exit 退出提权。`,
              promptChange: true
            };
          }
          return text('用法: sudo -i 或 su root');
        }

        case 'nmap':
        case 'scan': {
          const target = args[0] || 'moyuan.site';
          return text(`Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString('zh-CN')}
Nmap scan report for ${target} (127.0.0.1)
Host is up (0.00038s latency).
Not shown: 994 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
22/tcp   open  ssh           OpenSSH 9.6p1 Debian 4 (protocol 2.0)
80/tcp   open  http          Hexo Butterfly / Nginx 1.24
443/tcp  open  ssl/https     Cloudflare TLS 1.3 / Edge Worker
1337/tcp open  ctf-flag      CTF Challenge [Hint: cat /home/guest/flag]
3000/tcp open  qterminal     Moyuan Web Terminal v2.0
8080/tcp open  http-proxy    ProxyLab / AI Agent Gateway

Service detection performed. Please report any incorrect results.
Nmap done: 1 IP address (1 host up) scanned in 1.24 seconds`);
        }

        case 'cmatrix':
          return {
            cmatrix: true,
            output: '[*] 数字雨动画已启动 (按 Q 或 Esc 退出全屏雨幕)...'
          };

        case 'reboot':
          return { reboot: true };

        case 'whoami':
          return text(this.user === 'root'
            ? 'root — 超级管理员凭据 [UID: 0 GID: 0]\n系统：Kali GNU/Linux Rolling x86_64 (Superuser Active)'
            : 'guest — 探索者凭据 [UID: 1000 GID: 1000]\n站长：Moyuan / 墨鵷 · 网络空间安全与 AI 工程');

        case 'id':
          return text(this.user === 'root'
            ? 'uid=0(root) gid=0(root) groups=0(root)'
            : 'uid=1000(guest) gid=1000(guest) groups=1000(guest),27(sudo),100(users)');

        case 'ps':
          return text(this.user === 'root'
            ? `  PID TTY          TIME CMD
    1 ?        00:00:01 systemd
  412 ?        00:00:00 systemd-journal
  890 ?        00:00:00 sshd
 1024 ?        00:00:02 nginx
 1337 pts/0    00:00:00 bash (root)
 2048 pts/0    00:00:00 qterminal
 2410 pts/0    00:00:00 ps`
            : `  PID TTY          TIME CMD
 1337 pts/0    00:00:00 bash
 2048 pts/0    00:00:00 qterminal
 2411 pts/0    00:00:00 ps`);

        case 'ifconfig':
        case 'ip': {
          if (command === 'ip' && args[0] && !['a', 'addr', 'address'].includes(args[0])) {
            return text('用法: ip a 或 ifconfig');
          }
          return text(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.137  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe4e:66b1  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:4e:66:b1  txqueuelen 1000  (Ethernet)
        RX packets 128942  bytes 84520194 (80.6 MiB)
        TX packets 98311   bytes 14829103 (14.1 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`);
        }

        case 'apt':
        case 'apt-get': {
          const sub = args[0] || 'help';
          if (sub === 'update') {
            return text(`Get:1 http://http.kali.org/kali kali-rolling InRelease [41.5 kB]
Get:2 http://http.kali.org/kali kali-rolling/main amd64 Packages [19.8 MB]
Fetched 19.8 MB in 2s (9,920 kB/s)
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.`);
          }
          if (sub === 'upgrade') {
            return text(`Reading package lists... Done
Building dependency tree... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`);
          }
          if (sub === 'install') {
            const pkg = args[1] || 'package';
            return text(`Reading package lists... Done
Building dependency tree... Done
${pkg} is already the newest version (kali-rolling-latest).`);
          }
          return text(`Kali APT 包管理器 (仿真环境):
  apt update        - 更新软件包索引列表
  apt upgrade       - 升级已安装的软件包
  apt install <pkg> - 安装指定软件包`);
        }

        case 'hexo': {
          const sub = args[0] || '';
          if (sub === 'd' || sub === 'deploy') {
            return text(`[INFO] Validating config...
[INFO] Deploying to GitHub Pages: git@github.com:moyuan10086/moyuan10086.github.io.git#main
[INFO] Deploy done: git
[✓] 提示：在宿主命令行终端执行 'npx hexo clean && npx hexo g -d' 即可完成真机远程同步！`);
          }
          if (sub === 'g' || sub === 'generate') {
            return text(`[INFO] Files loaded in 386 ms
[INFO] Generated HTML/CSS/JS assets to public/
[INFO] 127 files generated in 1.42s`);
          }
          if (sub === 'clean') {
            return text(`[INFO] Deleted database db.json\n[INFO] Deleted public folder`);
          }
          return text(`Hexo 博客管理指令:
  hexo clean     - 清理缓存与静态生成文件
  hexo g         - 生成静态站点文件 (hexo generate)
  hexo d         - 部署站点至 GitHub (hexo deploy)
  hexo g -d      - 生成并一键部署至 GitHub`);
        }

        case 'pwd':
          return text(this.cwd);

        case 'uname':
          return text(args.includes('-a')
            ? 'Linux kali 6.12.25-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.12.25-1kali1 x86_64 GNU/Linux'
            : 'Linux');

        case 'date':
          return text(new Date().toLocaleString('zh-CN', { timeZoneName: 'short' }));

        case 'uptime':
          return text(` ${new Date().toLocaleTimeString()} up 42 days, 13:37,  2 users,  load average: 0.14, 0.18, 0.22`);

        case 'echo':
          return text(args.join(' '));

        case 'clear':
          return { clear: true };

        case 'exit':
          if (this.user === 'root') {
            this.user = 'guest';
            this.host = 'moyuan';
            return {
              output: 'logout\n[✓] 已退出 root 身份，恢复 guest 普通用户凭据。',
              promptChange: true
            };
          }
          return { exit: true };

        case 'tools':
          return {
            openWindow: 'tools',
            output: '[✓] 正在打开 Kali 安全与密码学工具箱面板...'
          };

        case 'about':
          return {
            openWindow: 'notes',
            output: '[✓] 正在打开关于墨鵷信息卡片 (about.txt)...'
          };

        case 'tree':
          return text(`/home/guest
├── .hint
├── about.txt
├── flag
├── projects.txt
└── notes/
    ├── README.md
    └── ctf_tips.txt

1 directory, 6 files`);

        case 'grep': {
          const kw = args.join(' ').trim();
          if (!kw) return text('用法: grep <关键词>  (例如: grep flag)');
          const hits = [];
          for (const [fp, content] of Object.entries(files)) {
            content.split('\n').forEach((line, idx) => {
              if (line.toLowerCase().includes(kw.toLowerCase())) {
                hits.push(`${fp.replace('/home/guest/', '')}:${idx + 1}: ${line}`);
              }
            });
          }
          return text(hits.length ? hits.join('\n') : `grep: 未找到包含 "${kw}" 的匹配行`);
        }

        case 'base64': {
          const isDec = args[0] === '-d' || args[0] === '--decode';
          const isEnc = args[0] === '-e' || args[0] === '--encode';
          const payload = (isDec || isEnc ? args.slice(1) : args).join(' ');
          if (!payload) return text('用法: base64 [-e|-d] <文本>');
          try {
            if (isDec) return text(decodeURIComponent(escape(atob(payload))));
            return text(btoa(unescape(encodeURIComponent(payload))));
          } catch (err) {
            return { output: `base64: 解码失败 (${err.message})`, error: true };
          }
        }

        case 'hex': {
          const isDec = args[0] === '-d' || args[0] === '--decode';
          const isEnc = args[0] === '-e' || args[0] === '--encode';
          const payload = (isDec || isEnc ? args.slice(1) : args).join(' ');
          if (!payload) return text('用法: hex [-e|-d] <文本>');
          try {
            if (isDec) {
              const bytes = payload.replace(/^0x/i, '').replace(/\s+/g, '').match(/.{1,2}/g) || [];
              return text(new TextDecoder().decode(new Uint8Array(bytes.map(b => parseInt(b, 16)))));
            }
            const enc = new TextEncoder().encode(payload);
            return text(Array.from(enc).map(b => b.toString(16).padStart(2, '0')).join(' '));
          } catch (err) {
            return { output: `hex: 转换失败 (${err.message})`, error: true };
          }
        }

        case 'rot13': {
          const payload = args.join(' ');
          if (!payload) return text('用法: rot13 <文本>');
          return text(payload.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
          }));
        }

        case 'jwt': {
          const token = args[0] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb3l1YW4iLCJyb2xlIjoiY3liZXJfcmVzZWFyY2hlciIsImZsYWciOiJzdGF5X2N1cmlvdXMifQ.sig';
          const parts = token.split('.');
          if (parts.length < 2) return { output: 'jwt: 无效的 JWT 格式（需要 header.payload.signature）', error: true };
          const decodePart = (p) => {
            const b64 = p.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(p.length / 4) * 4, '=');
            return JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(b64)))), null, 2);
          };
          try {
            const note = args[0] ? '' : '[*] 未传入 Token，已展示示例 JWT 解析结果：\n';
            return text(`${note}[HEADER]\n${decodePart(parts[0])}\n\n[PAYLOAD]\n${decodePart(parts[1])}`);
          } catch (err) {
            return { output: `jwt: 解析失败 (${err.message})`, error: true };
          }
        }

        case 'history':
          return { showHistory: true };

        case 'calc':
        case 'math': {
          const expr = args.join(' ').trim();
          if (!expr) {
            return text(`科学计算与数论工具 (calc / math):
  示例: calc (1 + sqrt(5)) / 2
        calc sin(pi / 6) + log10(1000)
        calc modpow(2, 100, 1000000007)
        calc modinv(17, 3120)
        calc factor(20260820)
        calc gcd(252, 105) | comb(10, 3) | fact(12)`);
          }
          return this.runMathExpr(expr);
        }

        case 'js':
        case 'node': {
          const code = args.join(' ').trim();
          if (!code) {
            return text(`JavaScript 沙盒运行器 (js / node):
  示例: js [1,2,3,4,5].reduce((a,b) => a + b, 0)
        node console.log("2^64 =", 2n ** 64n)
        js Array.from({length: 6}, (_, i) => i * i)`);
          }
          return this.runJsCode(code);
        }

        case 'py':
        case 'python':
        case 'python3': {
          const code = args.join(' ').trim();
          if (!code) {
            return text(`Python 轻量解释器 (py / python):
  示例: py 2 ** 32 - 1
        py print([x * x for x in range(1, 8)])
        py sum(range(1, 101))
        py [hex(ord(c)) for c in "Kali"]`);
          }
          return this.runPythonCode(code);
        }

        case 'mat':
        case 'matlab':
          return this.runMatrixCmd(args);

        case 'rsa':
          return this.runRsaDemo(args);

        case 'elgamal':
          return this.runElGamalDemo(args);

        case 'shamir':
        case 'sss':
          return this.runShamirDemo(args);

        case 'calc':
        case 'math': {
          const expr = args.join(' ').trim();
          if (!expr) {
            return text(`科学计算与数论工具 (calc / math):
  示例: calc (1 + sqrt(5)) / 2
        calc sin(pi / 6) + log10(1000)
        calc modpow(2, 100, 1000000007)
        calc modinv(17, 3120)
        calc factor(20260820)
        calc gcd(252, 105) | comb(10, 3) | fact(12)`);
          }
          return this.runMathExpr(expr);
        }

        case 'js':
        case 'node': {
          const code = args.join(' ').trim();
          if (!code) {
            return text(`JavaScript 沙盒运行器 (js / node):
  示例: js [1,2,3,4,5].reduce((a,b) => a + b, 0)
        node console.log("2^64 =", 2n ** 64n)
        js Array.from({length: 6}, (_, i) => i * i)`);
          }
          return this.runJsCode(code);
        }

        case 'py':
        case 'python':
        case 'python3': {
          const code = args.join(' ').trim();
          if (!code) {
            return text(`Python 轻量解释器 (py / python):
  示例: py 2 ** 32 - 1
        py print([x * x for x in range(1, 8)])
        py sum(range(1, 101))
        py [hex(ord(c)) for c in "Kali"]`);
          }
          return this.runPythonCode(code);
        }

        case 'mat':
        case 'matlab':
          return this.runMatrixCmd(args);

        case 'rsa':
          return this.runRsaDemo(args);

        case 'elgamal':
          return this.runElGamalDemo(args);

        case 'shamir':
        case 'sss':
          return this.runShamirDemo(args);

        case 'blog':
        case 'posts':
          return {
            navigate: '#selected-writing',
            output: '[✓] 正在跳转至博客文章专区 (#selected-writing)...'
          };

        case 'projects':
          return {
            navigate: '#research-projects',
            output: '[✓] 正在跳转至研发项目矩阵 (/#research-projects)...'
          };

        case 'theme': {
          const color = (args[0] || '').toLowerCase();
          const valid = ['cyan', 'green', 'amber', 'purple'];
          if (valid.includes(color)) {
            return { theme: color, output: `[✓] 荧光调色板已切换至: ${color.toUpperCase()}` };
          }
          return text('用法: theme <cyan|green|amber|purple>');
        }

        case 'fx': {
          const mode = (args[0] || '').toLowerCase();
          if (mode === 'on' || mode === 'off') {
            return { fx: mode, output: `[✓] CRT 扫描线与光效滤镜: ${mode.toUpperCase()}` };
          }
          return text('用法: fx on | fx off');
        }

        case 'sound': {
          const mode = (args[0] || '').toLowerCase();
          if (mode === 'on' || mode === 'off') {
            return { sound: mode === 'on', output: `[✓] Web Audio 赛博音效: ${mode.toUpperCase()}` };
          }
          return text('用法: sound on | sound off');
        }

        case 'ai':
          return aiResult(args[0]);

        case 'cd': {
          const target = this.path(args[0] || '~');
          if (!this.directory(target)) return { output: 'cd: 目录不存在: ' + target, error: true };
          this.cwd = target;
          return { output: '', promptChange: true };
        }

        case 'ls': {
          const hidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
          const target = this.path(args.find(a => !a.startsWith('-')) || '.');
          if (!this.directory(target)) return { output: 'ls: 目录不存在: ' + target, error: true };
          const prefix = target === '/' ? '/' : target + '/';
          const names = [...new Set(Object.keys(files)
            .filter(f => f.startsWith(prefix))
            .map(f => {
              const rest = f.slice(prefix.length);
              return rest.split('/')[0] + (rest.includes('/') ? '/' : '');
            }))];
          return text(names.filter(n => hidden || !n.startsWith('.')).join('   '));
        }

        case 'cat': {
          if (!args.length) return text('用法: cat <文件名>');
          const paths = args.map(a => this.path(a));
          const hasFlag = paths.includes('/home/guest/flag');
          return {
            output: paths.map(p => files[p] ?? 'cat: 文件不存在: ' + p).join('\n'),
            flag: hasFlag
          };
        }

        case 'open': {
          const key = (args[0] || '').toLowerCase();
          if (aiSites[key] || aliases[key]) return aiResult(key);
          const routes = {
            writing: '#selected-writing',
            posts: '#selected-writing',
            blog: '#selected-writing',
            projects: '#research-projects',
            music: '/music/',
            score: '/score/',
            hello: '/hello-world/',
            games: '/games/',
            gallery: '/gallery/',
            portfolio: '/portfolio/',
            cv: '/cv/',
            about: '/about/'
          };
          if (routes[key]) {
            return {
              navigate: routes[key],
              output: `[✓] 正在打开导航目标: ${key} (${routes[key]})...`
            };
          }
          return text('用法: open writing|projects|music|score|hello|games|gallery|portfolio|cv|about，或使用 ai <名称>');
        }

        default:
          return {
            output: `zsh: command not found: ${command} (未找到命令)。输入 help 查看可用指令清单。`,
            error: true
          };
      }
    }

    runMathExpr(expr) {
      const gcd = (a, b) => { a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b)); while (b) { [a, b] = [b, a % b]; } return a; };
      const lcm = (a, b) => (a && b) ? Math.abs(Math.trunc(a) * Math.trunc(b)) / gcd(a, b) : 0;
      const modpow = (base, exp, mod) => {
        let b = BigInt(Math.trunc(base)), e = BigInt(Math.trunc(exp)), m = BigInt(Math.trunc(mod));
        if (m <= 0n) throw new Error('mod 必须为正整数');
        let res = 1n; b = ((b % m) + m) % m;
        while (e > 0n) { if (e & 1n) res = (res * b) % m; e >>= 1n; b = (b * b) % m; }
        return res.toString();
      };
      const modinv = (a, m) => {
        let t = 0n, newT = 1n, r = BigInt(Math.trunc(m)), newR = ((BigInt(Math.trunc(a)) % r) + r) % r;
        while (newR !== 0n) {
          const q = r / newR;
          [t, newT] = [newT, t - q * newT];
          [r, newR] = [newR, r - q * newR];
        }
        if (r > 1n) throw new Error('逆元不存在 (gcd != 1)');
        if (t < 0n) t += BigInt(Math.trunc(m));
        return t.toString();
      };
      const isprime = (n) => {
        n = Math.trunc(n);
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
        return true;
      };
      const factor = (n) => {
        n = Math.abs(Math.trunc(n));
        if (n < 2) return String(n);
        const f = [];
        for (let d = 2; d * d <= n && f.length < 64; d++) {
          while (n % d === 0) { f.push(d); n = Math.trunc(n / d); }
        }
        if (n > 1) f.push(n);
        return f.join(' × ');
      };
      const fact = (n) => {
        n = Math.trunc(n);
        if (n < 0 || n > 100) throw new Error('fact 参数范围 0..100');
        let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i;
        return r.toString();
      };
      const comb = (n, k) => {
        n = Math.trunc(n); k = Math.trunc(k);
        if (k < 0 || k > n || n > 100) throw new Error('comb 参数范围 0 <= k <= n <= 100');
        k = Math.min(k, n - k);
        let num = 1n, den = 1n;
        for (let i = 1n; i <= BigInt(k); i++) { num *= BigInt(n) - i + 1n; den *= i; }
        return (num / den).toString();
      };
      const env = {
        pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E,
        abs: Math.abs, sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow,
        sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
        log: Math.log, ln: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp,
        floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
        gcd, lcm, modpow, modinv, isprime, factor, fact, comb
      };
      if (/[^0-9a-zA-Z_+\-*/%^().,\s]/.test(expr)) {
        return { output: 'calc: 仅允许数学表达式字符与内置函数。', error: true };
      }
      try {
        const jsExpr = expr.replace(/\^/g, '**');
        const fn = new Function(...Object.keys(env), `"use strict"; return (${jsExpr});`);
        const val = fn(...Object.values(env));
        return { output: `= ${typeof val === 'number' && !Number.isInteger(val) ? Number(val.toPrecision(12)) : val}` };
      } catch (err) {
        return { output: `calc: 表达式错误 (${err.message})`, error: true };
      }
    }

    runJsCode(code) {
      if (/\b(window|document|localStorage|sessionStorage|fetch|XMLHttpRequest|Function|eval|import|globalThis)\b/.test(code)) {
        return { output: 'js: 沙盒仅用于算法与表达式运行，禁止访问 DOM / 网络对象。', error: true };
      }
      const logs = [];
      const fmt = (v) => {
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      const fakeConsole = {
        log: (...a) => logs.push(a.map(fmt).join(' ')),
        warn: (...a) => logs.push('[warn] ' + a.map(fmt).join(' ')),
        error: (...a) => logs.push('[error] ' + a.map(fmt).join(' '))
      };
      try {
        let res;
        try {
          res = new Function('console', `"use strict"; return (${code});`)(fakeConsole);
        } catch {
          res = new Function('console', `"use strict"; ${code}`)(fakeConsole);
        }
        if (res !== undefined) logs.push('← ' + fmt(res));
        return { output: logs.length ? logs.join('\n') : '(undefined)' };
      } catch (err) {
        return { output: `JavaScript Error: ${err.message}`, error: true };
      }
    }

    runPythonCode(code) {
      if (/\b(window|document|localStorage|fetch|eval|Function|__import__|import\s+os|import\s+sys)\b/.test(code)) {
        return { output: 'python: 沙盒仅支持纯运算、列表推导式与标准数学函数。', error: true };
      }
      const logs = [];
      const pyFmt = (v) => {
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'boolean') return v ? 'True' : 'False';
        if (v === null || v === undefined) return 'None';
        if (Array.isArray(v)) return '[' + v.map(x => typeof x === 'string' ? `'${x}'` : pyFmt(x)).join(', ') + ']';
        return String(v);
      };
      const range = (...a) => {
        let start = 0, stop = 0, step = 1;
        if (a.length === 1) stop = a[0];
        else if (a.length === 2) { start = a[0]; stop = a[1]; }
        else { start = a[0]; stop = a[1]; step = a[2]; }
        const out = [];
        if (step === 0 || Math.abs((stop - start) / step) > 10000) throw new Error('range 步长或范围超出限制');
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) out.push(i);
        return out;
      };
      const env = {
        print: (...a) => logs.push(a.map(pyFmt).join(' ')),
        range,
        len: (x) => x.length,
        sum: (arr) => arr.reduce((a, b) => a + b, 0),
        min: (...a) => Math.min(...(Array.isArray(a[0]) ? a[0] : a)),
        max: (...a) => Math.max(...(Array.isArray(a[0]) ? a[0] : a)),
        abs: Math.abs, round: Math.round, pow: Math.pow,
        int: (x, base) => base ? parseInt(String(x), base) : Math.trunc(Number(x)),
        float: Number, str: pyFmt, bool: Boolean, list: (x) => Array.from(x),
        sorted: (x) => [...x].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)),
        reversed: (x) => [...x].reverse(),
        ord: (c) => String(c).charCodeAt(0),
        chr: (n) => String.fromCharCode(n),
        hex: (n) => '0x' + Math.trunc(n).toString(16),
        bin: (n) => '0b' + Math.trunc(n).toString(2),
        oct: (n) => '0o' + Math.trunc(n).toString(8),
        True: true, False: false, None: null,
        math: {
          pi: Math.PI, e: Math.E, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
          log: Math.log, log2: Math.log2, log10: Math.log10, floor: Math.floor, ceil: Math.ceil,
          gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
          factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
        }
      };
      try {
        // Lightweight Python -> JS expression transpiler (list comprehensions, //, and/or/not)
        let js = code
          .replace(/\[\s*([^\[\]]+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([^\[\]]+?)(?:\s+if\s+([^\[\]]+?))?\s*\]/g,
            (_, body, v, iter, cond) => cond
              ? `Array.from(${iter}).filter((${v})=>(${cond})).map((${v})=>(${body}))`
              : `Array.from(${iter}).map((${v})=>(${body}))`)
          .replace(/\(\s*([^\(\)]+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([^\(\)]+?)(?:\s+if\s+([^\(\)]+?))?\s*\)/g,
            (_, body, v, iter, cond) => cond
              ? `Array.from(${iter}).filter((${v})=>(${cond})).map((${v})=>(${body}))`
              : `Array.from(${iter}).map((${v})=>(${body}))`)
          .replace(/(\b[\w)\]]+)\s*\/\/\s*([\w(\[]+)/g, 'Math.floor(($1)/($2))')
          .replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\s+/g, '!');
        const fn = new Function(...Object.keys(env), `"use strict"; return (${js});`);
        const res = fn(...Object.values(env));
        if (res !== undefined && !logs.length) logs.push(pyFmt(res));
        else if (res !== undefined) logs.push('← ' + pyFmt(res));
        return { output: logs.length ? logs.join('\n') : '(None)' };
      } catch (err) {
        return { output: `Python Error: ${err.message}`, error: true };
      }
    }

    _modPow(base, exp, mod) {
      let b = ((BigInt(base) % BigInt(mod)) + BigInt(mod)) % BigInt(mod);
      let e = BigInt(exp), m = BigInt(mod), res = 1n;
      while (e > 0n) { if (e & 1n) res = (res * b) % m; e >>= 1n; b = (b * b) % m; }
      return res;
    }

    _modInv(a, m) {
      let t = 0n, newT = 1n, r = BigInt(m), newR = ((BigInt(a) % r) + r) % r;
      while (newR !== 0n) {
        const q = r / newR;
        [t, newT] = [newT, t - q * newT];
        [r, newR] = [newR, r - q * newR];
      }
      if (r > 1n) throw new Error(`gcd(${a}, ${m}) != 1，模逆不存在`);
      return t < 0n ? t + BigInt(m) : t;
    }

    _fmtMat(M) {
      return M.map(row => '  [ ' + row.map(v => {
        const s = Math.abs(v) < 1e-10 ? '0' : (Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, ''));
        return s.padStart(8, ' ');
      }).join('  ') + ' ]').join('\n');
    }

    runMatrixCmd(args) {
      const op = (args[0] || '').toLowerCase();
      if (!op || op === 'help') {
        return {
          output: `MATLAB 矩阵运算引擎 (mat / matlab):
  mat det   [[1,2],[3,4]]                  — 计算行列式 det(A)
  mat inv   [[4,7],[2,6]]                  — 计算逆矩阵 A⁻¹
  mat mul   [[1,2],[3,4]] [[5,6],[7,8]]    — 矩阵乘法 A × B
  mat trans [[1,2,3],[4,5,6]]              — 矩阵转置 Aᵀ
  mat rank  [[1,2,3],[2,4,6],[1,1,1]]      — 计算矩阵秩 rank(A)`
        };
      }
      try {
        const rest = args.slice(1).join(' ');
        const mats = rest.match(/\[\s*\[[\s\S]*?\]\s*\]/g);
        if (!mats || !mats.length) return { output: 'mat: 请使用 JSON 嵌套数组格式，例如 mat det [[1,2],[3,4]]', error: true };
        const A = JSON.parse(mats[0]);
        const r = A.length, c = A[0].length;

        const detFn = (M) => {
          const n = M.length;
          const a = M.map(row => row.map(Number));
          let d = 1;
          for (let i = 0; i < n; i++) {
            let piv = i;
            for (let k = i + 1; k < n; k++) if (Math.abs(a[k][i]) > Math.abs(a[piv][i])) piv = k;
            if (Math.abs(a[piv][i]) < 1e-12) return 0;
            if (piv !== i) { [a[i], a[piv]] = [a[piv], a[i]]; d = -d; }
            d *= a[i][i];
            for (let k = i + 1; k < n; k++) {
              const f = a[k][i] / a[i][i];
              for (let j = i; j < n; j++) a[k][j] -= f * a[i][j];
            }
          }
          return Math.abs(d - Math.round(d)) < 1e-9 ? Math.round(d) : Number(d.toPrecision(10));
        };

        if (op === 'det') {
          if (r !== c) throw new Error('det 仅支持方阵');
          return { output: `A =\n${this._fmtMat(A)}\n\ndet(A) = ${detFn(A)}` };
        }
        if (op === 'trans' || op === 't') {
          const T = Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => A[i][j]));
          return { output: `Aᵀ =\n${this._fmtMat(T)}` };
        }
        if (op === 'mul') {
          if (mats.length < 2) throw new Error('mul 需要两个矩阵，例如 mat mul [[1,2],[3,4]] [[5,6],[7,8]]');
          const B = JSON.parse(mats[1]);
          if (c !== B.length) throw new Error(`维度不匹配: (${r}×${c}) × (${B.length}×${B[0].length})`);
          const C = Array.from({ length: r }, (_, i) =>
            Array.from({ length: B[0].length }, (_, j) =>
              A[i].reduce((sum, v, k) => sum + v * B[k][j], 0)));
          return { output: `A × B =\n${this._fmtMat(C)}` };
        }
        if (op === 'inv') {
          if (r !== c) throw new Error('inv 仅支持方阵');
          const n = r;
          const aug = A.map((row, i) => [...row.map(Number), ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
          for (let i = 0; i < n; i++) {
            let piv = i;
            for (let k = i + 1; k < n; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[piv][i])) piv = k;
            if (Math.abs(aug[piv][i]) < 1e-12) throw new Error('矩阵奇异 (det = 0)，不可逆');
            [aug[i], aug[piv]] = [aug[piv], aug[i]];
            const div = aug[i][i];
            for (let j = 0; j < 2 * n; j++) aug[i][j] /= div;
            for (let k = 0; k < n; k++) {
              if (k === i) continue;
              const f = aug[k][i];
              for (let j = 0; j < 2 * n; j++) aug[k][j] -= f * aug[i][j];
            }
          }
          const invM = aug.map(row => row.slice(n));
          return { output: `det(A) = ${detFn(A)}\nA⁻¹ =\n${this._fmtMat(invM)}` };
        }
        if (op === 'rank') {
          const a = A.map(row => row.map(Number));
          let rank = 0;
          for (let col = 0; col < c && rank < r; col++) {
            let piv = rank;
            for (let k = rank + 1; k < r; k++) if (Math.abs(a[k][col]) > Math.abs(a[piv][col])) piv = k;
            if (Math.abs(a[piv][col]) < 1e-12) continue;
            [a[rank], a[piv]] = [a[piv], a[rank]];
            for (let k = rank + 1; k < r; k++) {
              const f = a[k][col] / a[rank][col];
              for (let j = col; j < c; j++) a[k][j] -= f * a[rank][j];
            }
            rank++;
          }
          return { output: `A (${r}×${c}) =\n${this._fmtMat(A)}\n\nrank(A) = ${rank}` };
        }
        return { output: `mat: 未知操作 "${op}"，支持 det | inv | mul | trans | rank`, error: true };
      } catch (err) {
        return { output: `mat Error: ${err.message}`, error: true };
      }
    }

    runRsaDemo(args) {
      try {
        const m = BigInt(args[0] || 42);
        const p = BigInt(args[1] || 61);
        const q = BigInt(args[2] || 53);
        const e = BigInt(args[3] || 17);
        const n = p * q;
        const phi = (p - 1n) * (q - 1n);
        if (m < 0n || m >= n) throw new Error(`明文 m 须满足 0 <= m < n (${n})`);
        const d = this._modInv(e, phi);
        const c = this._modPow(m, e, n);
        const dec = this._modPow(c, d, n);
        return {
          output: `═══ RSA 公钥密码体制演练 ═══
[1] 密钥生成
    p = ${p},  q = ${q}
    n = p · q = ${n}
    φ(n) = (p-1)(q-1) = ${phi}
    公钥 (e, n) = (${e}, ${n})
    私钥 d ≡ e⁻¹ mod φ(n) = ${d}
[2] 加密过程
    明文 m = ${m}
    密文 c ≡ m^e mod n = ${m}^${e} mod ${n} = ${c}
[3] 解密验证
    m' ≡ c^d mod n = ${c}^${d} mod ${n} = ${dec}
    [✓] 验证通过: m' == m (${dec === m})
用法: rsa [m] [p] [q] [e]`
        };
      } catch (err) {
        return { output: `rsa Error: ${err.message}`, error: true };
      }
    }

    runElGamalDemo(args) {
      try {
        const m = BigInt(args[0] || 19);
        const p = BigInt(args[1] || 467);
        const g = BigInt(args[2] || 2);
        const x = BigInt(args[3] || 127);
        const k = BigInt(args[4] || 213);
        if (m <= 0n || m >= p) throw new Error(`明文 m 须满足 0 < m < p (${p})`);
        const y = this._modPow(g, x, p);
        const c1 = this._modPow(g, k, p);
        const c2 = (m * this._modPow(y, k, p)) % p;
        const s = this._modPow(c1, x, p);
        const sInv = this._modInv(s, p);
        const dec = (c2 * sInv) % p;
        return {
          output: `═══ ElGamal 公钥加密演练 ═══
[1] 参数与密钥
    大素数 p = ${p},  生成元 g = ${g}
    私钥 x = ${x}
    公钥 y ≡ g^x mod p = ${y}
[2] 随机加密 (k = ${k})
    c₁ ≡ g^k mod p = ${c1}
    c₂ ≡ m · y^k mod p = ${c2}
    密文对 (c₁, c₂) = (${c1}, ${c2})
[3] 解密验证
    共享密钥 s ≡ c₁^x mod p = ${s},  s⁻¹ mod p = ${sInv}
    m' ≡ c₂ · s⁻¹ mod p = ${dec}
    [✓] 验证通过: m' == m (${dec === m})
用法: elgamal [m] [p] [g] [x] [k]`
        };
      } catch (err) {
        return { output: `elgamal Error: ${err.message}`, error: true };
      }
    }

    runShamirDemo(args) {
      try {
        const secret = BigInt(args[0] || 42);
        const t = Math.max(2, Math.min(8, parseInt(args[1] || '3', 10)));
        const n = Math.max(t, Math.min(12, parseInt(args[2] || '5', 10)));
        const p = BigInt(args[3] || 257);
        if (secret < 0n || secret >= p) throw new Error(`秘密 S 须满足 0 <= S < p (${p})`);
        // Deterministic-looking random coefficients in [1, p-1]
        const coeffs = [secret];
        for (let i = 1; i < t; i++) {
          coeffs.push(BigInt(1 + Math.floor(Math.random() * Number(p - 2n))));
        }
        const polyStr = coeffs.map((a, i) => (i === 0 ? `${a}` : `${a}x${i > 1 ? '^' + i : ''}`)).join(' + ');
        const shares = [];
        for (let x = 1n; x <= BigInt(n); x++) {
          let y = 0n, xp = 1n;
          for (const a of coeffs) { y = (y + a * xp) % p; xp = (xp * x) % p; }
          shares.push([x, y]);
        }
        // Lagrange interpolation at x = 0 using first t shares
        const subset = shares.slice(0, t);
        let recovered = 0n;
        for (let i = 0; i < t; i++) {
          let num = 1n, den = 1n;
          for (let j = 0; j < t; j++) {
            if (i === j) continue;
            num = (num * (-subset[j][0])) % p;
            den = (den * (subset[i][0] - subset[j][0])) % p;
          }
          const li = ((num % p + p) % p) * this._modInv((den % p + p) % p, p) % p;
          recovered = (recovered + subset[i][1] * li) % p;
        }
        const shareLines = shares.map(([x, y]) => `    Share #${x}: (${x}, ${y})`).join('\n');
        return {
          output: `═══ Shamir (${t}, ${n}) 门限秘密分割 ═══
[1] 有限域构造 (GF(${p}))
    原始秘密 S = ${secret}
    随机多项式 f(x) = ${polyStr} (mod ${p})
[2] 生成 ${n} 份子密钥 (任意 ${t} 份可重构)
${shareLines}
[3] 拉格朗日插值重构 (取前 ${t} 份求 f(0))
    S' = Σ yᵢ · Lᵢ(0) mod ${p} = ${recovered}
    [✓] 重构成功: S' == S (${recovered === secret})
用法: shamir [秘密S] [门限t] [总份数n] [素数p]`
        };
      } catch (err) {
        return { output: `shamir Error: ${err.message}`, error: true };
      }
    }

    runMathExpr(expr) {
      const gcd = (a, b) => { a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b)); while (b) { [a, b] = [b, a % b]; } return a; };
      const lcm = (a, b) => (a && b) ? Math.abs(Math.trunc(a) * Math.trunc(b)) / gcd(a, b) : 0;
      const modpow = (base, exp, mod) => {
        let b = BigInt(Math.trunc(base)), e = BigInt(Math.trunc(exp)), m = BigInt(Math.trunc(mod));
        if (m <= 0n) throw new Error('mod 必须为正整数');
        let res = 1n; b = ((b % m) + m) % m;
        while (e > 0n) { if (e & 1n) res = (res * b) % m; e >>= 1n; b = (b * b) % m; }
        return res.toString();
      };
      const modinv = (a, m) => {
        let t = 0n, newT = 1n, r = BigInt(Math.trunc(m)), newR = ((BigInt(Math.trunc(a)) % r) + r) % r;
        while (newR !== 0n) {
          const q = r / newR;
          [t, newT] = [newT, t - q * newT];
          [r, newR] = [newR, r - q * newR];
        }
        if (r > 1n) throw new Error('逆元不存在 (gcd != 1)');
        if (t < 0n) t += BigInt(Math.trunc(m));
        return t.toString();
      };
      const isprime = (n) => {
        n = Math.trunc(n);
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
        return true;
      };
      const factor = (n) => {
        n = Math.abs(Math.trunc(n));
        if (n < 2) return String(n);
        const f = [];
        for (let d = 2; d * d <= n && f.length < 64; d++) {
          while (n % d === 0) { f.push(d); n = Math.trunc(n / d); }
        }
        if (n > 1) f.push(n);
        return f.join(' × ');
      };
      const fact = (n) => {
        n = Math.trunc(n);
        if (n < 0 || n > 100) throw new Error('fact 参数范围 0..100');
        let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i;
        return r.toString();
      };
      const comb = (n, k) => {
        n = Math.trunc(n); k = Math.trunc(k);
        if (k < 0 || k > n || n > 100) throw new Error('comb 参数范围 0 <= k <= n <= 100');
        k = Math.min(k, n - k);
        let num = 1n, den = 1n;
        for (let i = 1n; i <= BigInt(k); i++) { num *= BigInt(n) - i + 1n; den *= i; }
        return (num / den).toString();
      };
      const env = {
        pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E,
        abs: Math.abs, sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow,
        sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
        log: Math.log, ln: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp,
        floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
        gcd, lcm, modpow, modinv, isprime, factor, fact, comb
      };
      if (/[^0-9a-zA-Z_+\-*/%^().,\s]/.test(expr)) {
        return { output: 'calc: 仅允许数学表达式字符与内置函数。', error: true };
      }
      try {
        const jsExpr = expr.replace(/\^/g, '**');
        const fn = new Function(...Object.keys(env), `"use strict"; return (${jsExpr});`);
        const val = fn(...Object.values(env));
        return { output: `= ${typeof val === 'number' && !Number.isInteger(val) ? Number(val.toPrecision(12)) : val}` };
      } catch (err) {
        return { output: `calc: 表达式错误 (${err.message})`, error: true };
      }
    }

    runJsCode(code) {
      if (/\b(window|document|localStorage|sessionStorage|fetch|XMLHttpRequest|Function|eval|import|globalThis)\b/.test(code)) {
        return { output: 'js: 沙盒仅用于算法与表达式运行，禁止访问 DOM / 网络对象。', error: true };
      }
      const logs = [];
      const fmt = (v) => {
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      const fakeConsole = {
        log: (...a) => logs.push(a.map(fmt).join(' ')),
        warn: (...a) => logs.push('[warn] ' + a.map(fmt).join(' ')),
        error: (...a) => logs.push('[error] ' + a.map(fmt).join(' '))
      };
      try {
        let res;
        try {
          res = new Function('console', `"use strict"; return (${code});`)(fakeConsole);
        } catch {
          res = new Function('console', `"use strict"; ${code}`)(fakeConsole);
        }
        if (res !== undefined) logs.push('← ' + fmt(res));
        return { output: logs.length ? logs.join('\n') : '(undefined)' };
      } catch (err) {
        return { output: `JavaScript Error: ${err.message}`, error: true };
      }
    }

    runPythonCode(code) {
      if (/\b(window|document|localStorage|fetch|eval|Function|__import__|import\s+os|import\s+sys)\b/.test(code)) {
        return { output: 'python: 沙盒仅支持纯运算、列表推导式与标准数学函数。', error: true };
      }
      const logs = [];
      const pyFmt = (v) => {
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'boolean') return v ? 'True' : 'False';
        if (v === null || v === undefined) return 'None';
        if (Array.isArray(v)) return '[' + v.map(x => typeof x === 'string' ? `'${x}'` : pyFmt(x)).join(', ') + ']';
        return String(v);
      };
      const range = (...a) => {
        let start = 0, stop = 0, step = 1;
        if (a.length === 1) stop = a[0];
        else if (a.length === 2) { start = a[0]; stop = a[1]; }
        else { start = a[0]; stop = a[1]; step = a[2]; }
        const out = [];
        if (step === 0 || Math.abs((stop - start) / step) > 10000) throw new Error('range 步长或范围超出限制');
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) out.push(i);
        return out;
      };
      const env = {
        print: (...a) => logs.push(a.map(pyFmt).join(' ')),
        range,
        len: (x) => x.length,
        sum: (arr) => arr.reduce((a, b) => a + b, 0),
        min: (...a) => Math.min(...(Array.isArray(a[0]) ? a[0] : a)),
        max: (...a) => Math.max(...(Array.isArray(a[0]) ? a[0] : a)),
        abs: Math.abs, round: Math.round, pow: Math.pow,
        int: (x, base) => base ? parseInt(String(x), base) : Math.trunc(Number(x)),
        float: Number, str: pyFmt, bool: Boolean, list: (x) => Array.from(x),
        sorted: (x) => [...x].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)),
        reversed: (x) => [...x].reverse(),
        ord: (c) => String(c).charCodeAt(0),
        chr: (n) => String.fromCharCode(n),
        hex: (n) => '0x' + Math.trunc(n).toString(16),
        bin: (n) => '0b' + Math.trunc(n).toString(2),
        oct: (n) => '0o' + Math.trunc(n).toString(8),
        True: true, False: false, None: null,
        math: {
          pi: Math.PI, e: Math.E, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
          log: Math.log, log2: Math.log2, log10: Math.log10, floor: Math.floor, ceil: Math.ceil,
          gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
          factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
        }
      };
      try {
        // Lightweight Python -> JS expression transpiler (list comprehensions, //, and/or/not)
        let js = code
          .replace(/\[\s*([^\[\]]+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([^\[\]]+?)(?:\s+if\s+([^\[\]]+?))?\s*\]/g,
            (_, body, v, iter, cond) => cond
              ? `Array.from(${iter}).filter((${v})=>(${cond})).map((${v})=>(${body}))`
              : `Array.from(${iter}).map((${v})=>(${body}))`)
          .replace(/\(\s*([^\(\)]+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([^\(\)]+?)(?:\s+if\s+([^\(\)]+?))?\s*\)/g,
            (_, body, v, iter, cond) => cond
              ? `Array.from(${iter}).filter((${v})=>(${cond})).map((${v})=>(${body}))`
              : `Array.from(${iter}).map((${v})=>(${body}))`)
          .replace(/(\b[\w)\]]+)\s*\/\/\s*([\w(\[]+)/g, 'Math.floor(($1)/($2))')
          .replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\s+/g, '!');
        const fn = new Function(...Object.keys(env), `"use strict"; return (${js});`);
        const res = fn(...Object.values(env));
        if (res !== undefined && !logs.length) logs.push(pyFmt(res));
        else if (res !== undefined) logs.push('← ' + pyFmt(res));
        return { output: logs.length ? logs.join('\n') : '(None)' };
      } catch (err) {
        return { output: `Python Error: ${err.message}`, error: true };
      }
    }

    _modPow(base, exp, mod) {
      let b = ((BigInt(base) % BigInt(mod)) + BigInt(mod)) % BigInt(mod);
      let e = BigInt(exp), m = BigInt(mod), res = 1n;
      while (e > 0n) { if (e & 1n) res = (res * b) % m; e >>= 1n; b = (b * b) % m; }
      return res;
    }

    _modInv(a, m) {
      let t = 0n, newT = 1n, r = BigInt(m), newR = ((BigInt(a) % r) + r) % r;
      while (newR !== 0n) {
        const q = r / newR;
        [t, newT] = [newT, t - q * newT];
        [r, newR] = [newR, r - q * newR];
      }
      if (r > 1n) throw new Error(`gcd(${a}, ${m}) != 1，模逆不存在`);
      return t < 0n ? t + BigInt(m) : t;
    }

    _fmtMat(M) {
      return M.map(row => '  [ ' + row.map(v => {
        const s = Math.abs(v) < 1e-10 ? '0' : (Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, ''));
        return s.padStart(8, ' ');
      }).join('  ') + ' ]').join('\n');
    }

    runMatrixCmd(args) {
      const op = (args[0] || '').toLowerCase();
      if (!op || op === 'help') {
        return {
          output: `MATLAB 矩阵运算引擎 (mat / matlab):
  mat det   [[1,2],[3,4]]                  — 计算行列式 det(A)
  mat inv   [[4,7],[2,6]]                  — 计算逆矩阵 A⁻¹
  mat mul   [[1,2],[3,4]] [[5,6],[7,8]]    — 矩阵乘法 A × B
  mat trans [[1,2,3],[4,5,6]]              — 矩阵转置 Aᵀ
  mat rank  [[1,2,3],[2,4,6],[1,1,1]]      — 计算矩阵秩 rank(A)`
        };
      }
      try {
        const rest = args.slice(1).join(' ');
        const mats = rest.match(/\[\s*\[[\s\S]*?\]\s*\]/g);
        if (!mats || !mats.length) return { output: 'mat: 请使用 JSON 嵌套数组格式，例如 mat det [[1,2],[3,4]]', error: true };
        const A = JSON.parse(mats[0]);
        const r = A.length, c = A[0].length;

        const detFn = (M) => {
          const n = M.length;
          const a = M.map(row => row.map(Number));
          let d = 1;
          for (let i = 0; i < n; i++) {
            let piv = i;
            for (let k = i + 1; k < n; k++) if (Math.abs(a[k][i]) > Math.abs(a[piv][i])) piv = k;
            if (Math.abs(a[piv][i]) < 1e-12) return 0;
            if (piv !== i) { [a[i], a[piv]] = [a[piv], a[i]]; d = -d; }
            d *= a[i][i];
            for (let k = i + 1; k < n; k++) {
              const f = a[k][i] / a[i][i];
              for (let j = i; j < n; j++) a[k][j] -= f * a[i][j];
            }
          }
          return Math.abs(d - Math.round(d)) < 1e-9 ? Math.round(d) : Number(d.toPrecision(10));
        };

        if (op === 'det') {
          if (r !== c) throw new Error('det 仅支持方阵');
          return { output: `A =\n${this._fmtMat(A)}\n\ndet(A) = ${detFn(A)}` };
        }
        if (op === 'trans' || op === 't') {
          const T = Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => A[i][j]));
          return { output: `Aᵀ =\n${this._fmtMat(T)}` };
        }
        if (op === 'mul') {
          if (mats.length < 2) throw new Error('mul 需要两个矩阵，例如 mat mul [[1,2],[3,4]] [[5,6],[7,8]]');
          const B = JSON.parse(mats[1]);
          if (c !== B.length) throw new Error(`维度不匹配: (${r}×${c}) × (${B.length}×${B[0].length})`);
          const C = Array.from({ length: r }, (_, i) =>
            Array.from({ length: B[0].length }, (_, j) =>
              A[i].reduce((sum, v, k) => sum + v * B[k][j], 0)));
          return { output: `A × B =\n${this._fmtMat(C)}` };
        }
        if (op === 'inv') {
          if (r !== c) throw new Error('inv 仅支持方阵');
          const n = r;
          const aug = A.map((row, i) => [...row.map(Number), ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
          for (let i = 0; i < n; i++) {
            let piv = i;
            for (let k = i + 1; k < n; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[piv][i])) piv = k;
            if (Math.abs(aug[piv][i]) < 1e-12) throw new Error('矩阵奇异 (det = 0)，不可逆');
            [aug[i], aug[piv]] = [aug[piv], aug[i]];
            const div = aug[i][i];
            for (let j = 0; j < 2 * n; j++) aug[i][j] /= div;
            for (let k = 0; k < n; k++) {
              if (k === i) continue;
              const f = aug[k][i];
              for (let j = 0; j < 2 * n; j++) aug[k][j] -= f * aug[i][j];
            }
          }
          const invM = aug.map(row => row.slice(n));
          return { output: `det(A) = ${detFn(A)}\nA⁻¹ =\n${this._fmtMat(invM)}` };
        }
        if (op === 'rank') {
          const a = A.map(row => row.map(Number));
          let rank = 0;
          for (let col = 0; col < c && rank < r; col++) {
            let piv = rank;
            for (let k = rank + 1; k < r; k++) if (Math.abs(a[k][col]) > Math.abs(a[piv][col])) piv = k;
            if (Math.abs(a[piv][col]) < 1e-12) continue;
            [a[rank], a[piv]] = [a[piv], a[rank]];
            for (let k = rank + 1; k < r; k++) {
              const f = a[k][col] / a[rank][col];
              for (let j = col; j < c; j++) a[k][j] -= f * a[rank][j];
            }
            rank++;
          }
          return { output: `A (${r}×${c}) =\n${this._fmtMat(A)}\n\nrank(A) = ${rank}` };
        }
        return { output: `mat: 未知操作 "${op}"，支持 det | inv | mul | trans | rank`, error: true };
      } catch (err) {
        return { output: `mat Error: ${err.message}`, error: true };
      }
    }

    runRsaDemo(args) {
      try {
        const m = BigInt(args[0] || 42);
        const p = BigInt(args[1] || 61);
        const q = BigInt(args[2] || 53);
        const e = BigInt(args[3] || 17);
        const n = p * q;
        const phi = (p - 1n) * (q - 1n);
        if (m < 0n || m >= n) throw new Error(`明文 m 须满足 0 <= m < n (${n})`);
        const d = this._modInv(e, phi);
        const c = this._modPow(m, e, n);
        const dec = this._modPow(c, d, n);
        return {
          output: `═══ RSA 公钥密码体制演练 ═══
[1] 密钥生成
    p = ${p},  q = ${q}
    n = p · q = ${n}
    φ(n) = (p-1)(q-1) = ${phi}
    公钥 (e, n) = (${e}, ${n})
    私钥 d ≡ e⁻¹ mod φ(n) = ${d}
[2] 加密过程
    明文 m = ${m}
    密文 c ≡ m^e mod n = ${m}^${e} mod ${n} = ${c}
[3] 解密验证
    m' ≡ c^d mod n = ${c}^${d} mod ${n} = ${dec}
    [✓] 验证通过: m' == m (${dec === m})
用法: rsa [m] [p] [q] [e]`
        };
      } catch (err) {
        return { output: `rsa Error: ${err.message}`, error: true };
      }
    }

    runElGamalDemo(args) {
      try {
        const m = BigInt(args[0] || 19);
        const p = BigInt(args[1] || 467);
        const g = BigInt(args[2] || 2);
        const x = BigInt(args[3] || 127);
        const k = BigInt(args[4] || 213);
        if (m <= 0n || m >= p) throw new Error(`明文 m 须满足 0 < m < p (${p})`);
        const y = this._modPow(g, x, p);
        const c1 = this._modPow(g, k, p);
        const c2 = (m * this._modPow(y, k, p)) % p;
        const s = this._modPow(c1, x, p);
        const sInv = this._modInv(s, p);
        const dec = (c2 * sInv) % p;
        return {
          output: `═══ ElGamal 公钥加密演练 ═══
[1] 参数与密钥
    大素数 p = ${p},  生成元 g = ${g}
    私钥 x = ${x}
    公钥 y ≡ g^x mod p = ${y}
[2] 随机加密 (k = ${k})
    c₁ ≡ g^k mod p = ${c1}
    c₂ ≡ m · y^k mod p = ${c2}
    密文对 (c₁, c₂) = (${c1}, ${c2})
[3] 解密验证
    共享密钥 s ≡ c₁^x mod p = ${s},  s⁻¹ mod p = ${sInv}
    m' ≡ c₂ · s⁻¹ mod p = ${dec}
    [✓] 验证通过: m' == m (${dec === m})
用法: elgamal [m] [p] [g] [x] [k]`
        };
      } catch (err) {
        return { output: `elgamal Error: ${err.message}`, error: true };
      }
    }

    runShamirDemo(args) {
      try {
        const secret = BigInt(args[0] || 42);
        const t = Math.max(2, Math.min(8, parseInt(args[1] || '3', 10)));
        const n = Math.max(t, Math.min(12, parseInt(args[2] || '5', 10)));
        const p = BigInt(args[3] || 257);
        if (secret < 0n || secret >= p) throw new Error(`秘密 S 须满足 0 <= S < p (${p})`);
        // Deterministic-looking random coefficients in [1, p-1]
        const coeffs = [secret];
        for (let i = 1; i < t; i++) {
          coeffs.push(BigInt(1 + Math.floor(Math.random() * Number(p - 2n))));
        }
        const polyStr = coeffs.map((a, i) => (i === 0 ? `${a}` : `${a}x${i > 1 ? '^' + i : ''}`)).join(' + ');
        const shares = [];
        for (let x = 1n; x <= BigInt(n); x++) {
          let y = 0n, xp = 1n;
          for (const a of coeffs) { y = (y + a * xp) % p; xp = (xp * x) % p; }
          shares.push([x, y]);
        }
        // Lagrange interpolation at x = 0 using first t shares
        const subset = shares.slice(0, t);
        let recovered = 0n;
        for (let i = 0; i < t; i++) {
          let num = 1n, den = 1n;
          for (let j = 0; j < t; j++) {
            if (i === j) continue;
            num = (num * (-subset[j][0])) % p;
            den = (den * (subset[i][0] - subset[j][0])) % p;
          }
          const li = ((num % p + p) % p) * this._modInv((den % p + p) % p, p) % p;
          recovered = (recovered + subset[i][1] * li) % p;
        }
        const shareLines = shares.map(([x, y]) => `    Share #${x}: (${x}, ${y})`).join('\n');
        return {
          output: `═══ Shamir (${t}, ${n}) 门限秘密分割 ═══
[1] 有限域构造 (GF(${p}))
    原始秘密 S = ${secret}
    随机多项式 f(x) = ${polyStr} (mod ${p})
[2] 生成 ${n} 份子密钥 (任意 ${t} 份可重构)
${shareLines}
[3] 拉格朗日插值重构 (取前 ${t} 份求 f(0))
    S' = Σ yᵢ · Lᵢ(0) mod ${p} = ${recovered}
    [✓] 重构成功: S' == S (${recovered === secret})
用法: shamir [秘密S] [门限t] [总份数n] [素数p]`
        };
      } catch (err) {
        return { output: `shamir Error: ${err.message}`, error: true };
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = SecurityShell;
  else root.MoyuanSecurityShell = SecurityShell;
})(typeof window === 'undefined' ? globalThis : window);
