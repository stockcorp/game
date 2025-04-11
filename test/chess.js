const canvas = document.getElementById('chess-board');
const ctx = canvas.getContext('2d');
const boardSize = 8;
let cellSize = 60;
let board = [];
let selected = null;
let currentTurn = 'white';
let whiteCaptured = [], blackCaptured = [];

function resizeCanvas() {
    const containerWidth = document.querySelector('.board-section').offsetWidth;
    canvas.width = Math.min(containerWidth, 480);
    canvas.height = canvas.width;
    cellSize = canvas.width / boardSize;
    drawBoard();
}

function initBoard() {
    const setup = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    board = setup.map(row => row.map(cell => cell ? { piece: cell } : null));
    currentTurn = 'white';
    whiteCaptured = [];
    blackCaptured = [];
    updateStatus();
    resizeCanvas();
}

function drawBoard() {
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const isWhite = (x + y) % 2 === 0;
            ctx.fillStyle = isWhite ? '#eee' : '#777';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (selected && selected.x === x && selected.y === y) {
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 3;
                ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
            }
            const cell = board[y][x];
            if (cell && cell.piece) drawPiece(x, y, cell.piece);
        }
    }
}

function drawPiece(x, y, piece) {
    ctx.fillStyle = piece === piece.toUpperCase() ? 'white' : 'black';
    ctx.font = `${cellSize * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piece.toUpperCase(), x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return;
    const cell = board[y][x];
    const piece = cell ? cell.piece : null;
    const isWhiteTurn = currentTurn === 'white';

    if (selected) {
        const from = selected;
        const to = { x, y };
        const srcPiece = board[from.y][from.x].piece;
        const target = board[to.y][to.x];
        if (!target || (srcPiece.toUpperCase() !== target.piece.toUpperCase())) {
            if (target && target.piece) {
                (isWhiteTurn ? whiteCaptured : blackCaptured).push(target.piece);
            }
            board[to.y][to.x] = { piece: srcPiece };
            board[from.y][from.x] = null;
            currentTurn = isWhiteTurn ? 'black' : 'white';
            updateStatus();
        }
        selected = null;
    } else if (cell && ((isWhiteTurn && piece === piece.toUpperCase()) || (!isWhiteTurn && piece === piece.toLowerCase()))) {
        selected = { x, y };
    }
    drawBoard();
}

function updateStatus() {
    document.getElementById('current-turn').textContent = currentTurn === 'white' ? '白方' : '黑方';
    document.getElementById('white-captured').innerHTML = `白方吃：<span>${whiteCaptured.join(', ')}</span>`;
    document.getElementById('black-captured').innerHTML = `黑方吃：<span>${blackCaptured.join(', ')}</span>`;
}

canvas.addEventListener('click', handleClick);
window.addEventListener('resize', resizeCanvas);
document.getElementById('reset-btn').addEventListener('click', initBoard);

initBoard();