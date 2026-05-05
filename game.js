/**
 * THE QUIET DESK - Core Logic
 */

// --- DATA: QUESTS & SITES ---
const QUEST_POOL = [
    { id: 1, type: 'WORD', patron: 'Mrs. Gable', q: 'Find the definition of "Labyrinthine".', target: 'LABYRINTHINE', ans: 'like a labyrinth; irregular and twisting', reward: 20, time: 60 },
    { id: 2, type: 'FACT', patron: 'Young Timmy', q: 'What year was the first public library in the US founded?', target: 'LIBRARY HISTORY', ans: '1731', reward: 25, time: 70 },
    { id: 3, type: 'PHONE', patron: 'Old Man Jenkins', q: 'I need the number for "Petal Pushers Florist".', target: 'LOCAL DIRECTORY', ans: '555-0192', reward: 30, time: 80 },
    { id: 4, type: 'IMAGE', patron: 'Sarah S.', q: 'Find me a picture of a "Quokka".', target: 'IMAGE SEARCH', ans: 'img_quokka', reward: 40, time: 90 },
    { id: 5, type: 'COMPARE', patron: 'Professor Oak', q: 'Which is older: The Great Wall or the Colosseum?', target: 'HISTORY COMP', ans: 'The Great Wall', reward: 50, time: 100 },
    { id: 6, type: 'FACT', patron: 'Baker Bob', q: 'What is the melting point of sucrose?', target: 'CHEMISTRY', ans: '186°C', reward: 35, time: 80 },
    { id: 7, type: 'WORD', patron: 'Gamer Greg', q: 'What does "Procedural Generation" mean?', target: 'DICTIONARY', ans: 'data created algorithmically', reward: 45, time: 90 },
    { id: 8, type: 'PHONE', patron: 'Ms. Higgins', q: 'Get me the number for the "Blue Bay Cafe".', target: 'PHONEBOOK', ans: '555-9981', reward: 30, time: 60 },
    { id: 9, type: 'IMAGE', patron: 'Little Lily', q: 'I want to see a "Red Panda".', target: 'ANIMALS', ans: 'img_red_panda', reward: 40, time: 100 },
    { id: 10, type: 'FACT', patron: 'Detective Gum', q: 'In what city is the "Louvre" located?', target: 'TRAVEL', ans: 'Paris', reward: 20, time: 45 }
];

const WEBSITES = {
    'home': `
        <div style="text-align:center; padding:20px; font-family: 'Comic Sans MS'">
            <h1 style="color:blue">Welcome to WebExplorer!</h1>
            <p>Your portal to the World Wide Web (v2009)</p>
            <div style="background:#ffffcc; padding:10px; border:1px dashed orange">
                <b>Weather:</b> Cloudy with 40% chance of slow packets.
            </div>
            <div style="margin:20px">
                <input type="text" id="search-input" placeholder="Search the web..." style="width:200px; padding:5px">
                <button onclick="window.browserNavigate('search')">Go!</button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; text-align:left">
                <div>
                    <h3>News Headlines</h3>
                    <ul>
                        <li>Local Librarian wins "Fastest Typer" award</li>
                        <li>New "Broadband" technology promises speeds up to 1mbps!</li>
                    </ul>
                </div>
                <div>
                    <img src="https://via.placeholder.com/120x60?text=AD:+BUY+SODA" style="border:1px solid #000">
                </div>
            </div>
        </div>
    `,
    'search': `
        <div style="padding:10px">
            <h2 style="color:red">Searchy! Results</h2>
            <hr>
            <div class="search-result">
                <a href="#" onclick="window.browserNavigate('dict')"><b>Dictionary.com-ish</b></a><br>
                <small>Find any word you don't know here.</small>
            </div><br>
            <div class="search-result">
                <a href="#" onclick="window.browserNavigate('wiki')"><b>Open-Pedia - The Free Encyclopedia</b></a><br>
                <small>Information about history, science, and more.</small>
            </div><br>
            <div class="search-result">
                <a href="#" onclick="window.browserNavigate('yellow')"><b>Yellow Pages Local</b></a><br>
                <small>Every business number in the county.</small>
            </div><br>
            <div class="search-result">
                <a href="#" onclick="window.browserNavigate('images')"><b>CoolImage Search</b></a><br>
                <small>Photos of animals, places, and things.</small>
            </div>
        </div>
    `,
    'dict': `
        <div style="padding:15px">
            <h1 style="border-bottom: 2px solid #000">WordLookup.biz</h1>
            <p><b>Labyrinthine:</b> (adj) like a labyrinth; irregular and twisting. "The labyrinthine corridors of the library."</p>
            <p><b>Procedural Generation:</b> (n) data created algorithmically as opposed to manually.</p>
        </div>
    `,
    'wiki': `
        <div style="padding:15px">
            <h1 style="background:#eee; padding:5px">Open-Pedia</h1>
            <h3>Library History</h3>
            <p>The first public library in the US was the Library Company of Philadelphia, founded in <b>1731</b> by Benjamin Franklin.</p>
            <h3>Chemistry</h3>
            <p>Sucrose (table sugar) has a melting point of exactly <b>186°C</b>.</p>
            <h3>Geography</h3>
            <p>The <b>Louvre</b> Museum is located in the heart of <b>Paris</b>, France.</p>
        </div>
    `,
    'yellow': `
        <div style="padding:15px">
            <h2>Local Business Directory</h2>
            <table border="1" style="width:100%; border-collapse: collapse">
                <tr><th>Business</th><th>Number</th></tr>
                <tr><td>Petal Pushers Florist</td><td>555-0192</td></tr>
                <tr><td>Blue Bay Cafe</td><td>555-9981</td></tr>
                <tr><td>Library Supply Co.</td><td>555-4422</td></tr>
            </table>
        </div>
    `,
    'images': `
        <div style="padding:15px; display:grid; grid-template-columns: 1fr 1fr; gap:10px">
            <div onclick="window.browserSelectImage('img_quokka')" style="border:1px solid #ccc; padding:5px; text-align:center">
                <div style="width:100px; height:80px; background:#aaa; margin:auto">IMAGE: QUOKKA</div>
                <span>Quokka</span>
            </div>
            <div onclick="window.browserSelectImage('img_red_panda')" style="border:1px solid #ccc; padding:5px; text-align:center">
                <div style="width:100px; height:80px; background:#f88; margin:auto">IMAGE: RED PANDA</div>
                <span>Red Panda</span>
            </div>
        </div>
    `,
    'history comp': `
        <div style="padding:15px">
            <h2>History Comparison</h2>
            <p>The Great Wall of China (7th Century BC) is significantly <b>older</b> than the Roman Colosseum (80 AD).</p>
        </div>
    `
};

// --- SYSTEM ENGINE ---
class GameEngine {
    constructor() {
        this.lc = parseInt(localStorage.getItem('lc')) || 0;
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        this.activeQuests = [];
        this.completedQuests = 0;
        this.loadSpeedMod = 1.0;
        this.failRate = 0.2;
        this.audioCtx = null;
        
        this.init();
    }

    init() {
        this.updateHUD();
        this.startTime();
        this.applyUpgrades();
        this.setupEventListeners();
        this.spawnDesktopIcons();
        this.checkDailyBonus();
        
        // Initial Notification
        setTimeout(() => this.newQuest(), 5000);
        setInterval(() => this.saveGame(), 30000);
        setInterval(() => this.newQuest(), 45000);
    }

    startTime() {
        setInterval(() => {
            const now = new Date();
            document.getElementById('tray-clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }

    updateHUD() {
        document.getElementById('lc-balance').innerText = this.lc;
    }

    saveGame() {
        localStorage.setItem('lc', this.lc);
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
        const indicator = document.getElementById('save-indicator');
        indicator.style.opacity = 1;
        setTimeout(() => indicator.style.opacity = 0, 2000);
    }

    checkDailyBonus() {
        const last = localStorage.getItem('lastLogin');
        const today = new Date().toDateString();
        if (last !== today) {
            this.addMoney(5);
            localStorage.setItem('lastLogin', today);
            this.notify("Daily Bonus", "You earned 5 LC for opening the library!");
        }
    }

    addMoney(amt) {
        this.lc += amt;
        this.updateHUD();
        this.playSound('coin');
    }

    applyUpgrades() {
        if (this.inventory.includes('Router')) this.loadSpeedMod = 0.7;
        if (this.inventory.includes('Broadband')) this.loadSpeedMod = 0.3;
        if (this.inventory.includes('Anti-Virus')) this.failRate = 0.05;
        
        if (this.inventory.includes('Coffee Mug')) document.getElementById('coffee-mug').style.display = 'block';
        if (this.inventory.includes('Desk Lamp')) {
            document.getElementById('lamp').style.display = 'block';
            document.getElementById('game-world').style.background = '#2c1e14';
        }
    }

    // --- SOUND ENGINE (Web Audio API) ---
    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSound(type) {
        this.initAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'coin') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start();
            osc.stop(now + 0.2);
        } else if (type === 'notify') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start();
            osc.stop(now + 0.5);
        } else if (type === 'dialup') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(1000, now + 2);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 2);
            osc.start();
            osc.stop(now + 2);
        }
    }

    // --- WINDOW MANAGER ---
    spawnDesktopIcons() {
        const icons = [
            { id: 'browser', name: 'WebExplorer', img: '🌐' },
            { id: 'notepad', name: 'Notepad', img: '📝' },
            { id: 'shop', name: 'Library Shop', img: '🛒' },
            { id: 'computer', name: 'My Computer', img: '💻' }
        ];

        const desk = document.getElementById('desktop');
        icons.forEach(icon => {
            const div = document.createElement('div');
            div.className = 'desktop-icon';
            div.innerHTML = `<div class="icon-img" style="font-size:32px">${icon.img}</div><span>${icon.name}</span>`;
            div.onclick = () => this.openApp(icon.id);
            desk.appendChild(div);
        });
    }

    openApp(id) {
        if (document.getElementById(`win-${id}`)) return; // Already open

        const win = document.createElement('div');
        win.id = `win-${id}`;
        win.className = 'window active';
        win.style.left = '100px';
        win.style.top = '100px';
        win.style.width = '600px';
        win.style.height = '450px';

        win.innerHTML = `
            <div class="window-titlebar" onpointerdown="window.dragWindow(event, '${win.id}')">
                <span>${id.toUpperCase()}</span>
                <div class="window-controls">
                    <div class="win-btn win-min">_</div>
                    <div class="win-btn win-max">□</div>
                    <div class="win-btn win-close" onclick="document.getElementById('${win.id}').remove()">X</div>
                </div>
            </div>
            <div class="window-content" id="content-${id}"></div>
        `;

        document.getElementById('pc-screen').appendChild(win);
        this.renderAppContent(id);
    }

    renderAppContent(id) {
        const container = document.getElementById(`content-${id}`);
        if (id === 'browser') {
            container.innerHTML = `
                <div class="browser-ui">
                    <div class="browser-toolbar">
                        <button onclick="window.browserNavigate('home')">🏠 Home</button>
                        <div class="address-bar" id="address-val">http://www.webexplorer.com</div>
                        <button onclick="window.browserNavigate('search')">Search</button>
                    </div>
                    <div id="browser-loading-bar"></div>
                    <div class="browser-viewport" id="browser-view"></div>
                </div>
            `;
            window.browserNavigate('home');
        } else if (id === 'shop') {
            this.renderShop(container);
        } else if (id === 'notepad') {
            container.innerHTML = `<textarea style="width:100%; height:100%; border:none; padding:10px; font-family:monospace" placeholder="Type notes here...">${localStorage.getItem('notepad') || ''}</textarea>`;
            container.onkeyup = (e) => localStorage.setItem('notepad', e.target.value);
        } else if (id === 'computer') {
            container.innerHTML = `<div style="padding:20px"><h3>Local Disk (C:)</h3><hr><p>📁 Windows</p><p>📁 Program Files</p><p>📁 Users</p></div>`;
        }
    }

    renderShop(container) {
        const items = [
            { id: 'Router', price: 100, desc: '30% Faster Internet', icon: '📶' },
            { id: 'Coffee Mug', price: 30, desc: 'A nice mug for your desk', icon: '☕' },
            { id: 'Anti-Virus', price: 80, desc: 'Fewer browser errors', icon: '🛡️' },
            { id: 'Broadband', price: 150, desc: '60% Faster Internet', icon: '🚀' },
            { id: 'Desk Lamp', price: 40, desc: 'Change the desk vibe', icon: '💡' }
        ];

        let html = '<div class="shop-grid">';
        items.forEach(item => {
            const owned = this.inventory.includes(item.id);
            html += `
                <div class="shop-item">
                    <span style="font-size:30px">${item.icon}</span>
                    <b>${item.id}</b>
                    <small>${item.desc}</small>
                    <button ${owned || this.lc < item.price ? 'disabled' : ''} onclick="game.buyItem('${item.id}', ${item.price})">
                        ${owned ? 'Owned' : item.price + ' LC'}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    buyItem(id, price) {
        if (this.lc >= price) {
            this.lc -= price;
            this.inventory.push(id);
            this.updateHUD();
            this.applyUpgrades();
            this.renderShop(document.getElementById('content-shop'));
            this.saveGame();
        }
    }

    // --- QUEST LOGIC ---
    newQuest() {
        if (this.activeQuests.length >= 1) return;
        
        const q = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
        this.activeQuests.push(q);
        this.playSound('notify');

        const note = document.createElement('div');
        note.className = 'notification';
        note.id = `q-${q.id}`;
        note.innerHTML = `
            <div style="display:flex; gap:10px">
                <div style="width:40px; height:40px; background:#ddd; border-radius:50%; display:flex; align-items:center; justify-content:center">👤</div>
                <div>
                    <b>${q.patron}</b><br>
                    <small>${q.q}</small>
                </div>
            </div>
            <div style="margin-top:10px">
                <input type="text" id="ans-${q.id}" placeholder="Type answer..." style="width:70%">
                <button onclick="game.submitQuest(${q.id})">Give</button>
            </div>
            <div id="timer-${q.id}" style="height:4px; background:blue; margin-top:10px; width:100%"></div>
        `;
        document.getElementById('notification-center').appendChild(note);

        let timeRemaining = q.time;
        const timerInt = setInterval(() => {
            timeRemaining--;
            const percent = (timeRemaining / q.time) * 100;
            const bar = document.getElementById(`timer-${q.id}`);
            if (bar) bar.style.width = percent + '%';

            if (timeRemaining <= 0) {
                clearInterval(timerInt);
                this.failQuest(q.id);
            }
        }, 1000);
        q.timerRef = timerInt;
    }

    submitQuest(id) {
        const q = this.activeQuests.find(x => x.id === id);
        const input = document.getElementById(`ans-${id}`).value.toLowerCase();
        
        if (input.includes(q.ans.toLowerCase()) || input === q.ans) {
            clearInterval(q.timerRef);
            this.addMoney(q.reward);
            this.notify("Quest Complete!", `You earned ${q.reward} LC.`);
            this.removeQuest(id);
        } else {
            this.playSound('error');
            alert("Patron: 'That doesn't look right...'");
        }
    }

    failQuest(id) {
        this.notify("Quest Failed", "The patron left unhappy.");
        this.removeQuest(id);
    }

    removeQuest(id) {
        this.activeQuests = this.activeQuests.filter(x => x.id !== id);
        const el = document.getElementById(`q-${id}`);
        if (el) el.remove();
    }

    notify(title, msg) {
        const n = document.createElement('div');
        n.className = 'notification';
        n.innerHTML = `<b>${title}</b><br>${msg}`;
        document.getElementById('notification-center').appendChild(n);
        setTimeout(() => n.remove(), 4000);
    }

    setupEventListeners() {
        // Handle iPad resize
        window.addEventListener('resize', () => {
            // Adjust layouts if needed
        });
    }
}

// --- GLOBAL WINDOW HELPERS ---
window.dragWindow = function(e, id) {
    const el = document.getElementById(id);
    // Bring to front
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    el.classList.add('active');

    let startX = e.clientX || e.touches[0].clientX;
    let startY = e.clientY || e.touches[0].clientY;
    let startL = el.offsetLeft;
    let startT = el.offsetTop;

    function move(e) {
        let curX = e.clientX || (e.touches ? e.touches[0].clientX : startX);
        let curY = e.clientY || (e.touches ? e.touches[0].clientY : startY);
        el.style.left = (startL + curX - startX) + 'px';
        el.style.top = (startT + curY - startY) + 'px';
    }

    function stop() {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', stop);
    }

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
};

window.browserNavigate = function(slug) {
    const view = document.getElementById('browser-view');
    const bar = document.getElementById('browser-loading-bar');
    const addr = document.getElementById('address-val');
    
    if (!view) return;

    game.playSound('dialup');
    view.innerHTML = '<p style="color:gray">Connecting...</p>';
    bar.style.width = '0%';
    
    let progress = 0;
    const speed = (2000 + Math.random() * 5000) * game.loadSpeedMod;
    
    const interval = setInterval(() => {
        progress += 5;
        bar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Random chance of failure
            if (Math.random() < game.failRate) {
                game.playSound('error');
                view.innerHTML = `
                    <div style="padding:40px; text-align:center">
                        <h1 style="color:#004e98">Page cannot be displayed</h1>
                        <p>Check your router or try again later.</p>
                        <button onclick="window.browserNavigate('${slug}')">Retry</button>
                    </div>
                `;
                return;
            }

            addr.innerText = `http://www.${slug}.net/index.html`;
            
            // Simulate staged loading
            const html = WEBSITES[slug] || WEBSITES['home'];
            view.innerHTML = `<div style="font-family:serif; color: blue; text-decoration:underline">Loading Assets...</div>` + html.replace(/<[^>]*>/g, (m) => m === '</b>' || m === '<b>' ? m : ''); 
            
            setTimeout(() => {
                view.innerHTML = html;
            }, 800);
        }
    }, speed / 20);
};

window.browserSelectImage = function(imgId) {
    // Patrons accept the "image name" as a valid finding
    const notepad = document.querySelector('#content-notepad textarea');
    if (notepad) {
        notepad.value += `\n[Image Found: ${imgId}]`;
        localStorage.setItem('notepad', notepad.value);
    }
    alert("Image URL copied to notes!");
};

// --- START THE GAME ---
const game = new GameEngine();
