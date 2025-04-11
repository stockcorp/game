const canvas = document.getElementById('chess-board');
const ctx = canvas.getContext('2d');
const gridWidth = 8, gridHeight = 8;
let cellWidth, cellHeight;

function resizeCanvas() {
    try {
        const container = document.querySelector('.board-section');
        if (!container) throw new Error('Board section not found in DOM');
        const containerWidth = container.offsetWidth || 480;
        const maxWidth = Math.min(containerWidth, 480);
        canvas.width = maxWidth;
        canvas.height = maxWidth; // 確保 8x8 正方形
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
    if (!canvas) {
        console.error('Canvas element not found, check ID "chess-board"');
        return;
    }
    console.log('DOM loaded, initializing canvas');
    resizeCanvas();
    drawBoard();
});
