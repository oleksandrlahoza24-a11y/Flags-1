export function initDrawingEngine(canvasId, itemName, theme) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d', { desynchronized: true });
    const paletteContainer = document.getElementById('palette');
    
    let drawing = false;
    let currentColor = theme.colors[0];
    let brushSize = 5;
    let history = [];
    const maxHistory = 20;

    // Resize Canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderBackground();
        saveHistory(); // Initial state
    }

    // Theme Background Generator
    function renderBackground() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (theme.theme === 'space') {
            for(let i=0; i<200; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, 2);
            }
        } else if (theme.theme === 'stone') {
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            for(let i=0; i<canvas.width; i+=40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }
        } else {
            const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
            grad.addColorStop(0, '#1a1a1a');
            grad.addColorStop(1, '#050505');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Header Name
        ctx.font = '800 40px -apple-system';
        ctx.fillStyle = theme.colors[0];
        ctx.textAlign = 'center';
        ctx.fillText(itemName.toUpperCase(), canvas.width/2, 80);
    }

    // Pointer Logic
    let lastX = 0, lastY = 0;

    canvas.addEventListener('pointerdown', (e) => {
        drawing = true;
        [lastX, lastY] = [e.clientX, e.clientY];
        saveHistory();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        
        ctx.beginPath();
        ctx.strokeStyle = currentColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Pressure support (Apple Pencil / Force Touch)
        const pressure = e.pressure !== undefined && e.pressure !== 0 ? e.pressure : 1.0;
        ctx.lineWidth = brushSize * pressure * 2;
        
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        
        [lastX, lastY] = [e.clientX, e.clientY];
    });

    canvas.addEventListener('pointerup', () => drawing = false);
    canvas.addEventListener('pointercancel', () => drawing = false);

    // Toolbar Logic
    function setupToolbar() {
        paletteContainer.innerHTML = '';
        const colors = [...theme.colors, '#ffffff', '#000000'];
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            swatch.style.backgroundColor = color;
            if(color === currentColor) swatch.classList.add('active');
            
            swatch.onclick = () => {
                currentColor = color;
                document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            };
            paletteContainer.appendChild(swatch);
        });

        document.getElementById('brush-size').oninput = (e) => brushSize = e.target.value;
        document.getElementById('eraser-btn').onclick = () => currentColor = '#111';
        document.getElementById('clear-btn').onclick = () => {
            renderBackground();
            saveHistory();
        };
        document.getElementById('undo-btn').onclick = undo;
        document.getElementById('download-btn').onclick = download;
    }

    function saveHistory() {
        if (history.length >= maxHistory) history.shift();
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    function undo() {
        if (history.length > 1) {
            history.pop(); // Remove current
            const prevState = history[history.length - 1];
            ctx.putImageData(prevState, 0, 0);
        }
    }

    function download() {
        // Create export canvas to add the label banner
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const eCtx = exportCanvas.getContext('2d');
        
        // Draw main content
        eCtx.drawImage(canvas, 0, 0);
        
        // Add Decorative Banner
        eCtx.fillStyle = theme.colors[0];
        eCtx.fillRect(0, 0, canvas.width, 10); // Top stripe
        eCtx.fillRect(0, canvas.height - 40, canvas.width, 40); // Bottom bar
        
        eCtx.fillStyle = '#000';
        eCtx.font = 'bold 16px sans-serif';
        eCtx.textAlign = 'right';
        eCtx.fillText(`GACHA DRAW PROJECT: ${itemName}  `, canvas.width, canvas.height - 15);

        const link = document.createElement('a');
        link.download = `drawing-${itemName.toLowerCase()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }

    window.addEventListener('resize', resize);
    resize();
    setupToolbar();
}
