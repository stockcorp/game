const canvas = document.getElementById('chess-board');
const ctx = canvas.getContext('2d');
const gridWidth = 8, gridHeight = 8;
let cellWidth, cellHeight;

function resizeCanvas() {
    try {
        if (!canvas) throw new Error('Canvas element not found');
        canvas.width = 480;  // 強制設置初始尺寸
        canvas.height = 480;
        canvas.style.width = '480px';  // 確保可見
        canvas.style.height = '480px';
        cellWidth = canvas.width / gridWidth;
        cellHeight = canvas.height / gridHeight;
        console.log('Canvas resized:', canvas.width, canvas.height);
        drawBoard();
    } catch (error) {
        console.error('Resize canvas failed:', error);
    }
}

function drawBoard() {
    try {
        if (!ctx) throw new Error('Canvas context not available');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#f0d9b5' : '#8b5a2b';
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }
        console.log('Board drawn successfully');
    } catch (error) {
        console.error('Draw board failed:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking canvas');
    if (!canvas) {
        console.error('Canvas not found, check ID "chess-board" in HTML');
        return;
    }
    console.log('Canvas found, initializing');
    resizeCanvas();
    drawBoard();
});
