/**
 * THE QUIET DESK - Core Game Logic
 */

const Game = {
    credits: 0,
    ownedItems: [],
    notepadContent: "",
    lastLogin: Date.now(),
    connectionSpeed: 1, // Multiplier for loading
    errorRate: 0.2,
    unlockedQuests: 1,
    activeQuest: null,
    questTimer: null,
    audioContext: null,
    isMuted: false,

    init() {
        this.loadGame();
        this.updateClock();
        this.setupEventListeners();
        this.renderDesktop();
        this.startAmbientLoop();
        this.checkDailyBonus();
        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.saveGame(), 30000);
        
        // Initial Startup Sound
        this.initAudio();
        setTimeout(() => this.playSynthSound('startup'), 500);

        // First quest after 5 seconds
        setTimeout(() => this.spawnQuest(), 5000);
    },

    // --- SYSTEMS ---

    setupEventListeners() {
        document.getElementById('pc-screen').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const menu = document.getElementById('context-menu');
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
        });

        document.addEventListener('click', () => {
            document.getElementById('context-menu').style.display = 'none';
        });

        document.getElementById('mute-btn').addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            document.getElementById('mute-btn').innerText = this.isMuted ? '🔊' : '🔇';
        });

        document.getElementById('accept-quest-btn').addEventListener('click', () => {
            this.focusApp('webexplorer');
            document.getElementById('quest-notification').style.display = 'none';
        });
    },

    updateClock() {
        const now = new Date();
        document.getElementById('clock-display').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Ambient cycle
        const hour = now.getHours();
        const desk = document.getElementById('library-desk');
        if (hour >= 6 && hour < 12) desk.style.background = 'radial-gradient(circle at center, #8d6e63 0%, #2b1d1d 100%)'; // Morning
        else if (hour >= 12 && hour < 17) desk.style.background = 'radial-gradient(circle at center, #5d4037 0%, #2b1d1d 100%)'; // Day
        else if (hour >= 17 && hour < 20) desk.style.background = 'radial-gradient(circle at center, #bf360c 0%, #2b1d1d 100%)'; // Sunset
        else desk.style.background = 'radial-gradient(circle at center, #1a237e 0%, #000 100%)'; // Night
    },

    // --- WINDOW MANAGEMENT ---

    windows: {},
    zCounter: 100,

    createWindow(id, title, contentHTML, iconClass) {
        if (this.windows[id]) {
            this.focusWindow(id);
            return;
        }

        const win = document.createElement('div');
        win.id = `win-${id}`;
        win.className = 'window active-window';
        win.style.width = '800px';
        win.style.height = '600px';
        win.style.left = (50 + (Object.keys(this.windows).length * 30)) + 'px';
        win.style.top = (50 + (Object.keys(this.windows).length * 30)) + 'px';
        win.style.zIndex = ++this.zCounter;

        win.innerHTML = `
            <div class="title-bar" onmousedown="Game.dragStart(event, '${id}')" ontouchstart="Game.dragStart(event, '${id}')">
                <div class="title-text"><div class="icon-img ${iconClass}" style="width:20px;height:20px"></div> ${title}</div>
                <div class="window-controls">
                    <button class="win-btn win-min" onclick="Game.minimizeWindow('${id}')">_</button>
                    <button class="win-btn win-max">□</button>
                    <button class="win-btn win-close" onclick="Game.closeWindow('${id}')">X</button>
                </div>
            </div>
            <div class="window-content">${contentHTML}</div>
        `;

        document.getElementById('window-container').appendChild(win);
        this.windows[id] = { minimized: false };
        this.addBarIcon(id, title, iconClass);
        this.focusWindow(id);
    },

    focusWindow(id) {
        Object.keys(this.windows).forEach(k => {
            const el = document.getElementById(`win-${k}`);
            if (el) el.classList.remove('active-window');
        });
        const active = document.getElementById(`win-${id}`);
        if (active) {
            active.classList.add('active-window');
            active.style.zIndex = ++this.zCounter;
            active.style.display = 'flex';
        }
    },

    closeWindow(id) {
        const el = document.getElementById(`win-${id}`);
        if (el) el.remove();
        const icon = document.getElementById(`bar-icon-${id}`);
        if (icon) icon.remove();
        delete this.windows[id];
    },

    minimizeWindow(id) {
        const el = document.getElementById(`win-${id}`);
        if (el) el.style.display = 'none';
    },

    addBarIcon(id, title, iconClass) {
        const bar = document.getElementById('running-apps');
        const item = document.createElement('div');
        item.id = `bar-icon-${id}`;
        item.className = 'taskbar-item';
        item.innerHTML = `<div class="icon-img ${iconClass}" style="width:30px;height:30px"></div>`;
        item.onclick = () => {
            const el = document.getElementById(`win-${id}`);
            if (el.style.display === 'none') {
                el.style.display = 'flex';
                this.focusWindow(id);
            } else {
                this.minimizeWindow(id);
            }
        };
        bar.appendChild(item);
    },

    dragStart(e, id) {
        this.focusWindow(id);
        const win = document.getElementById(`win-${id}`);
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        const startX = touch.clientX - win.offsetLeft;
        const startY = touch.clientY - win.offsetTop;

        const move = (me) => {
            const mt = me.type === 'touchmove' ? me.touches[0] : me;
            win.style.left = (mt.clientX - startX) + 'px';
            win.style.top = (mt.clientY - startY) + 'px';
        };

        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', move);
        document.addEventListener('touchend', up);
    },

    // --- APP CONTENT ---

    renderDesktop() {
        const icons = [
            { id: 'computer', name: 'My Computer', class: 'icon-computer', app: 'computer' },
            { id: 'explorer', name: 'WebExplorer', class: 'icon-browser', app: 'webexplorer' },
            { id: 'notepad', name: 'Notepad', class: 'icon-notepad', app: 'notepad' },
            { id: 'docs', name: 'My Documents', class: 'icon-folder', app: 'docs' },
            { id: 'shop', name: 'Library Shop', class: 'icon-folder', app: 'shop' }
        ];

        const container = document.getElementById('desktop-icons');
        icons.forEach(icon => {
            const div = document.createElement('div');
            div.className = 'icon';
            div.innerHTML = `<div class="icon-img ${icon.class}"></div><span>${icon.name}</span>`;
            div.onclick = () => this.focusApp(icon.app);
            container.appendChild(div);
        });
    },

    focusApp(appId) {
        switch(appId) {
            case 'notepad':
                this.createWindow('notepad', 'Notepad', `<textarea class="notepad-area" id="notepad-text" oninput="Game.saveNotepad()">${this.notepadContent}</textarea>`, 'icon-notepad');
                break;
            case 'webexplorer':
                this.createWindow('webexplorer', 'WebExplorer 8', `
                    <div class="browser-ui">
                        <div class="address-bar-area">
                            <button class="nav-btn">←</button>
                            <button class="nav-btn">→</button>
                            <input type="text" class="url-input" id="browser-url" value="http://www.google.com" onkeydown="if(event.key==='Enter') Game.browse()">
                            <button class="go-btn" onclick="Game.browse()">Go</button>
                        </div>
                        <div class="browser-viewport" id="browser-content">
                            ${this.getWebPage('http://www.google.com')}
                        </div>
                    </div>
                `, 'icon-browser');
                break;
            case 'shop':
                this.renderShop();
                break;
            case 'computer':
                this.createWindow('computer', 'My Computer', `<div style="padding:20px;"><h3>Hard Disk Drives (1)</h3><div class="icon" style="color:black;text-shadow:none;"><div class="icon-computer"></div>Local Disk (C:)</div></div>`, 'icon-computer');
                break;
        }
    },

    // --- WEB EXPLORER SIMULATION ---

    getWebPage(url) {
        const pages = {
            'http://www.google.com': `
                <div class="fake-page" style="text-align:center; padding-top:50px;">
                    <h1 style="font-size:48px;"><span style="color:#4285F4">G</span><span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span><span style="color:#34A853">l</span><span style="color:#EA4335">e</span></h1>
                    <input type="text" style="width:60%; padding:10px;" placeholder="Search the web...">
                    <div style="margin-top:20px;">
                        <button style="padding:10px 20px;">Google Search</button>
                        <button style="padding:10px 20px;">I'm Feeling Lucky</button>
                    </div>
                    <p style="margin-top:50px; font-size:12px;">© 2009 Google - <a href="#">Privacy</a> - <a href="#">Terms</a></p>
                </div>
            `,
            'http://www.wikipedia.org': `
                <div class="fake-page">
                    <h2 style="border-bottom: 1px solid #aaa;">Wikipedia - The Free Encyclopedia</h2>
                    <p>Welcome to the encyclopedia that anyone can edit.</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="border:1px solid #ccc; padding:10px;">
                            <h3>Featured Article</h3>
                            <p><strong>The Roman Empire</strong> was the post-Republican period of ancient Rome. As a polity, it included large territorial holdings around the Mediterranean Sea in Europe, North Africa, and Western Asia, ruled by emperors.</p>
                        </div>
                        <div style="border:1px solid #ccc; padding:10px;">
                            <h3>Did you know?</h3>
                            <ul>
                                <li>...that the first library was built in 1900?</li>
                                <li>...that coffee makes you work 2x faster?</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `,
            'http://www.dictionary.com': `
                <div class="fake-page">
                    <h1 style="color:#2a73d4">Dictionary.com</h1>
                    <hr>
                    <h3>Search Results for: <span id="search-term">...</span></h3>
                    <div id="def-content" style="padding:20px; background:#f9f9f9; border-left:5px solid #2a73d4;">
                        Enter a word to find its definition.
                    </div>
                </div>
            `
        };

        // Custom Quest Pages
        if (this.activeQuest) {
            const q = this.activeQuest;
            if (url.includes(q.targetUrl)) {
                return `<div class="fake-page">
                    <h1>${q.siteTitle}</h1>
                    <div style="font-size:20px; margin:20px 0;">${q.content}</div>
                    <button class="go-btn" style="background:#28a745" onclick="Game.completeQuest()">I found it! Submit to Patron</button>
                </div>`;
            }
        }

        return pages[url] || `
            <div class="fake-page">
                <h1 style="color:red">404 - Page Not Found</h1>
                <p>The URL you entered does not exist in our library database.</p>
                <hr>
                <p>Try searching for Wikipedia, Google, or Dictionary.</p>
            </div>
        `;
    },

    browse() {
        const urlInput = document.getElementById('browser-url');
        const viewport = document.getElementById('browser-content');
        if (!urlInput || !viewport) return;

        let url = urlInput.value;
        if (!url.startsWith('http')) url = 'http://' + url;

        // Simulate Connection
        viewport.innerHTML = `
            <div class="loading-overlay">
                <div class="loader-spin"></div>
                <div>Connecting to ${url}...</div>
                <div class="progress-bar-container"><div class="progress-bar-fill" id="load-progress"></div></div>
            </div>
        `;

        this.playSynthSound('dialup');

        let progress = 0;
        const loadTime = (Math.random() * 5000 + 3000) * this.connectionSpeed;
        
        const interval = setInterval(() => {
            progress += (100 / (loadTime / 100));
            const fill = document.getElementById('load-progress');
            if (fill) fill.style.width = progress + '%';

            if (progress >= 100) {
                clearInterval(interval);
                if (Math.random() < this.errorRate) {
                    viewport.innerHTML = `<div class="fake-page"><h1>Internet Explorer cannot display the webpage</h1><button onclick="Game.browse()">Diagnose Connection Problems</button></div>`;
                    this.playSynthSound('error');
                } else {
                    viewport.innerHTML = this.getWebPage(url);
                }
            }
        }, 100);
    },

    // --- QUEST SYSTEM ---

    quests: [
        { title: "The Inventor", text: "Who invented the lightbulb? I need the year.", targetUrl: "wikipedia", siteTitle: "Wikipedia", content: "Thomas Edison successfully tested his lightbulb in <b>1879</b>.", reward: 20 },
        { title: "Vocabulary", text: "What is the definition of 'Serendipity'?", targetUrl: "dictionary", siteTitle: "Word History", content: "<b>Serendipity</b>: the occurrence and development of events by chance in a happy or beneficial way.", reward: 15 },
        { title: "Local Pizza", text: "I need the number for 'Mama Mia Pizza'.", targetUrl: "yellowpages", siteTitle: "Local Directory", content: "Mama Mia Pizza - 555-0192", reward: 25 },
        { title: "History", text: "When was the Great Wall of China started?", targetUrl: "history", siteTitle: "World History", content: "Construction began in the <b>7th century BC</b>.", reward: 30 },
        { title: "Math Fact", text: "What is the square root of 144?", targetUrl: "math", siteTitle: "Calculator Central", content: "The square root of 144 is <b>12</b>.", reward: 10 }
    ],

    spawnQuest() {
        if (this.activeQuest) return;

        const q = this.quests[Math.floor(Math.random() * this.quests.length)];
        this.activeQuest = { ...q, startTime: Date.now(), limit: 60000 };

        const balloon = document.getElementById('quest-notification');
        document.getElementById('quest-patron-name').innerText = "Patron Request: " + q.title;
        document.getElementById('quest-text').innerText = q.text;
        balloon.style.display = 'block';
        this.playSynthSound('notification');

        let timeLeft = 100;
        this.questTimer = setInterval(() => {
            timeLeft -= 1;
            document.getElementById('quest-timer-bar').style.width = timeLeft + '%';
            if (timeLeft <= 0) this.failQuest();
        }, 600);
    },

    completeQuest() {
        const bonus = (Date.now() - this.activeQuest.startTime < 30000) ? 1.5 : 1;
        const totalReward = Math.floor(this.activeQuest.reward * bonus);
        
        this.credits += totalReward;
        this.updateHUD();
        this.playSynthSound('coin');
        
        alert(`Patron: "Thank you so much!"\nEarned: ${totalReward} LC`);
        
        this.activeQuest = null;
        clearInterval(this.questTimer);
        document.getElementById('quest-notification').style.display = 'none';

        setTimeout(() => this.spawnQuest(), 10000);
        this.saveGame();
    },

    failQuest() {
        alert("The patron got tired of waiting and left.");
        this.activeQuest = null;
        clearInterval(this.questTimer);
        document.getElementById('quest-notification').style.display = 'none';
        setTimeout(() => this.spawnQuest(), 15000);
    },

    // --- SHOP SYSTEM ---

    shopItems: [
        { id: 'router', name: 'Better Router', desc: 'Reduces load times by 30%', price: 100, effect: () => Game.connectionSpeed = 0.7 },
        { id: 'antivirus', name: 'Anti-Virus', desc: 'Reduces web errors', price: 80, effect: () => Game.errorRate = 0.05 },
        { id: 'broadband', name: 'Broadband Upgrade', desc: 'Lightning fast internet', price: 250, effect: () => Game.connectionSpeed = 0.3 }
    ],

    renderShop() {
        let html = '<div class="shop-grid">';
        this.shopItems.forEach(item => {
            const owned = this.ownedItems.includes(item.id);
            html += `
                <div class="shop-item">
                    <strong>${item.name}</strong>
                    <p>${item.desc}</p>
                    <div>Price: ${item.price} LC</div>
                    <button class="buy-btn" ${owned || this.credits < item.price ? 'disabled' : ''} onclick="Game.buyItem('${item.id}')">
                        ${owned ? 'Owned' : 'Buy'}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        this.createWindow('shop', 'Library Shop', html, 'icon-folder');
    },

    buyItem(id) {
        const item = this.shopItems.find(i => i.id === id);
        if (item && this.credits >= item.price) {
            this.credits -= item.price;
            this.ownedItems.push(id);
            item.effect();
            this.updateHUD();
            this.renderShop();
            this.saveGame();
            this.playSynthSound('coin');
        }
    },

    // --- AUDIO SYSTEM (Web Audio API) ---

    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch(e) { console.error("No audio context"); }
    },

    playSynthSound(type) {
        if (!this.audioContext || this.isMuted) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        switch(type) {
            case 'startup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(); osc.stop(now + 0.5);
                break;
            case 'notification':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1000, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(); osc.stop(now + 0.2);
                break;
            case 'error':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(); osc.stop(now + 0.3);
                break;
            case 'dialup':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(400, now + 1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 1);
                osc.start(); osc.stop(now + 1);
                break;
            case 'coin':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(900, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(); osc.stop(now + 0.2);
                break;
        }
    },

    // --- DATA PERSISTENCE ---

    saveGame() {
        const data = {
            credits: this.credits,
            ownedItems: this.ownedItems,
            notepad: document.getElementById('notepad-text')?.value || this.notepadContent,
            lastLogin: Date.now()
        };
        localStorage.setItem('quiet_desk_save', JSON.stringify(data));
        
        const icon = document.getElementById('save-icon');
        icon.style.opacity = 1;
        setTimeout(() => icon.style.opacity = 0, 1000);
    },

    loadGame() {
        const saved = localStorage.getItem('quiet_desk_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.credits = data.credits || 0;
            this.ownedItems = data.ownedItems || [];
            this.notepadContent = data.notepad || "";
            
            // Re-apply item effects
            this.ownedItems.forEach(id => {
                const item = this.shopItems.find(i => i.id === id);
                if (item) item.effect();
            });
        }
        this.updateHUD();
    },

    saveNotepad() {
        this.notepadContent = document.getElementById('notepad-text').value;
    },

    updateHUD() {
        document.getElementById('credits-val').innerText = this.credits;
    },

    checkDailyBonus() {
        const last = localStorage.getItem('quiet_desk_daily');
        const now = new Date().toDateString();
        if (last !== now) {
            this.credits += 5;
            localStorage.setItem('quiet_desk_daily', now);
            this.updateHUD();
            alert("Daily Librarian Bonus: +5 LC");
        }
    },

    startAmbientLoop() {
        // Random library sounds
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.playSynthSound('notification'); // Ambient "page turn" sound
            }
        }, 20000);
    }
};

// Initialize the game
window.onload = () => Game.init();
