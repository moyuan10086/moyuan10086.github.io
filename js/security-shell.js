/* Virtual filesystem & Kali QTerminal command processor:
   Input is evaluated only against virtual commands in browser context. */
(function (root) {
  'use strict';

  const files = {
    '/home/guest/about.txt': '墨鸢 / Moyuan\n网络空间安全 · 密码学 · CTF · AI 安全 · Agent 工程\n保持好奇，验证假设，以证据构建判断。',
    '/home/guest/flag': 'flag{stay_curious_verify_everything_kali}\n[✓] Flag captured. 恭喜攻破安全挑战，欢迎探索 Moyuan 赛博空间！',
    '/home/guest/notes/README.md': '这里记录 Web 安全、密码学与 AI 安全工程实践。\n输入 open writing 阅读文章，open projects 查看项目，或输入 tools 开启安全工具箱。',
    '/home/guest/notes/ctf_tips.txt': '1. 善用 nmap 探测隐藏端口。\n2. flag 藏在熟悉的文件系统里。\n3. 使用 base64/hash 模块分析可疑流量。',
    '/home/guest/projects.txt': '1. PeerAssist — 证据驱动的 AI 审稿工作台\n2. Unlimited-OCR — 面向国产 NPU 的适配与评测\n3. AIGC Safety — 多模态内容安全与可解释审计',
    '/home/guest/.hint': '不需要提权。真正的线索一直在当前目录。试试 cat flag 或执行 nmap'
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
    grok: { name: 'Grok', url: 'https://x.ai/' }
  };

  const aliases = { '豆包': 'doubao', '深度求索': 'deepseek', gpt: 'chatgpt' };

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
          return text(`════════════════════════════════════════════════════════════
  KALI LINUX / MOYUAN CYBER WORKSPACE COMMANDS
════════════════════════════════════════════════════════════
[系统与侦察]
  neofetch / fastfetch  — 显示 Kali 龙标与系统配置
  msfconsole / msf      — 启动 Metasploit 渗透框架模拟
  su / sudo su / login  — 提权至 root 超级特权控制台
  nmap [目标]           — 启动网络端口扫描模拟
  cmatrix               — 进入黑客帝国数字雨全屏动画 (按 q 退出)
  reboot                — 重启系统并执行 BIOS POST 自检
  whoami / id / uname   — 查询当前凭据与内核状态
  ps / uptime / date    — 查看进程与系统时间
  ifconfig / ip a       — 查看网络适配器状态
  apt [update|install]  — Kali APT 软件包管理器
  hexo [g|d|clean]      — Hexo 博客编译与 GitHub 部署指令

[文件与导航]
  ls [-a] [路径]        — 列出目录文件
  cd [路径]             — 切换当前目录 (支持 ~ 和 ..)
  pwd                   — 打印当前工作目录路径
  cat <文件>            — 读取文件内容 (试试 cat flag)
  blog / posts          — 跳转至博客文章专区 (#selected-writing)
  projects              — 查看研发项目矩阵 (/#research-projects)

[工具与环境]
  tools                 — 打开 Kali 安全与密码学工具箱
  about                 — 查看关于墨鸢信息卡片 (about.txt)
  theme <color>         — 切换调色板 (cyan | green | amber | purple)
  fx <on|off>           — 开启/关闭 CRT 扫描线与暗角滤镜
  sound <on|off>        — 开启/关闭按键与系统音效

[互联与 AI]
  ai [模型名]           — 唤起 AI 官方探索入口 (deepseek, claude 等)
  open <writing|projects|music|games|about> — 快速导航
  clear                 — 清屏 (快捷键 Ctrl+L)
  exit                  — 退出终端或返回博客
════════════════════════════════════════════════════════════`);

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
            : 'guest — 探索者凭据 [UID: 1000 GID: 1000]\n站长：Moyuan / 墨鸢 · 网络空间安全与 AI 工程');

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
            output: '[✓] 正在打开关于墨鸢信息卡片 (about.txt)...'
          };

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
            games: '/games/',
            about: '/about/'
          };
          if (routes[key]) {
            return {
              navigate: routes[key],
              output: `[✓] 正在打开导航目标: ${key} (${routes[key]})...`
            };
          }
          return text('用法: open writing|projects|music|games|about，或使用 ai <名称>');
        }

        default:
          return {
            output: `zsh: command not found: ${command} (未找到命令)。输入 help 查看可用指令清单。`,
            error: true
          };
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = SecurityShell;
  else root.MoyuanSecurityShell = SecurityShell;
})(typeof window === 'undefined' ? globalThis : window);
