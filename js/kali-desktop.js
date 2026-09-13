/**
 * Kali Linux Web Modal Terminal UI Engine
 * Inspired by Kali Linux QTerminal & glucas.dev Terminal Retro FX
 * Designed for Moyuan's Cyber Lab & Tech Blog
 */
(() => {
  'use strict';

  // --- 1. Cyber Audio Synthesizer (Web Audio API, zero external dependencies) ---
  class CyberAudio {
    constructor() {
      this.enabled = localStorage.getItem('kali_audio') === 'true';
      this.ctx = null;
    }

    init() {
      if (!this.ctx && typeof window.AudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('kali_audio', String(this.enabled));
      if (this.enabled) {
        this.init();
        this.beep(880, 0.08, 'sine');
      }
      return this.enabled;
    }

    click() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    }

    beep(freq = 660, duration = 0.1, type = 'sine') {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    }

    alarm() {
      // Terminal bell / alarm sound for invalid commands or critical alerts
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    bootSound() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    }
  }

  // --- 2. Matrix Digital Rain (cmatrix simulation on canvas) ---
  class CMatrixRain {
    constructor(canvas, modal) {
      this.canvas = canvas;
      this.modal = modal;
      this.ctx = canvas.getContext('2d');
      this.active = false;
      this.animId = null;
      this.characters = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF$#@%&*+-/<>~';
      this.fontSize = 14;
      this.columns = 0;
      this.drops = [];

      this.canvas.addEventListener('click', () => this.stop());
      this._keyHandler = (e) => {
        if (!this.active) return;
        if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape' || (e.ctrlKey && e.key === 'c') || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          this.stop();
        }
      };
      window.addEventListener('keydown', this._keyHandler, true);
    }

    start() {
      this.active = true;
      this.canvas.style.display = 'block';
      const screen = this.canvas.parentElement;
      if (screen) screen.scrollTop = 0;
      this.resize();
      this.columns = Math.floor(this.canvas.width / this.fontSize);
      this.drops = Array(this.columns).fill(1);
      this.draw();
    }

    draw() {
      if (!this.active) return;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const currentPhosphor = this.modal?.dataset?.phosphor || 'cyan';
      let charColor = '#38bdf8';
      if (currentPhosphor === 'green') charColor = '#10b981';
      else if (currentPhosphor === 'amber') charColor = '#f59e0b';
      else if (currentPhosphor === 'purple') charColor = '#c084fc';

      this.ctx.font = `${this.fontSize}px monospace`;
      for (let i = 0; i < this.drops.length; i++) {
        const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
        this.ctx.fillStyle = Math.random() > 0.9 ? '#ffffff' : charColor;
        this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

        if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }
        this.drops[i]++;
      }
      this.animId = requestAnimationFrame(() => this.draw());
    }

    stop() {
      this.active = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      this.canvas.style.display = 'none';
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const input = document.getElementById('shell-input');
      if (input) input.focus();
    }

    resize() {
      this.canvas.width = this.canvas.parentElement.clientWidth;
      this.canvas.height = this.canvas.parentElement.clientHeight;
    }
  }

  // --- 3. Main Kali Modal Window Controller ---
  class KaliModalController {
    constructor() {
      this.modal = document.getElementById('security-terminal');
      if (!this.modal) return;

      this.audio = new CyberAudio();
      this.shell = new (window.MoyuanSecurityShell || (typeof MoyuanSecurityShell !== 'undefined' ? MoyuanSecurityShell : class {
        run() { return { output: 'Security Shell not initialized.' }; }
        getPrompt() { return { top: '┌──(guest㉿moyuan)-[~]', bottom: '└─$ ', arrow: '└─$', user: 'guest' }; }
      }))();
      this.history = [];
      this.historyIndex = 0;
      this.cmatrix = null;

      const canvas = document.getElementById('modal-cmatrix-canvas');
      if (canvas) {
        this.cmatrix = new CMatrixRain(canvas, this.modal);
      }

      this.initThemeAndFx();
      this.initModalControls();
      this.initMenubar();
      this.initTabs();
      this.initTerminal();
      this.initArsenal();
      this.initReboot();
      this.initKeyboardShortcuts();
      this.updatePromptDisplay();
    }

    // Persist & Apply FX & Phosphor Palettes (glucas.dev style)
    initThemeAndFx() {
      let savedFx = localStorage.getItem('kali_fx_v2');
      if (!savedFx) {
        savedFx = 'off';
        localStorage.setItem('kali_fx_v2', 'off');
        localStorage.setItem('kali_fx', 'off');
      }
      const savedPhosphor = localStorage.getItem('kali_phosphor') || 'cyan';

      this.modal.dataset.fx = savedFx;
      this.modal.dataset.phosphor = savedPhosphor;

      const fxBtn = document.getElementById('modal-fx-toggle');
      if (fxBtn) fxBtn.dataset.active = savedFx === 'on' ? 'true' : 'false';

      const colorBtn = document.getElementById('modal-color-toggle');
      if (colorBtn) colorBtn.textContent = savedPhosphor.toUpperCase();

      const audioBtn = document.getElementById('modal-audio-toggle');
      if (audioBtn) audioBtn.dataset.active = this.audio.enabled ? 'true' : 'false';
    }

    toggleFx() {
      const current = this.modal.dataset.fx === 'on' ? 'off' : 'on';
      this.modal.dataset.fx = current;
      localStorage.setItem('kali_fx_v2', current);
      localStorage.setItem('kali_fx', current);
      const fxBtn = document.getElementById('modal-fx-toggle');
      if (fxBtn) fxBtn.dataset.active = current === 'on' ? 'true' : 'false';
      this.audio.click();
    }

    cyclePhosphor() {
      const palettes = ['cyan', 'green', 'amber', 'purple'];
      const current = this.modal.dataset.phosphor || 'cyan';
      const next = palettes[(palettes.indexOf(current) + 1) % palettes.length];
      this.setPhosphor(next);
      this.audio.click();
    }

    setPhosphor(color) {
      this.modal.dataset.phosphor = color;
      localStorage.setItem('kali_phosphor', color);
      const colorBtn = document.getElementById('modal-color-toggle');
      if (colorBtn) colorBtn.textContent = color.toUpperCase();
    }

    // Terminal QTerminal Menubar (File Actions Edit View Help)
    initMenubar() {
      const menuItems = this.modal.querySelectorAll('.kali-menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.audio.click();
          const action = item.dataset.menu;
          this.handleMenuAction(action);
        });
      });
    }

    handleMenuAction(menu) {
      const input = document.getElementById('shell-input');
      const form = document.getElementById('shell-form');

      switch (menu) {
        case 'neofetch':
          if (input && form) {
            input.value = 'neofetch';
            form.requestSubmit();
          }
          break;
        case 'msf':
          if (input && form) {
            input.value = 'msfconsole';
            form.requestSubmit();
          }
          break;
        case 'nmap':
          if (input && form) {
            input.value = 'nmap moyuan.site';
            form.requestSubmit();
          }
          break;
        case 'cmatrix':
          if (input && form) {
            input.value = 'cmatrix';
            form.requestSubmit();
          }
          break;
        case 'clear':
          document.getElementById('shell-output')?.replaceChildren();
          input?.focus();
          break;
        case 'help':
          if (input && form) {
            input.value = 'help';
            form.requestSubmit();
          }
          break;
        case 'fx':
          this.toggleFx();
          break;
        case 'theme':
          this.cyclePhosphor();
          break;
        default:
          input?.focus();
          break;
      }
    }

    // Window controls & backdrop handling
    initModalControls() {
      const fxBtn = document.getElementById('modal-fx-toggle');
      fxBtn?.addEventListener('click', () => this.toggleFx());

      const colorBtn = document.getElementById('modal-color-toggle');
      colorBtn?.addEventListener('click', () => this.cyclePhosphor());

      const audioBtn = document.getElementById('modal-audio-toggle');
      audioBtn?.addEventListener('click', () => {
        const enabled = this.audio.toggle();
        audioBtn.dataset.active = enabled ? 'true' : 'false';
      });

      const rebootBtn = document.getElementById('modal-reboot-btn');
      rebootBtn?.addEventListener('click', () => this.triggerReboot());

      const maxBtn = document.getElementById('modal-max-btn');
      maxBtn?.addEventListener('click', () => this.toggleMaximize());

      const closeBtn = document.getElementById('shell-close');
      closeBtn?.addEventListener('click', () => this.closeModal());

      // Native dialog cancel event (Esc)
      this.modal.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.closeModal();
      });

      // Close on backdrop click
      this.modal.addEventListener('click', (e) => {
        const rect = this.modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                            rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          this.closeModal();
        }
      });

      // Bind open button on homepage
      const openBtn = document.getElementById('shell-open');
      openBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });

      // Auto-open via hash or URL param
      if (window.location.hash === '#security-terminal' || window.location.search.includes('terminal=open')) {
        setTimeout(() => {
          this.openModal();
          const params = new URLSearchParams(window.location.search);
          const cmd = params.get('cmd');
          if (cmd) {
            const input = document.getElementById('shell-input');
            const form = document.getElementById('shell-form');
            if (input && form) {
              input.value = cmd;
              form.requestSubmit();
            }
          }
        }, 120);
      }
    }

    openModal() {
      if (this.modal.open) return;
      if (typeof this.modal.showModal === 'function') {
        this.modal.showModal();
      } else {
        this.modal.setAttribute('open', '');
      }
      this.audio.beep(660, 0.08);

      if (!this.initializedWelcome) {
        this.initializedWelcome = true;
        const logs = document.getElementById('shell-output');
        if (logs && !logs.hasChildNodes()) {
          const motd = document.createElement('div');
          motd.className = 'term-motd';
          motd.innerHTML = `<span style="color:#38bdf8;font-weight:700;">Linux kali 6.12.25-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.12.25-1kali1 x86_64</span>
<span style="color:#94a3b8;">MOYUAN KALI LINUX CYBER LAB — 保持好奇，验证假设，以证据构建判断。</span>
<span style="color:#64748b;">输入 <span style="color:#7dd3fc;">help</span> 查看指令，试试 <span style="color:#7dd3fc;">neofetch</span>, <span style="color:#7dd3fc;">nmap</span>, <span style="color:#7dd3fc;">msfconsole</span> 或 <span style="color:#7dd3fc;">cat flag</span>。</span>`;
          logs.appendChild(motd);
        }
      }

      this.updatePromptDisplay();
      const input = document.getElementById('shell-input');
      setTimeout(() => input?.focus(), 50);
    }

    closeModal() {
      if (this.cmatrix?.active) this.cmatrix.stop();
      if (typeof this.modal.close === 'function') {
        this.modal.close();
      } else {
        this.modal.removeAttribute('open');
      }
      this.audio.beep(300, 0.06);
    }

    openDesktop() { this.openModal(); }
    exitDesktop() { this.closeModal(); }

    toggleMaximize() {
      const isMax = this.modal.classList.toggle('is-maximized');
      const maxBtn = document.getElementById('modal-max-btn');
      if (maxBtn) maxBtn.textContent = isMax ? '❐' : '□';
      this.audio.click();
    }

    // Tab Navigation
    initTabs() {
      const tabBtns = this.modal.querySelectorAll('.kali-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.switchTab(btn.dataset.tab);
        });
      });
    }

    switchTab(targetId) {
      const tabBtns = this.modal.querySelectorAll('.kali-tab-btn');
      const panes = this.modal.querySelectorAll('.kali-tab-pane');

      tabBtns.forEach(b => b.classList.toggle('is-active', b.dataset.tab === targetId));
      panes.forEach(p => p.classList.toggle('is-active', p.id === targetId));
      this.audio.click();

      if (targetId === 'tab-terminal') {
        const input = document.getElementById('shell-input');
        setTimeout(() => input?.focus(), 50);
      }
    }

    // Prompt UI synchronization
    updatePromptDisplay() {
      const form = document.getElementById('shell-form');
      if (!form) return;
      const topEl = form.querySelector('.kali-prompt-top');
      const arrowEl = form.querySelector('.kali-prompt-arrow');
      const p = this.shell.getPrompt ? this.shell.getPrompt() : { top: '┌──(guest㉿moyuan)-[~]', bottom: '└─$ ', arrow: '└─$', user: 'guest' };

      if (topEl) {
        topEl.textContent = p.top;
        topEl.style.display = p.top ? 'block' : 'none';
        if (p.user === 'root') {
          topEl.style.color = '#f87171';
        } else {
          topEl.style.color = 'var(--kali-accent)';
        }
      }

      if (arrowEl) {
        if (p.mode === 'msf') {
          arrowEl.className = 'kali-prompt-arrow term-prompt-msf';
          arrowEl.textContent = p.bottom.trim();
        } else if (p.user === 'root') {
          arrowEl.className = 'kali-prompt-arrow term-prompt-root';
          arrowEl.textContent = '└─#';
        } else {
          arrowEl.className = 'kali-prompt-arrow';
          arrowEl.textContent = '└─$';
        }
      }
    }

    // Interactive QTerminal Engine
    initTerminal() {
      const form = document.getElementById('shell-form');
      const input = document.getElementById('shell-input');
      const logs = document.getElementById('shell-output');
      if (!form || !input || !logs) return;

      const termScreen = document.querySelector('.kali-terminal-screen');
      termScreen?.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON' && !this.cmatrix?.active) {
          input.focus();
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input.value;
        const val = raw.trim();
        if (!val) return;

        this.history.push(raw);
        this.historyIndex = this.history.length;
        input.value = '';

        this.audio.click();

        // Capture current prompt for this command history line
        const p = this.shell.getPrompt ? this.shell.getPrompt() : { top: '┌──(guest㉿moyuan)-[~]', bottom: '└─$ ', arrow: '└─$', user: 'guest' };

        const cmdBlock = document.createElement('div');
        cmdBlock.className = 'term-cmd-entry';
        if (p.top) {
          cmdBlock.innerHTML = `<div class="cmd-prompt-path" style="${p.user === 'root' ? 'color:#f87171;' : ''}">${p.top}</div><div class="kali-prompt-bottom"><span class="cmd-prompt-arrow ${p.mode === 'msf' ? 'term-prompt-msf' : ''} ${p.user === 'root' ? 'term-prompt-root' : ''}">${p.arrow || p.bottom}</span> <span class="cmd-echo-text"></span></div>`;
        } else {
          cmdBlock.innerHTML = `<div class="kali-prompt-bottom"><span class="cmd-prompt-arrow ${p.mode === 'msf' ? 'term-prompt-msf' : ''}">${p.arrow || p.bottom}</span> <span class="cmd-echo-text"></span></div>`;
        }
        cmdBlock.querySelector('.cmd-echo-text').textContent = val;
        logs.appendChild(cmdBlock);

        const res = this.shell.run(val);

        if (res.clear) {
          logs.replaceChildren();
        } else if (res.html) {
          const out = document.createElement('div');
          out.className = 'term-rich-output';
          out.innerHTML = res.html;
          logs.appendChild(out);
        } else if (res.output) {
          const out = document.createElement('pre');
          if (res.flag) out.className = 'term-flag';
          if (res.error) {
            out.className = 'term-cmd-error';
            // Play cyber alarm sound
            this.audio.alarm();
            // Flash terminal border for visual alert
            termScreen?.classList.add('term-bell-flash');
            setTimeout(() => termScreen?.classList.remove('term-bell-flash'), 300);
          }
          if (res.isMsfBanner) {
            out.className = 'term-msf-output';
          }
          out.textContent = res.output;
          logs.appendChild(out);
        }

        if (res.links) {
          const linksDiv = document.createElement('div');
          linksDiv.className = 'shell-ai-links';
          res.links.forEach(site => {
            const a = document.createElement('a');
            a.href = site.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `${site.name} ↗`;
            linksDiv.appendChild(a);
          });
          logs.appendChild(linksDiv);
        }

        if (res.cmatrix) {
          this.cmatrix?.start();
        }

        if (res.reboot) {
          this.triggerReboot();
        }

        if (res.openWindow === 'tools') {
          setTimeout(() => this.switchTab('tab-arsenal'), 120);
        } else if (res.openWindow === 'notes') {
          setTimeout(() => this.switchTab('tab-notes'), 120);
        }

        if (res.theme) {
          this.setPhosphor(res.theme);
        }

        if (res.fx) {
          this.modal.dataset.fx = res.fx;
          localStorage.setItem('kali_fx', res.fx);
          localStorage.setItem('kali_fx_v2', res.fx);
          const fxBtn = document.getElementById('modal-fx-toggle');
          if (fxBtn) fxBtn.dataset.active = res.fx === 'on' ? 'true' : 'false';
        }

        if (res.sound !== undefined) {
          this.audio.enabled = res.sound;
          localStorage.setItem('kali_audio', String(res.sound));
          const audioBtn = document.getElementById('modal-audio-toggle');
          if (audioBtn) audioBtn.dataset.active = res.sound ? 'true' : 'false';
        }

        if (res.exit) {
          this.closeModal();
        }

        if (res.navigate) {
          setTimeout(() => {
            this.closeModal();
            if (res.navigate.startsWith('#')) {
              const target = document.querySelector(res.navigate);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', res.navigate);
              } else {
                location.assign('/archives/');
              }
            } else {
              location.assign(res.navigate);
            }
          }, 250);
        }

        this.updatePromptDisplay();

        if (termScreen) {
          termScreen.scrollTop = termScreen.scrollHeight;
        }
      });

      // Key navigation (History, Tab autocomplete, Ctrl+L, Ctrl+C)
      input.addEventListener('keydown', (e) => {
        this.audio.click();

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.historyIndex > 0) {
            this.historyIndex--;
            input.value = this.history[this.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            input.value = this.history[this.historyIndex] || '';
          } else {
            this.historyIndex = this.history.length;
            input.value = '';
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const v = input.value.trim();
          const suggestions = [
            'help', 'neofetch', 'fastfetch', 'msfconsole', 'msf', 'banner', 'search',
            'su', 'su root', 'sudo -i', 'nmap', 'nmap moyuan.site', 'cmatrix', 'whoami',
            'pwd', 'ls', 'ls -la', 'cat flag', 'cat about.txt', 'cat projects.txt',
            'tools', 'blog', 'posts', 'projects', 'theme cyan', 'theme green', 'theme amber',
            'theme purple', 'fx on', 'fx off', 'sound on', 'sound off', 'ai deepseek',
            'ai claude', 'reboot', 'clear', 'exit'
          ];
          const match = suggestions.find(s => s.startsWith(v));
          if (match) input.value = match;
        } else if (e.key === 'l' && e.ctrlKey) {
          e.preventDefault();
          logs.replaceChildren();
        } else if (e.key === 'c' && e.ctrlKey) {
          if (this.cmatrix?.active) this.cmatrix.stop();
        }
      });
    }

    // Security & Cryptography Arsenal Tools
    initArsenal() {
      // Port Scanner Simulation
      const scanBtn = document.getElementById('arsenal-scan-btn');
      const scanInput = document.getElementById('arsenal-scan-target');
      const scanOut = document.getElementById('arsenal-scan-output');

      if (scanBtn && scanInput && scanOut) {
        scanBtn.addEventListener('click', () => {
          const target = scanInput.value.trim() || 'moyuan.site';
          scanOut.textContent = `[*] 初始化 SYN Stealth 探测引擎...\n[*] 目标: ${target}\n[*] 正在发送探测包至 1024 个常见服务端口...`;
          scanBtn.disabled = true;
          this.audio.beep(440, 0.1);

          let step = 0;
          const interval = setInterval(() => {
            step++;
            if (step === 1) {
              scanOut.textContent += `\n[+] 目标主机在线，平均往返延迟 0.38ms`;
              this.audio.beep(550, 0.05);
            } else if (step === 2) {
              scanOut.textContent += `\n[+] 发现开放端口: 22/TCP (OpenSSH 9.6p1 Debian)`;
              this.audio.beep(660, 0.05);
            } else if (step === 3) {
              scanOut.textContent += `\n[+] 发现开放端口: 80/TCP (Hexo Butterfly / Nginx 1.24)`;
              this.audio.beep(770, 0.05);
            } else if (step === 4) {
              scanOut.textContent += `\n[+] 发现开放端口: 443/TCP (Cloudflare SSL/TLS 1.3)`;
              this.audio.beep(880, 0.05);
            } else if (step === 5) {
              scanOut.textContent += `\n[+] 发现特殊端口: 1337/TCP (Moyuan CTF Flag Challenge Service)`;
              scanOut.textContent += `\n\n═════════════════════════════════════════════════\n[✓] 探测完成！共发现 4 个活跃服务端口。\n提示: 可在终端输入 cat flag 捕获挑战标识。`;
              this.audio.beep(1100, 0.15);
              clearInterval(interval);
              scanBtn.disabled = false;
            }
          }, 380);
        });
      }

      // Crypto Encoders
      const inputCipher = document.getElementById('arsenal-cipher-input');
      const outputCipher = document.getElementById('arsenal-cipher-output');

      const doEncode = (type) => {
        const val = inputCipher?.value || '';
        this.audio.click();
        try {
          if (type === 'b64-enc') outputCipher.value = btoa(unescape(encodeURIComponent(val)));
          else if (type === 'b64-dec') outputCipher.value = decodeURIComponent(escape(atob(val)));
          else if (type === 'hex-enc') {
            outputCipher.value = Array.from(val).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
          } else if (type === 'hex-dec') {
            outputCipher.value = val.split(/\s+/).map(h => String.fromCharCode(parseInt(h, 16))).join('');
          } else if (type === 'url-enc') outputCipher.value = encodeURIComponent(val);
          else if (type === 'url-dec') outputCipher.value = decodeURIComponent(val);
          else if (type === 'rot13') {
            outputCipher.value = val.replace(/[a-zA-Z]/g, c => {
              const base = c <= 'Z' ? 65 : 97;
              return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
            });
          }
        } catch (err) {
          outputCipher.value = `[错误] 编码处理失败: ${err.message}`;
        }
      };

      this.modal.querySelectorAll('[data-cipher]').forEach(btn => {
        btn.addEventListener('click', () => doEncode(btn.dataset.cipher));
      });

      // CTF Flag Validator
      const ctfInput = document.getElementById('arsenal-ctf-input');
      const ctfBtn = document.getElementById('arsenal-ctf-btn');
      const ctfRes = document.getElementById('arsenal-ctf-result');

      if (ctfBtn && ctfInput && ctfRes) {
        ctfBtn.addEventListener('click', () => {
          const val = ctfInput.value.trim();
          if (val === 'flag{stay_curious_verify_everything_kali}' || val === 'flag{stay_curious_verify_everything}') {
            ctfRes.textContent = '🎉 验证通过！Flag 正确：恭喜捕获旗帜！';
            ctfRes.style.color = '#4ade80';
            this.audio.beep(1320, 0.2);
          } else {
            ctfRes.textContent = '❌ 标识错误或格式不匹配，请继续在文件系统或端口中寻找！';
            ctfRes.style.color = '#f87171';
            this.audio.beep(220, 0.15);
          }
        });
      }
    }

    // Hardware Reboot & BIOS Simulation (glucas.dev style)
    initReboot() {
      const screen = document.getElementById('modal-reboot-screen');
      if (!screen) return;
      screen.addEventListener('click', () => screen.classList.remove('is-active'));
    }

    triggerReboot() {
      const screen = document.getElementById('modal-reboot-screen');
      if (!screen) return;

      this.audio.bootSound();
      screen.classList.add('is-active');
      const lines = screen.querySelectorAll('.bios-post-line');
      lines.forEach(l => l.style.display = 'none');

      let idx = 0;
      const interval = setInterval(() => {
        if (idx < lines.length) {
          lines[idx].style.display = 'block';
          this.audio.beep(1200, 0.02);
          idx++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            screen.classList.remove('is-active');
            this.audio.beep(880, 0.1);
          }, 1000);
        }
      }, 140);

      const skip = () => {
        clearInterval(interval);
        screen.classList.remove('is-active');
        screen.removeEventListener('click', skip);
        document.removeEventListener('keydown', skip);
      };
      screen.addEventListener('click', skip, { once: true });
      document.addEventListener('keydown', skip, { once: true });
    }

    // Keyboard Shortcuts
    initKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (!this.modal.open) return;

        if (e.key === 'Escape') {
          if (this.cmatrix?.active) {
            this.cmatrix.stop();
          } else {
            this.closeModal();
          }
        }
      });
    }
  }

  // Auto initialize on DOM ready or pjax
  let modalInstance = null;
  function initKaliModal() {
    if (!modalInstance) {
      modalInstance = new KaliModalController();
      window.__kaliDesktop = modalInstance;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKaliModal, { once: true });
  } else {
    initKaliModal();
  }

  document.addEventListener('pjax:complete', () => {
    modalInstance = null;
    initKaliModal();
  });
})();
