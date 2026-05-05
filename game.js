/* THE QUIET DESK - Core Game Logic */

// --- STATE MANAGEMENT ---
const state = {
    lc: 0,
    day: 1,
    upgrades: {
        router: false,
        broadband: false,
        antivirus: false,
        mug: false,
        lamp: false,
        search: false,
        notepadPro: false,
        encyclopedia: 0 // Uses left today
    },
    notepadText: "Librarian Notes:\n----------------\n",
    lastLogin: null,
    completedQuests: []
};

// --- AUDIO SYNTHESIS (Web Audio API) ---
class AudioEngine {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    playTone(freq, type, duration, vol=0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    playNoise(duration, vol=0.1) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    sfxCoin() { this.init(); this.playTone(987, 'sine', 0.1, 0.2); setTimeout(()=>this.playTone(1318, 'sine', 0.3, 0.2), 100); }
    sfxDing() { this.init(); this.playTone(880, 'sine', 0.5, 0.2); }
    sfxError() { this.init(); this.playTone(150, 'sawtooth', 0.3, 0.2); }
    sfxType() { this.init(); this.playNoise(0.05, 0.05); }
    sfxDialup() { 
        this.init(); 
        this.playTone(600, 'square', 1, 0.05);
        setTimeout(()=>this.playTone(1200, 'sawtooth', 1, 0.05), 500);
        setTimeout(()=>this.playNoise(2, 0.02), 1000);
    }
    sfxStartup() {
        this.init();
        this.playTone(523.25, 'sine', 0.4, 0.1); // C5
        setTimeout(()=>this.playTone(659.25, 'sine', 0.4, 0.1), 200); // E5
        setTimeout(()=>this.playTone(415.30, 'sine', 0.4, 0.1), 400); // G#4
        setTimeout(()=>this.playTone(783.99, 'sine', 0.8, 0.1), 600); // G5
    }
}
const audio = new AudioEngine();

// --- WINDOW MANAGER ---
const os = {
    z: 100,
    apps: {
        'webexplorer': { title: 'WebExplorer', icon: '🌐', template: 'tpl-webexplorer', width: 800, height: 600 },
        'notepad': { title: 'Notepad', icon: '📝', template: 'tpl-notepad', width: 500, height: 400 },
        'mycomputer': { title: 'My Computer', icon: '💻', template: 'tpl-mycomputer', width: 600, height: 400 },
        'shop': { title: 'Library Shop', icon: '🛒', template: 'tpl-shop', width: 600, height: 500 }
    },
    openWindows: {},
    
    toggleStartMenu() {
        const sm = document.getElementById('start-menu');
        sm.classList.toggle('show');
    },

    openApp(id) {
        document.getElementById('start-menu').classList.remove('show');
        if (this.openWindows[id]) {
            this.focusWindow(id);
            return;
        }
        
        const app = this.apps[id];
        const win = document.createElement('div');
        win.className = 'window active';
        win.id = 'win-' + id;
        win.style.width = app.width + 'px';
        win.style.height = app.height + 'px';
        // Center roughly
        win.style.left = Math.max(10, (window.innerWidth - app.width) / 2 + (Math.random()*40-20)) + 'px';
        win.style.top = Math.max(10, (window.innerHeight - app.height) / 2 + (Math.random()*40-20)) + 'px';
        win.style.zIndex = ++this.z;

        win.innerHTML = `
            <div class="title-bar" onmousedown="os.startDrag(event, '${id}')" ontouchstart="os.startDrag(event, '${id}')">
                <span class="title-bar-text">${app.icon} ${app.title}</span>
                <div class="title-bar-controls">
                    <div class="win-btn win-btn-min" onclick="os.minApp('${id}')">_</div>
                    <div class="win-btn win-btn-max" onclick="os.maxApp('${id}')">□</div>
                    <div class="win-btn win-btn-close" onclick="os.closeApp('${id}')">X</div>
                </div>
            </div>
            <div class="window-content"></div>
            <div class="resize-handle resize-se" onmousedown="os.startResize(event, '${id}')" ontouchstart="os.startResize(event, '${id}')"></div>
        `;
        
        const content = win.querySelector('.window-content');
        const tpl = document.getElementById(app.template);
        if(tpl) content.appendChild(tpl.content.cloneNode(true));

        win.addEventListener('mousedown', () => this.focusWindow(id));
        win.addEventListener('touchstart', () => this.focusWindow(id), {passive: true});

        document.getElementById('windows-container').appendChild(win);
        this.openWindows[id] = { el: win, minimized: false, maximized: false, oldRect: null };
        
        // App specific inits
        if (id === 'notepad') {
            const ta = win.querySelector('.notepad-textarea');
            ta.value = state.notepadText;
            ta.addEventListener('input', (e) => {
                state.notepadText = e.target.value;
                audio.sfxType();
                game.scheduleSave();
            });
            if(state.upgrades.notepadPro) {
                ta.style.background = '#1e1e1e'; ta.style.color = '#d4d4d4';
            }
        } else if (id === 'shop') {
            shop.render();
        } else if (id === 'webexplorer') {
            webEx.init(win);
        }

        this.updateTaskbar();
        this.focusWindow(id);
    },

    closeApp(id) {
        if (!this.openWindows[id]) return;
        this.openWindows[id].el.remove();
        delete this.openWindows[id];
        this.updateTaskbar();
    },

    minApp(id) {
        if (!this.openWindows[id]) return;
        this.openWindows[id].el.style.display = 'none';
        this.openWindows[id].minimized = true;
        this.updateTaskbar();
    },

    maxApp(id) {
        const w = this.openWindows[id];
        if (!w) return;
        if (!w.maximized) {
            w.oldRect = { l: w.el.style.left, t: w.el.style.top, w: w.el.style.width, h: w.el.style.height };
            w.el.style.left = '0px'; w.el.style.top = '0px';
            w.el.style.width = '100%'; w.el.style.height = '100%';
            w.maximized = true;
        } else {
            w.el.style.left = w.oldRect.l; w.el.style.top = w.oldRect.t;
            w.el.style.width = w.oldRect.w; w.el.style.height = w.oldRect.h;
            w.maximized = false;
        }
    },

    focusWindow(id) {
        if (!this.openWindows[id]) return;
        if (this.openWindows[id].minimized) {
            this.openWindows[id].el.style.display = 'flex';
            this.openWindows[id].minimized = false;
        }
        document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
        this.openWindows[id].el.classList.add('active');
        this.openWindows[id].el.style.zIndex = ++this.z;
        this.updateTaskbar();
    },

    updateTaskbar() {
        const tb = document.getElementById('taskbar-apps');
        tb.innerHTML = '';
        for (let id in this.openWindows) {
            const btn = document.createElement('div');
            btn.className = 'taskbar-item' + (this.openWindows[id].el.classList.contains('active') && !this.openWindows[id].minimized ? ' active' : '');
            btn.innerHTML = `${this.apps[id].icon} ${this.apps[id].title}`;
            btn.onclick = () => {
                if (btn.classList.contains('active')) this.minApp(id);
                else this.focusWindow(id);
            };
            tb.appendChild(btn);
        }
    },

    // Drag & Resize logic
    dragInfo: null,
    startDrag(e, id) {
        if (e.target.closest('.win-btn')) return;
        if (this.openWindows[id].maximized) return;
        this.focusWindow(id);
        const touch = e.touches ? e.touches[0] : e;
        const el = this.openWindows[id].el;
        this.dragInfo = {
            id, type: 'drag',
            startX: touch.clientX, startY: touch.clientY,
            initX: el.offsetLeft, initY: el.offsetTop
        };
        e.preventDefault();
    },
    startResize(e, id) {
        this.focusWindow(id);
        const touch = e.touches ? e.touches[0] : e;
        const el = this.openWindows[id].el;
        this.dragInfo = {
            id, type: 'resize',
            startX: touch.clientX, startY: touch.clientY,
            initW: el.offsetWidth, initH: el.offsetHeight
        };
        e.preventDefault();
        e.stopPropagation();
    },
    onMove(e) {
        if (!this.dragInfo) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - this.dragInfo.startX;
        const dy = touch.clientY - this.dragInfo.startY;
        const el = this.openWindows[this.dragInfo.id].el;
        
        if (this.dragInfo.type === 'drag') {
            el.style.left = (this.dragInfo.initX + dx) + 'px';
            el.style.top = Math.max(0, this.dragInfo.initY + dy) + 'px';
        } else if (this.dragInfo.type === 'resize') {
            el.style.width = Math.max(300, this.dragInfo.initW + dx) + 'px';
            el.style.height = Math.max(200, this.dragInfo.initH + dy) + 'px';
        }
    },
    onUp() { this.dragInfo = null; }
};

document.addEventListener('mousemove', e => os.onMove(e));
document.addEventListener('mouseup', () => os.onUp());
document.addEventListener('touchmove', e => os.onMove(e), {passive: false});
document.addEventListener('touchend', () => os.onUp());

// --- FAKE INTERNET CONTENT ---
const fwdDB = {
    'http://home.local': `
        <div class="fi-header">
            <h1 style="color:#1a5a9e; font-size:40px;">SearchHub 2009</h1>
            <marquee style="background:#ffd; padding:5px; border:1px solid #cc0;">Breaking News: Local library upgrades to Windows 7! | Weather: Cloudy, chance of rain.</marquee>
        </div>
        <div class="fi-searchbox">
            <input type="text" id="fi-q" placeholder="Search the web...">
            <button onclick="webEx.navigate('http://search.local?q=' + document.getElementById('fi-q').value)">Search</button>
        </div>
        <div style="display:flex; justify-content:center; gap:20px;">
            <div style="border:1px solid #ccc; padding:10px;"><b>Quick Links</b><br><a class="fi-result-link" onclick="webEx.navigate('http://dict.local')">Dictionary</a><br><a class="fi-result-link" onclick="webEx.navigate('http://dir.local')">Yellow Pages</a></div>
            <div style="border:1px solid #ccc; padding:10px; background:#eef;"><b>Ad</b><br>Download more RAM today!</div>
        </div>
    `,
    'http://dict.local': `
        <div class="fi-header"><h2>Dict.local - The Word Finder</h2></div>
        <div class="fi-searchbox">
            <input type="text" id="fi-dq" placeholder="Enter word...">
            <button onclick="webEx.navigate('http://dict.local/' + document.getElementById('fi-dq').value.toLowerCase())">Define</button>
        </div>
    `,
    'http://dir.local': `
        <div class="fi-header"><h2 style="background:#fd0; padding:10px;">Yellow Pages Local</h2></div>
        <div class="fi-body">
            <h3>Local Businesses</h3>
            <ul>
                <li><b>Joe's Pizza</b> - Call <span style="background:#ffc;">555-0192</span></li>
                <li><b>City Library</b> - Call <span style="background:#ffc;">555-READ</span></li>
                <li><b>Town Hall</b> - Call <span style="background:#ffc;">555-9999</span></li>
            </ul>
        </div>
    `
};

// Generative routes
function generateFakePage(url) {
    if (fwdDB[url]) return fwdDB[url];
    
    if (url.startsWith('http://search.local?q=')) {
        let q = url.split('=')[1].toLowerCase();
        q = decodeURIComponent(q).trim();
        let results = '';
        
        if (q.includes('falcon') || q.includes('cheetah') || q.includes('faster')) {
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/peregrine_falcon')">Peregrine Falcon - Wiki</a><div class="fi-result-url">http://wiki.local/peregrine_falcon</div><div class="fi-result-desc">The peregrine falcon is the fastest animal, reaching speeds over 240 mph...</div></div>`;
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/cheetah')">Cheetah - Wiki</a><div class="fi-result-url">http://wiki.local/cheetah</div><div class="fi-result-desc">The cheetah is the fastest land animal, running up to 70 mph...</div></div>`;
        } else if (q.includes('rome') || q.includes('athens') || q.includes('older')) {
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/athens')">Athens History</a><div class="fi-result-desc">Athens is one of the oldest named cities in the world...</div></div>`;
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/rome')">Rome History</a><div class="fi-result-desc">Rome was founded in 753 BC...</div></div>`;
        } else if (q.includes('jupiter') || q.includes('saturn') || q.includes('bigger')) {
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/jupiter')">Jupiter (Planet)</a><div class="fi-result-desc">Jupiter is the largest planet in the solar system...</div></div>`;
        } else if (q.includes('toaster') || q.includes('telephone') || q.includes('moon')) {
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/${q}')">${q.toUpperCase()} - Encyclopedia</a></div>`;
        } else if (q.includes('image') || q.includes('picture') || q.includes('dog') || q.includes('panda') || q.includes('eiffel')) {
            results += `<div class="fi-result-item"><a class="fi-result-link" onclick="webEx.navigate('http://images.local/${q}')">Image Search Results for ${q}</a></div>`;
        } else {
            results += `<div class="fi-result-item">No exact matches found. <a class="fi-result-link" onclick="webEx.navigate('http://wiki.local/${q}')">Search Wiki instead</a></div>`;
        }

        return `
            <div style="border-bottom:1px solid #ccc; padding:10px;"><img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='8' fill='blue'/></svg>" style="vertical-align:middle;"> <input type="text" value="${q}" id="s-q"><button onclick="webEx.navigate('http://search.local?q='+document.getElementById('s-q').value)">Search</button></div>
            <div class="fi-body fi-results">
                ${results}
            </div>
        `;
    }

    if (url.startsWith('http://dict.local/')) {
        let w = url.split('/').pop().toLowerCase();
        let def = "Word not found.";
        if (w === 'obfuscate') def = "To make obscure, unclear, or unintelligible.";
        if (w === 'ephemeral') def = "Lasting for a very short time.";
        if (w === 'synergy') def = "The interaction of elements that when combined produce a total effect that is greater than the sum of the individual elements.";
        return `<div class="fi-body"><a class="fi-result-link" onclick="webEx.navigate('http://dict.local')">Back</a><hr><h1>${w}</h1><p style="font-size:18px; background:#ffe; padding:10px; border-left:4px solid #c00;">${def}</p></div>`;
    }

    if (url.startsWith('http://wiki.local/')) {
        let topic = url.split('/').pop().toLowerCase();
        let content = "Article does not exist.";
        if (topic === 'toaster') content = "The first electric toaster was invented by Alan MacMasters in Edinburgh, Scotland in <b>1893</b>.";
        if (topic === 'telephone') content = "The telephone is a telecommunications device. Alexander Graham Bell was the first to be granted a United States patent for a device that produced clearly intelligible replication of the human voice in <b>1876</b>.";
        if (topic === 'moon' || topic === 'moon landing') content = "The Apollo 11 mission was the first manned moon landing, taking place in <b>1969</b>.";
        if (topic === 'peregrine_falcon') content = "Top speed: 240 mph (386 km/h) in a dive.";
        if (topic === 'cheetah') content = "Top speed: 70 mph (112 km/h) in short bursts.";
        if (topic === 'athens') content = "Continuously inhabited for over 3,400 years, making it significantly older than Rome.";
        if (topic === 'rome') content = "Founded in 753 BC.";
        if (topic === 'jupiter') content = "Radius: 43,440 miles. It is the biggest planet.";
        if (topic === 'saturn') content = "Radius: 36,183 miles.";
        if (topic === 'gustave_eiffel') content = "He is best known for the world-famous Eiffel Tower, built for the 1889 Universal Exposition in Paris.";

        return `
            <div class="fi-body">
                <div class="fi-wiki-title">${topic.replace('_', ' ').toUpperCase()}</div>
                <div class="fi-wiki-box"><b>Quick Facts</b><br>Verified Article 2009</div>
                <p style="margin-top:20px; line-height:1.6;">${content}</p>
            </div>
        `;
    }

    if (url.startsWith('http://images.local/')) {
        let q = url.split('/').pop().toLowerCase();
        return `
            <div class="fi-body">
                <h3>Images for ${q}</h3>
                <div class="fi-image-grid">
                    <div class="fi-image" onclick="questEngine.checkClick('cat')">🐈</div>
                    <div class="fi-image" onclick="questEngine.checkClick('dog')">🐕</div>
                    <div class="fi-image" onclick="questEngine.checkClick('panda')">🐼</div>
                    <div class="fi-image" onclick="questEngine.checkClick('tower')">🗼</div>
                    <div class="fi-image" onclick="questEngine.checkClick('moon')">🌕</div>
                    <div class="fi-image" onclick="questEngine.checkClick('bird')">🦅</div>
                </div>
                <p style="font-size:12px; color:#666; margin-top:20px;">Click an image to view full size.</p>
            </div>
        `;
    }

    return `
        <div class="fi-error">
            <h1>404 Not Found</h1>
            <p>The requested URL was not found on this server.</p>
        </div>
    `;
}

// --- WEBEXPLORER LOGIC ---
const webEx = {
    win: null,
    history: [],
    currentIdx: -1,
    isLoading: false,
    
    init(win) {
        this.win = win;
        const input = win.el.querySelector('.we-url');
        input.addEventListener('keydown', (e) => {
            audio.sfxType();
            if (e.key === 'Enter') this.go(input);
        });
        if (this.currentIdx === -1) {
            this.navigate('http://home.local');
        } else {
            this.renderCurrent();
        }
    },
    
    go(btn) {
        const url = this.win.el.querySelector('.we-url').value;
        this.navigate(url);
    },
    
    navigate(url) {
        if (this.isLoading) return;
        if (!url.startsWith('http')) url = 'http://' + url;
        
        // Trim history if we went back and navigate to new
        this.history = this.history.slice(0, this.currentIdx + 1);
        this.history.push(url);
        this.currentIdx++;
        
        this.loadPage(url);
    },
    
    goBack() {
        if (this.currentIdx > 0 && !this.isLoading) {
            this.currentIdx--;
            this.loadPage(this.history[this.currentIdx]);
        }
    },
    
    goForward() {
        if (this.currentIdx < this.history.length - 1 && !this.isLoading) {
            this.currentIdx++;
            this.loadPage(this.history[this.currentIdx]);
        }
    },

    refresh() {
        if (!this.isLoading && this.currentIdx >= 0) {
            this.loadPage(this.history[this.currentIdx]);
        }
    },

    loadPage(url) {
        if (!this.win || !this.win.el) return;
        this.isLoading = true;
        const input = this.win.el.querySelector('.we-url');
        const viewport = this.win.el.querySelector('.we-viewport');
        const statText = this.win.el.querySelector('.we-status-text');
        const progCont = this.win.el.querySelector('.we-progress-container');
        const progBar = this.win.el.querySelector('.we-progress-bar');
        
        input.value = url;
        viewport.innerHTML = '';
        statText.innerText = 'Connecting...';
        progCont.style.display = 'block';
        progBar.style.width = '5%';
        
        audio.sfxDialup();
        
        // Calculate load time based on upgrades
        let baseTime = Math.random() * 5000 + 3000; // 3 to 8 seconds
        if (state.upgrades.router) baseTime *= 0.7;
        if (state.upgrades.broadband) baseTime *= 0.4;
        
        // Error chance
        let errChance = state.upgrades.antivirus ? 0.05 : 0.20;
        let willFail = Math.random() < errChance;

        let steps = 5;
        let currentStep = 0;
        
        const loadInterval = setInterval(() => {
            currentStep++;
            progBar.style.width = (currentStep * 20) + '%';
            
            if (currentStep >= steps) {
                clearInterval(loadInterval);
                this.isLoading = false;
                progCont.style.display = 'none';
                
                if (willFail) {
                    audio.sfxError();
                    viewport.innerHTML = `
                        <div style="padding:40px; font-family:sans-serif;">
                            <h2 style="color:#0033cc;">Internet Explorer cannot display the webpage</h2>
                            <p>Most likely causes:<br>- You are not connected to the internet.<br>- The website is encountering problems.</p>
                            <button onclick="webEx.refresh()" style="padding:5px 10px; margin-top:20px;">Diagnose Connection Problems</button>
                        </div>`;
                    statText.innerText = 'Done, but with errors on page.';
                } else {
                    statText.innerText = 'Done';
                    viewport.innerHTML = generateFakePage(url);
                }
            }
        }, baseTime / steps);
    },

    renderCurrent() {
        if (this.currentIdx >= 0) {
            this.win.el.querySelector('.we-url').value = this.history[this.currentIdx];
            this.win.el.querySelector('.we-viewport').innerHTML = generateFakePage(this.history[this.currentIdx]);
        }
    }
};

// --- QUEST SYSTEM ---
const questsDB = [
    { id: 1, type: 'word', req: 'obfuscate', desc: "What does 'obfuscate' mean?", difficulty: 'easy', time: 90 },
    { id: 2, type: 'fact', req: '1893', desc: "What year was the electric toaster invented?", difficulty: 'easy', time: 90 },
    { id: 3, type: 'phone', req: '555-0192', desc: "What is the phone number for Joe's Pizza?", difficulty: 'easy', time: 90 },
    { id: 4, type: 'image', req: 'panda', desc: "Find me a picture of a panda.", difficulty: 'medium', time: 120 },
    { id: 5, type: 'compare', req: 'falcon', desc: "Which is faster: Cheetah or Peregrine Falcon?", difficulty: 'medium', time: 150 },
    { id: 6, type: 'fact', req: '1969', desc: "What year was the first manned moon landing?", difficulty: 'easy', time: 90 },
    { id: 7, type: 'word', req: 'ephemeral', desc: "Find the definition of 'ephemeral'. (Type the word back to me to confirm)", difficulty: 'easy', time: 90 },
    { id: 8, type: 'phone', req: '555-read', desc: "I need the number for the City Library.", difficulty: 'easy', time: 90 },
    { id: 9, type: 'image', req: 'dog', desc: "Find a picture of a dog.", difficulty: 'medium', time: 120 },
    { id: 10, type: 'compare', req: 'athens', desc: "Which city is older: Rome or Athens?", difficulty: 'hard', time: 180 },
    { id: 11, type: 'word', req: 'synergy', desc: "What is the definition of 'synergy'?", difficulty: 'medium', time: 120 },
    { id: 12, type: 'fact', req: '1876', desc: "In what year was the telephone patented by Bell?", difficulty: 'medium', time: 120 },
    { id: 13, type: 'phone', req: '555-9999', desc: "What is the phone number for the Town Hall?", difficulty: 'easy', time: 90 },
    { id: 14, type: 'image', req: 'tower', desc: "Can you find an image of the Eiffel Tower?", difficulty: 'medium', time: 120 },
    { id: 15, type: 'compare', req: 'jupiter', desc: "Which planet is bigger: Jupiter or Saturn?", difficulty: 'hard', time: 180 }
];

const questEngine = {
    activeQuest: null,
    timer: null,
    timeLeft: 0,
    totalTime: 0,
    
    startRandomQuest() {
        if (this.activeQuest) return;
        
        // Filter out completed ones, or recycle if all done
        let available = questsDB.filter(q => !state.completedQuests.includes(q.id));
        if (available.length === 0) available = questsDB; // loop
        
        const q = available[Math.floor(Math.random() * available.length)];
        this.activeQuest = q;
        this.totalTime = q.time;
        this.timeLeft = q.time;
        
        audio.sfxDing();
        this.renderQuestUI();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerUI();
            if (this.timeLeft <= 0) {
                this.failQuest();
            }
        }, 1000);
    },
    
    renderQuestUI() {
        const area = document.getElementById('notification-area');
        area.innerHTML = `
            <div class="balloon" id="active-balloon">
                <div class="quest-header">Patron Request (${this.activeQuest.difficulty})</div>
                <div class="quest-body">"${this.activeQuest.desc}"</div>
                ${this.activeQuest.type !== 'image' ? `
                    <div class="quest-input-area">
                        <input type="text" id="quest-answer" placeholder="Type answer...">
                        <button onclick="questEngine.checkTextAnswer()">Submit</button>
                    </div>
                ` : `<div style="font-size:12px; color:#555;">(Click the correct image on the web)</div>`}
                <div class="quest-timer"><div class="quest-timer-fill" id="q-timer-fill"></div></div>
            </div>
        `;
    },
    
    updateTimerUI() {
        const fill = document.getElementById('q-timer-fill');
        if (fill) {
            const pct = (this.timeLeft / this.totalTime) * 100;
            fill.style.width = pct + '%';
            if (pct < 25) fill.style.background = '#f00';
            else if (pct < 50) fill.style.background = '#fa0';
        }
    },
    
    checkTextAnswer() {
        if (!this.activeQuest) return;
        const input = document.getElementById('quest-answer').value.toLowerCase().trim();
        if (input.includes(this.activeQuest.req)) {
            this.winQuest();
        } else {
            // wrong answer feedback
            const btn = document.querySelector('.quest-input-area button');
            btn.innerText = "Wrong!";
            btn.style.color = "red";
            setTimeout(() => { btn.innerText = "Submit"; btn.style.color = ""; }, 1000);
        }
    },
    
    checkClick(imageId) {
        if (!this.activeQuest || this.activeQuest.type !== 'image') return;
        if (imageId === this.activeQuest.req) {
            this.winQuest();
        } else {
            audio.sfxError();
        }
    },
    
    winQuest() {
        clearInterval(this.timer);
        
        let baseReward = 0;
        if (this.activeQuest.difficulty === 'easy') baseReward = 15;
        if (this.activeQuest.difficulty === 'medium') baseReward = 35;
        if (this.activeQuest.difficulty === 'hard') baseReward = 65;
        
        // Time bonus
        if (this.timeLeft > this.totalTime / 2) baseReward = Math.floor(baseReward * 1.5);
        
        game.addLC(baseReward);
        state.completedQuests.push(this.activeQuest.id);
        
        document.getElementById('notification-area').innerHTML = `
            <div class="balloon" style="background:#eaffea;">
                <b>Thank you!</b><br>You earned ${baseReward} LC.
            </div>
        `;
        setTimeout(() => document.getElementById('notification-area').innerHTML = '', 3000);
        
        this.activeQuest = null;
        game.scheduleSave();
        
        // Schedule next quest
        setTimeout(() => this.startRandomQuest(), Math.random() * 10000 + 10000);
    },
    
    failQuest() {
        clearInterval(this.timer);
        document.getElementById('notification-area').innerHTML = `
            <div class="balloon" style="background:#ffeaea;">
                <b>Too slow!</b><br>The patron left in frustration.
            </div>
        `;
        audio.sfxError();
        setTimeout(() => document.getElementById('notification-area').innerHTML = '', 3000);
        this.activeQuest = null;
        setTimeout(() => this.startRandomQuest(), Math.random() * 10000 + 15000);
    }
};

// --- SHOP SYSTEM ---
const shopItems = [
    { id: 'coffee', name: 'Coffee Mug', desc: 'A nice warm mug for the desk.', price: 30, upg: 'mug' },
    { id: 'lamp', name: 'Desk Lamp', desc: 'Adds warm lighting to your workspace.', price: 40, upg: 'lamp' },
    { id: 'notepadPro', name: 'Notepad Pro', desc: 'Dark mode for your eyes.', price: 50, upg: 'notepadPro' },
    { id: 'router', name: 'Better Router', desc: 'Reduces page load times by 30%.', price: 100, upg: 'router' },
    { id: 'antivirus', name: 'Anti-Virus', desc: 'Reduces connection errors.', price: 80, upg: 'antivirus' },
    { id: 'broadband', name: 'Broadband Upgrade', desc: 'Major speed boost!', price: 150, upg: 'broadband' }
];

const shop = {
    render() {
        const container = document.getElementById('shop-list');
        if (!container) return;
        container.innerHTML = '<h2>Library Upgrade Shop</h2><p>Spend your LC to make your job easier.</p>';
        
        shopItems.forEach(item => {
            const owned = state.upgrades[item.upg];
            const canAfford = state.lc >= item.price;
            
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-icon">${item.id==='coffee'?'☕':item.id==='lamp'?'💡':item.id==='router'?'📻':'📦'}</div>
                <div class="shop-item-details">
                    <div class="shop-item-title">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                </div>
                <div>
                    ${owned ? '<span style="color:green; font-weight:bold;">✔ Owned</span>' : 
                        `<button class="shop-item-buy" ${!canAfford?'disabled':''} onclick="shop.buy('${item.id}')">${item.price} LC</button>`}
                </div>
            `;
            container.appendChild(div);
        });
    },
    
    buy(id) {
        const item = shopItems.find(i => i.id === id);
        if (item && state.lc >= item.price && !state.upgrades[item.upg]) {
            game.addLC(-item.price);
            state.upgrades[item.upg] = true;
            this.render();
            game.applyVisualUpgrades();
            game.scheduleSave();
        }
    }
};

// --- GAME CORE & LOOP ---
const game = {
    saveTimeout: null,
    
    boot() {
        document.getElementById('power-button').classList.add('on');
        document.getElementById('boot-msg').innerHTML = "Loading Windows 7...<br>Starting services...";
        setTimeout(() => {
            document.getElementById('boot-screen').style.display = 'none';
            document.getElementById('os-desktop').style.display = 'block';
            audio.sfxStartup();
            
            // Initial quest start
            setTimeout(() => questEngine.startRandomQuest(), 5000);
        }, 2000);
    },

    init() {
        this.loadGame();
        this.updateLCDisplay();
        this.applyVisualUpgrades();
        
        // Clock & Ambient Loop
        setInterval(this.updateEnvironment, 60000); // every minute
        this.updateEnvironment(); // initial call
        
        // Daily Bonus
        const today = new Date().toDateString();
        if (state.lastLogin !== today) {
            this.addLC(5);
            state.lastLogin = today;
            alert("Daily Bonus! +5 LC added to your balance.");
            this.scheduleSave();
        }
    },

    updateEnvironment() {
        const d = new Date();
        // Clock
        let h = d.getHours();
        let m = d.getMinutes();
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; h = h ? h : 12;
        m = m < 10 ? '0' + m : m;
        document.getElementById('clock').innerText = `${h}:${m} ${ampm}`;

        // Lighting
        const hr = d.getHours();
        const root = document.documentElement;
        if (hr >= 6 && hr < 12) root.style.setProperty('--desk-color', '#a07040'); // morning
        else if (hr >= 12 && hr < 17) root.style.setProperty('--desk-color', '#8b5a2b'); // afternoon
        else if (hr >= 17 && hr < 20) root.style.setProperty('--desk-color', '#6b3e15'); // evening
        else root.style.setProperty('--desk-color', '#3a200a'); // night
    },

    applyVisualUpgrades() {
        if (state.upgrades.mug) {
            document.getElementById('coffee-mug-item').style.opacity = '1';
        }
        if (state.upgrades.lamp) {
            document.getElementById('lamp-item').style.opacity = '1';
            document.documentElement.style.setProperty('--ambient-light', 'rgba(255, 255, 100, 0.4)');
        }
        
        // Network icon update
        const netIcon = document.getElementById('net-icon');
        if (state.upgrades.broadband) netIcon.innerText = '📶';
        else if (state.upgrades.router) netIcon.innerText = '📶-';
    },

    addLC(amount) {
        state.lc += amount;
        this.updateLCDisplay();
        if (amount > 0) audio.sfxCoin();
    },

    updateLCDisplay() {
        document.getElementById('lc-display').innerText = state.lc;
    },

    scheduleSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveGame(), 2000);
    },

    saveGame(force=false) {
        localStorage.setItem('quietDeskSave', JSON.stringify(state));
        const icon = document.getElementById('save-icon');
        icon.style.opacity = '1';
        setTimeout(() => icon.style.opacity = '0', 1000);
        if (force) document.getElementById('start-menu').classList.remove('show');
    },

    loadGame() {
        const saved = localStorage.getItem('quietDeskSave');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                state.lc = p.lc || 0;
                state.upgrades = p.upgrades || state.upgrades;
                state.notepadText = p.notepadText || state.notepadText;
                state.lastLogin = p.lastLogin || null;
                state.completedQuests = p.completedQuests || [];
            } catch (e) { console.error("Save corrupted"); }
        }
    }
};

// Start
window.onload = () => {
    game.init();
};
