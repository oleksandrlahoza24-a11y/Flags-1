const THEMES = [
    "Medieval Castle", "Cyberpunk Skyscraper", "Underwater Temple", 
    "Steampunk Robot", "Dragon's Lair", "Floating Island", 
    "Haunted Mansion", "Viking Longship", "Space Station", 
    "Enchanted Treehouse", "Ancient Pyramid", "Futuristic Lab"
];

const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const reelContainer = document.getElementById('reel-container');
const rollBtn = document.getElementById('roll-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const topBar = document.getElementById('top-bar');
const themeDisplay = document.getElementById('current-theme');

let selectedTheme = "";
let isDrawing = false;

// 1. Initialize Reel Items
function initReel() {
    // We duplicate the list to make the spin look continuous
    const displayList = [...THEMES, ...THEMES, ...THEMES]; 
    displayList.forEach(theme => {
        const div = document.createElement('div');
        div.className = 'reel-item';
        div.textContent = theme;
        reelContainer.appendChild(div);
    });
}

// 2. Rolling Logic
rollBtn.addEventListener('click', () => {
    rollBtn.classList.add('hidden');
    reelContainer.classList.add('spinning');
    
    const itemHeight = 100;
    const totalItems = THEMES.length;
    const randomIndex = Math.floor(Math.random() * totalItems);
    
    // Calculate a far-off scroll target (spinning through at least 2 full sets)
    const targetOffset = (totalItems * 2 + randomIndex) * itemHeight;
    selectedTheme = THEMES[randomIndex];
    
    reelContainer.style.transform = `translateY(-${targetOffset}px)`;

    // Wait for animation to finish
    setTimeout(() => {
        reelContainer.classList.remove('spinning');
        startDrawingMode();
    }, 3000);
});

// 3. Drawing Engine (iPad Optimized)
function startDrawingMode() {
    canvas.classList.remove('hidden');
    topBar.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    themeDisplay.textContent = `DRAW: ${selectedTheme}`;
    
    setupCanvas();
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Touch Events for iPad
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getTouchPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getTouchPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function endDraw() {
    isDrawing = false;
}

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 4. Download Logic
downloadBtn.addEventListener('click', () => {
    // Create a temporary canvas to combine text + drawing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original artwork
    tempCtx.drawImage(canvas, 0, 0);

    // Draw Theme Title on top
    tempCtx.fillStyle = "black";
    tempCtx.font = "bold 40px Arial";
    tempCtx.textAlign = "center";
    tempCtx.fillText(selectedTheme, tempCanvas.width / 2, 60);

    // Trigger download
    const link = document.createElement('a');
    link.download = `my-drawing-${selectedTheme.replace(/\s+/g, '-')}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
});

initReel();
