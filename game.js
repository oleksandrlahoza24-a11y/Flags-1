/**
 * THE QUIET DESK - Core Game Logic
 */

const OS = {
    lc: 0,
    completedQuests: 0,
    inventory: [],
    windows: [],
    activeQuest: null,
    connectionSpeed: 1, // 1 is default, higher = slower delay
    connectionFailRate: 0.2,
    onlineResources: null,
    zCounter: 100,
    saveTimer: 0
};

// --- DATA: QUESTS ---
const QUEST_POOL = [
    { id: 1, type: 'FACT', patron: 'Mrs. Higgins', q: "What year was the Great Fire of London?", a: "1666", t: 60, r: 20 },
    { id: 2, type: 'WORD', patron: 'Young Timmy', q: "What is the definition of 'Ephemeral'?", a: "lasting for a very short time", t: 45, r: 15 },
    { id: 3, type: 'PHONE', patron: 'Mr. Henderson', q: "Find the phone number for 'Joe's Pizza Shop'.", a: "555-0192", t: 90, r: 30 },
    { id: 4, type: 'IMAGE', patron: 'Lila', q: "I need to see what a 'Capybara' looks like. Find an image.", a: "capybara.jpg", t: 60, r: 25 },
    { id: 5, type: 'FACT', patron: 'Prof. Oak', q: "Who wrote 'The Great Gatsby'?", a: "F. Scott Fitzgerald", t: 50, r: 20 },
    { id: 6, type: 'COMPARE', patron: 'Builder Bob', q: "Which is taller: Eiffel Tower or Empire State Building?", a: "Empire State Building", t: 120, r: 50 },
    { id: 7, type: 'FACT', patron: 'Mrs. Higgins', q: "What is the atomic number of Gold?", a: "79", t: 40, r: 25 },
    { id: 8, type: 'WORD', patron: 'Artist Aria', q: "Define 'Chiaroscuro'.", a: "treatment of light and shade", t: 60, r: 25 },
    { id: 9, type: 'PHONE', patron: 'Grumpy Gus', q: "Number for the City Council Office?", a: "555-9000", t: 80, r: 40 },
    { id: 10, type: 'IMAGE', patron: 'Kid Ken', q: "Find a photo of the Planet Saturn.", a: "saturn.png", t: 70, r: 30 },
    { id: 11, type: 'FACT', patron: 'Historian Hal', q: "Year of the first Moon Landing?", a: "1969", t: 50, r: 35 },
    { id: 12, type: 'WORD', patron: 'Young Timmy', q: "What does 'Quixotic' mean?", a: "unrealistic and impractical", t: 60, r: 25 },
    { id: 13, type: 'FACT', patron: 'Lila', q: "How many legs does a lobster have?", a: "10", t: 40, r: 20 },
    { id: 14, type: 'PHONE', patron: 'Mr. Henderson', q: "Phone number for 'The Quiet Desk Library'?", a: "555-8243", t: 60, r: 30 },
    { id: 15, type: 'COMPARE', patron: 'Prof. Oak', q: "Is a Blue Whale faster than a Dolphin?", a: "No", t: 90, r: 60 }
];

// --- DATA: FAKE INTERNET ---
const WEB_CONTENT = {
    'google.com': `<h1>WebSearch</h1><p>Search the global web.</p><input type="text" style="width:80%"><button>Search</button>`,
    'wiki.org': `<h1>Encyclopedia Libre</h1><p>The free encyclopedia anyone can edit.</p>
        <ul>
            <li><b>Great Fire of London:</b> Started Sept 2, 1666.</li>
            <li><b>Great Gatsby:</b> Written by F. Scott Fitzgerald in 1925.</li>
            <li><b>Moon Landing:</b> Apollo 11 landed in 1969.</li>
            <li><b>Lobster:</b> Decapod crustacean with 10 legs.</li>
            <li><b>Saturn:</b> Sixth planet from the Sun. <span style="color:blue">[View Image: saturn.png]</span></li>
        </ul>`,
    'dictionary.com': `<h1>Defined!</h1>
        <p><b>Ephemeral:</b> lasting for a very short time.</p>
        <p><b>Chiaroscuro:</b> the treatment of light and shade in drawing and painting.</p>
        <p><b>Quixotic:</b> exceedingly idealistic; unrealistic and impractical.</p>`,
    'yellowpages.com': `<h1>Local Directory</h1>
        <p>Joe's Pizza Shop: 555-0192</p>
        <p>City Council: 555-9000</p>
        <p>Library Front Desk: 555-8243</p>`,
    'imagesearch.net': `<h1>ImgFind</h1>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div style="background:#eee;padding:10px;">[Capybara Photo: capybara.jpg]</div>
            <div style="background:#eee;padding:10px;">[Saturn Photo: saturn.png]</div>
            <div style="background:#eee;padding:10px;">[Eiffel Tower: eiffel.jpg]</div>
        </div>`,
    'factcheck.com': `<h1>FactCheck</h1>
        <p><b>Eiffel Tower:</b> 330 meters tall.</p>
        <p><b>Empire State Building:</b> 381 meters tall.</p>
        <p><b>Dolphin Speed:</b> Up to 37 mph.</p>
        <p><b>Blue Whale Speed:</b> Up to 30 mph.</p>`
};

// --- AUDIO ENGINE ---
const AudioEngine = {
    ctx: null,
    init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    beep(freq, type, duration, vol = 0.1) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    playModem() {
        this.beep(800, 'square', 0.2, 0.05);
        setTimeout(() => this.beep(1200, 'sawtooth', 0.1, 0.03), 200);
        setTimeout(() => this.beep(400, 'sine', 0.5, 0.05), 300);
    },
    playError() { this.beep(150, 'sawtooth', 0.5, 0.1); },
    playCoin() { this.beep(880, 'sine', 0.1, 0.1); setTimeout(() => this.beep(1046, 'sine', 0.2, 0.1), 100); },
    playStartup() {
        const notes = [261, 329, 392, 523];
        notes.forEach((f, i) => setTimeout(() => this.beep(f, 'sine', 0.6, 0.05), i * 150));
    }
};

// --- CORE OS LOGIC ---
const OSManager = {
    init() {
        this.renderDesktop();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.loadGame();
        
        document.addEventListener('touchstart', (e) => {
            if(AudioEngine.ctx === null) {
                AudioEngine.init();
                AudioEngine.playStartup();
            }
        }, { once: true });

        // Auto-save loop
        setInterval(() => this.saveGame(), 30000);

        // Start Quest loop
        setTimeout(() => this.triggerQuest(), 5000);

        // Right click simulation
        document.getElementById('desktop').addEventListener('contextmenu', e => {
            e.preventDefault();
            const menu = document.getElementById('ctx-menu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        });
        document.addEventListener('click', () => document.getElementById('ctx-menu').style.display = 'none');
    },

    updateClock() {
        const now = new Date();
        document.getElementById('tray-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Ambient Lighting Cycle
        const hour = now.getHours();
        const desk = document.getElementById('library-desk');
        if(hour >= 6 && hour < 12) desk.style.filter = "sepia(0.2) brightness(1.1)";
        else if(hour >= 12 && hour < 18) desk.style.filter = "none";
        else if(hour >= 18 && hour < 21) desk.style.filter = "hue-rotate(-30deg) brightness(0.8)";
        else desk.style.filter = "brightness(0.5) saturate(0.5)";
    },

    renderDesktop() {
        const apps = [
            { name: 'My Computer', icon: '💻', action: () => this.openWindow('Computer') },
            { name: 'WebExplorer', icon: '🌍', action: () => this.openWindow('Browser') },
            { name: 'Notepad', icon: '📝', action: () => this.openWindow('Notepad') },
            { name: 'Library Shop', icon: '🏪', action: () => this.openWindow('Shop') },
            { name: 'Recycle Bin', icon: '🗑️', action: () => {} }
        ];
        const grid = document.getElementById('icon-grid');
        grid.innerHTML = '';
        apps.forEach(app => {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.innerHTML = `<div class="icon-img" style="font-size:40px">${app.icon}</div><div>${app.name}</div>`;
            div.onclick = app.action;
            grid.appendChild(div);
        });
    },

    openWindow(type) {
        const id = 'win-' + Date.now();
        const win = document.createElement('div');
        win.id = id;
        win.className = 'window active';
        win.style.left = (50 + OS.windows.length * 30) + 'px';
        win.style.top = (50 + OS.windows.length * 30) + 'px';
        win.style.zIndex = ++OS.zCounter;

        let content = '';
        let title = type;

        if(type === 'Browser') {
            title = 'WebExplorer';
            content = `
                <div class="browser-ui">
                    <div class="address-bar-wrap">
                        <button class="win-btn">◀</button>
                        <button class="win-btn">▶</button>
                        <input type="text" class="address-bar" id="url-${id}" value="msn.com" placeholder="Enter URL...">
                        <button class="browser-go" onclick="OSManager.navigate('${id}')">Go</button>
                    </div>
                    <div class="loading-bar-container"><div id="progress-${id}" class="browser-progress" style="height:100%; width:0; background:var(--win-blue); transition: width 0.5s;"></div></div>
                </div>
                <div id="web-content-${id}" class="web-frame">
                    <h2>Welcome to MSN 2009</h2>
                    <p>Current Weather: ☁️ Cloudy</p>
                    <hr>
                    <h3>Trending Searches:</h3>
                    <ul>
                        <li><a href="#" onclick="OSManager.quickNav('${id}', 'wiki.org')">Wikipedia</a></li>
                        <li><a href="#" onclick="OSManager.quickNav('${id}', 'dictionary.com')">Dictionary</a></li>
                        <li><a href="#" onclick="OSManager.quickNav('${id}', 'yellowpages.com')">Yellow Pages</a></li>
                    </ul>
                </div>
            `;
        } else if(type === 'Notepad') {
            content = `<textarea class="notepad-textarea" placeholder="Type research notes here..." oninput="OS.notepad = this.value">${OS.notepad || ''}</textarea>`;
        } else if(type === 'Shop') {
            content = `<div class="shop-grid">${this.renderShop()}</div>`;
        } else if(type === 'Computer') {
            content = `<div style="padding:20px;">
                <p>💽 Local Disk (C:)</p>
                <div style="margin-left:20px;">
                    <p>📁 Program Files</p>
                    <p>📁 Users</p>
                </div>
                <p>💿 CD Drive (D:) - Empty</p>
                <p>🔗 Library Network (Z:)</p>
            </div>`;
        }

        win.innerHTML = `
            <div class="titlebar" onmousedown="OSManager.startDrag(event, '${id}')" ontouchstart="OSManager.startDrag(event, '${id}')">
                <span class="title-text">${title}</span>
                <div class="win-controls">
                    <div class="win-btn" onclick="OSManager.focusWindow('${id}')">_</div>
                    <div class="win-btn close" onclick="OSManager.closeWindow('${id}')">X</div>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById('window-container').appendChild(win);
        OS.windows.push(id);
        this.focusWindow(id);
        this.updateTaskbar();
    },

    closeWindow(id) {
        document.getElementById(id).remove();
        OS.windows = OS.windows.filter(w => w !== id);
        this.updateTaskbar();
    },

    focusWindow(id) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) {
            target.classList.add('active');
            target.style.zIndex = ++OS.zCounter;
        }
    },

    updateTaskbar() {
        const bar = document.getElementById('taskbar-apps');
        bar.innerHTML = '';
        OS.windows.forEach(id => {
            const btn = document.createElement('div');
            btn.className = 'taskbar-item active';
            btn.innerHTML = '🔲';
            btn.onclick = () => this.focusWindow(id);
            bar.appendChild(btn);
        });
    },

    startDrag(e, id) {
        const win = document.getElementById(id);
        this.focusWindow(id);
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        let startX = touch.clientX - win.offsetLeft;
        let startY = touch.clientY - win.offsetTop;

        const move = (ev) => {
            const t = ev.type === 'touchmove' ? ev.touches[0] : ev;
            win.style.left = (t.clientX - startX) + 'px';
            win.style.top = (t.clientY - startY) + 'px';
        };

        const stop = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stop);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', stop);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stop);
        document.addEventListener('touchmove', move);
        document.addEventListener('touchend', stop);
    },

    // --- BROWSER SIMULATION ---
    quickNav(id, url) {
        const input = document.getElementById('url-' + id);
        input.value = url;
        this.navigate(id);
    },

    navigate(id) {
        const url = document.getElementById('url-' + id).value.toLowerCase();
        const display = document.getElementById('web-content-' + id);
        const progress = document.getElementById('progress-' + id);
        
        AudioEngine.playModem();
        display.innerHTML = '<div class="ie-error"><h2>Connecting...</h2><p>Establishing dial-up connection...</p></div>';
        
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15;
            progress.style.width = Math.min(p, 100) + '%';
            
            if(p >= 100) {
                clearInterval(interval);
                this.loadFinalPage(url, display);
                setTimeout(() => progress.style.width = '0%', 500);
            }
        }, 300 * OS.connectionSpeed);
    },

    loadFinalPage(url, container) {
        if(Math.random() < OS.connectionFailRate) {
            AudioEngine.playError();
            container.innerHTML = `
                <div class="ie-error">
                    <h1 style="color:#003399">Internet Explorer cannot display the webpage</h1>
                    <p>What you can try:</p>
                    <ul>
                        <li>Diagnose Connection Problems</li>
                        <li>Check your typing</li>
                    </ul>
                </div>`;
            return;
        }

        const raw = WEB_CONTENT[url] || `<h1>404 Not Found</h1><p>The server at ${url} is not responding.</p>`;
        
        // Stage 1: Raw HTML
        container.innerHTML = raw.replace(/<[^>]*>/g, ''); 
        
        // Stage 2: Add structure after delay
        setTimeout(() => {
            container.innerHTML = raw;
            AudioEngine.beep(400, 'sine', 0.1, 0.05);
        }, 1000);
    },

    // --- QUEST SYSTEM ---
    triggerQuest() {
        if(OS.activeQuest) return;

        const available = QUEST_POOL.filter(q => !OS.inventory.includes('completed_' + q.id));
        if(available.length === 0) return;

        const q = available[Math.floor(Math.random() * available.length)];
        OS.activeQuest = {...q, timeLeft: q.t};

        const ball = document.createElement('div');
        ball.className = 'quest-balloon';
        ball.id = 'active-quest-balloon';
        ball.innerHTML = `
            <div style="font-weight:bold;margin-bottom:5px;">🔔 New Request: ${q.patron}</div>
            <div style="font-size:14px;">"${q.q}"</div>
            <div style="margin-top:10px;"><input type="text" id="quest-ans" style="width:100px;"> <button onclick="OSManager.submitQuest()">Submit</button></div>
            <div id="quest-timer" style="height:4px;background:red;width:100%;margin-top:10px;"></div>
        `;
        document.getElementById('notification-center').appendChild(ball);
        AudioEngine.beep(600, 'sine', 0.3, 0.1);

        const timer = setInterval(() => {
            OS.activeQuest.timeLeft--;
            const pct = (OS.activeQuest.timeLeft / OS.activeQuest.t) * 100;
            document.getElementById('quest-timer').style.width = pct + '%';

            if(OS.activeQuest.timeLeft <= 0) {
                clearInterval(timer);
                this.failQuest();
            }
            if(!OS.activeQuest) clearInterval(timer);
        }, 1000);
    },

    submitQuest() {
        const val = document.getElementById('quest-ans').value.trim().toLowerCase();
        const correct = OS.activeQuest.a.toLowerCase();

        if(val === correct || (val.length > 3 && correct.includes(val))) {
            const reward = Math.floor(OS.activeQuest.r * (OS.activeQuest.timeLeft > OS.activeQuest.t / 2 ? 1.5 : 1));
            OS.lc += reward;
            OS.completedQuests++;
            OS.inventory.push('completed_' + OS.activeQuest.id);
            AudioEngine.playCoin();
            this.removeQuest();
            this.updateStats();
            setTimeout(() => this.triggerQuest(), 8000);
        } else {
            AudioEngine.playError();
            document.getElementById('quest-ans').style.border = '2px solid red';
        }
    },

    failQuest() {
        this.removeQuest();
        setTimeout(() => this.triggerQuest(), 10000);
    },

    removeQuest() {
        OS.activeQuest = null;
        const ball = document.getElementById('active-quest-balloon');
        if(ball) ball.remove();
    },

    // --- SHOP & ECONOMY ---
    renderShop() {
        const items = [
            { id: 'router', name: 'Pro Router', desc: '30% Faster Loading', price: 100 },
            { id: 'antivirus', name: 'Anti-Virus', desc: 'Fewer Web Errors', price: 80 },
            { id: 'coffee', name: 'Hot Coffee', desc: 'Cosmetic Mug', price: 30 },
            { id: 'broadband', name: 'Broadband', desc: '60% Faster Loading', price: 250 }
        ];

        return items.map(it => {
            const owned = OS.inventory.includes(it.id);
            return `
                <div class="shop-item">
                    <b>${it.name}</b>
                    <small>${it.desc}</small>
                    <p>${it.price} LC</p>
                    <button ${owned || OS.lc < it.price ? 'disabled' : ''} onclick="OSManager.buyItem('${it.id}', ${it.price})">
                        ${owned ? 'Owned' : 'Buy'}
                    </button>
                </div>
            `;
        }).join('');
    },

    buyItem(id, price) {
        if(OS.lc >= price) {
            OS.lc -= price;
            OS.inventory.push(id);
            if(id === 'router') OS.connectionSpeed = 0.7;
            if(id === 'broadband') OS.connectionSpeed = 0.3;
            if(id === 'antivirus') OS.connectionFailRate = 0.05;
            if(id === 'coffee') document.getElementById('desk-mug').style.background = '#6F4E37';
            
            this.updateStats();
            // Refresh shop windows
            document.querySelectorAll('.window').forEach(w => {
                if(w.querySelector('.shop-grid')) w.querySelector('.window-content').innerHTML = `<div class="shop-grid">${this.renderShop()}</div>`;
            });
        }
    },

    updateStats() {
        document.getElementById('stat-lc').innerText = OS.lc;
        document.getElementById('stat-completed').innerText = OS.completedQuests;
    },

    // --- PERSISTENCE ---
    saveGame() {
        const data = {
            lc: OS.lc,
            completedQuests: OS.completedQuests,
            inventory: OS.inventory,
            notepad: OS.notepad
        };
        localStorage.setItem('quiet_desk_save', JSON.stringify(data));
        document.getElementById('tray-status').innerText = 'System Saved';
        setTimeout(() => document.getElementById('tray-status').innerText = 'Online', 2000);
    },

    loadGame() {
        const raw = localStorage.getItem('quiet_desk_save');
        if(raw) {
            const data = JSON.parse(raw);
            OS.lc = data.lc || 0;
            OS.completedQuests = data.completedQuests || 0;
            OS.inventory = data.inventory || [];
            OS.notepad = data.notepad || '';
            this.updateStats();
        }
    }
};

window.onload = () => OSManager.init();
