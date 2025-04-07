const canvas = document.getElementById('dark-pool-board');
const ctx = canvas.getContext('2d');
const GRID_WIDTH = 8;
const GRID_HEIGHT = 4;
let cellWidth, cellHeight;
let board = [];
let playerSide = null; // 'red' 或 'black'
let aiSide = null;
let playerScore = 16;
let aiScore = 16;
let playerCaptured = [];
let aiCaptured = [];
let currentTurn = 'player'; // 'player' 或 'ai'
let selectedPiece = null;
let gameOver = false;
let difficulty = 'easy';
const stoneSound = document.getElementById('stone-sound');

function resizeCanvas() {
    const containerWidth = document.querySelector('.board-section').offsetWidth;
    const maxWidth = Math.min(containerWidth, 480);
    canvas.width = maxWidth;
    canvas.height = maxWidth / 2;
    cellWidth = canvas.width / GRID_WIDTH;
    cellHeight = canvas.height / GRID_HEIGHT;
    drawBoard();
}

function initializeGame() {
    const pieces = [
        'K', 'A', 'A', 'B', 'B', 'N', 'N', 'R', 'R', 'P', 'P', 'S', 'S', 'S', 'S', 'S',
        'k', 'a', 'a', 'b', 'b', 'n', 'n', 'r', 'r', 'p', 'p', 's', 's', 's', 's', 's'
    ];
    pieces.sort(() => Math.random() - 0.5); // 隨機洗牌
    board = [];
    let pieceIndex = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push({ piece: pieces[pieceIndex++], revealed: false });
        }
        board.push(row);
    }
    playerSide = null;
    aiSide = null;
    playerScore = 16;
    aiScore = 16;
    playerCaptured = [];
    aiCaptured = [];
    currentTurn = 'player';
    selectedPiece = null;
    gameOver = false;
    updateScoreboard();
    resizeCanvas();
}

function drawBoard() {
    ctx.fillStyle = '#f0d9b5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4a2c00';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(canvas.width, y * cellHeight);
        ctx.stroke();
    }
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const { piece, revealed } = board[y][x];
            if (revealed && piece) drawPiece(x, y, piece);
            else if (!revealed) drawHidden(x, y);
        }
    }
    if (selectedPiece) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.strokeRect(selectedPiece.x * cellWidth, selectedPiece.y * cellHeight, cellWidth, cellHeight);
    }
}

function drawHidden(x, y) {
    ctx.beginPath();
    ctx.arc(x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2, cellWidth / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5a2b';
    ctx.fill();
    ctx.strokeStyle = '#4a2c00';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawPiece(x, y, piece) {
    ctx.beginPath();
    ctx.arc(x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2, cellWidth / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = piece === piece.toUpperCase() ? '#e74c3c' : '#333';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cellWidth * 0.5}px KaiTi`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbols = { K: '將', A: '士', B: '象', N: '馬', R: '車', P: '炮', S: '兵', k: '帥', a: '士', b: '相', n: '馬', r: '車', p: '炮', s: '卒' };
    ctx.fillText(symbols[piece], x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
}

function animatePiece(fromX, fromY, toX, toY, piece, callback) {
    let opacity = 0;
    const duration = 300;
    const startTime = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        opacity = Math.min(elapsed / duration, 1);
        drawBoard();
        ctx.globalAlpha = opacity;
        drawPiece(toX, toY, piece);
        ctx.globalAlpha = 1;
        if (elapsed < duration) requestAnimationFrame(step);
        else callback();
    }

    if (stoneSound) {
        stoneSound.currentTime = 0;
        stoneSound.play().catch(() => console.log('音效播放失敗'));
    }
    requestAnimationFrame(step);
}

function updateScoreboard() {
    playerScore = board.flat().filter(cell => cell.piece && (playerSide === 'red' ? /[KABNRPS]/.test(cell.piece) : /[kabnrps]/.test(cell.piece))).length;
    aiScore = board.flat().filter(cell => cell.piece && (aiSide === 'red' ? /[KABNRPS]/.test(cell.piece) : /[kabnrps]/.test(cell.piece))).length;
    document.getElementById('player-side').textContent = playerSide ? (playerSide === 'red' ? '紅方' : '黑方') : '尚未決定';
    document.getElementById('ai-side').textContent = aiSide ? (aiSide === 'red' ? '紅方' : '黑方') : '尚未決定';
    document.getElementById('player-score').textContent = `棋數：${playerScore}`;
    document.getElementById('ai-score').textContent = `棋數：${aiScore}`;
    document.getElementById('player-captured').innerHTML = `被吃：<span>${playerCaptured.map(p => ({ K: '將', A: '士', B: '象', N: '馬', R: '車', P: '炮', S: '兵', k: '帥', a: '士', b: '相', n: '馬', r: '車', p: '炮', s: '卒' })[p]).join(', ')}</span>`;
    document.getElementById('ai-captured').innerHTML = `被吃：<span>${aiCaptured.map(p => ({ K: '將', A: '士', B: '象', N: '馬', R: '車', P: '炮', S: '兵', k: '帥', a: '士', b: '相', n: '馬', r: '車', p: '炮', s: '卒' })[p]).join(', ')}</span>`;
    document.getElementById('player-side').className = `captured-list ${playerSide || ''}`;
    document.getElementById('ai-side').className = `captured-list ${aiSide || ''}`;
}

function checkWin() {
    const playerKing = playerSide === 'red' ? 'K' : 'k';
    const aiKing = aiSide === 'red' ? 'K' : 'k';
    const playerKingExists = board.flat().some(cell => cell.piece === playerKing);
    const aiKingExists = board.flat().some(cell => cell.piece === aiKing);

    if (!playerKingExists && aiKingExists) {
        gameOver = true;
        alert(`${aiSide === 'red' ? '紅方' : '黑方'}勝！`);
        return true;
    }
    if (!aiKingExists && playerKingExists) {
        gameOver = true;
        alert(`${playerSide === 'red' ? '紅方' : '黑方'}勝！`);
        return true;
    }
    return false;
}

function canEat(attacker, defender) {
    const rank = { K: 7, A: 6, B: 5, R: 4, N: 3, P: 2, S: 1, k: 7, a: 6, b: 5, r: 4, n: 3, p: 2, s: 1 };
    if (attacker === 'S' && defender === 'k') return true;
    if (attacker === 's' && defender === 'K') return true;
    if (attacker === 'P' || attacker === 'p') return rank[defender] <= rank[attacker];
    return rank[attacker] >= rank[defender];
}

function isValidMove(fromX, fromY, toX, toY, isAI = false) {
    const side = isAI ? aiSide : playerSide;
    if (!side || !board[fromY][fromX] || !board[fromY][fromX].revealed) return false;
    const piece = board[fromY][fromX].piece;
    const isOwnPiece = side === 'red' ? /[KABNRPS]/.test(piece) : /[kabnrps]/.test(piece);
    if (!isOwnPiece) return false;

    const dx = Math.abs(toX - fromX), dy = Math.abs(toY - fromY);
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return false;

    const target = board[toY][toX] ? board[toY][toX].piece : null;
    if (!target) return true;

    const isOpponentPiece = side === 'red' ? /[kabnrps]/.test(target) : /[KABNRPS]/.test(target);
    if (!isOpponentPiece) return false;

    if (piece === 'P' || piece === 'p') {
        const midX = Math.floor((fromX + toX) / 2), midY = Math.floor((fromY + toY) / 2);
        return dx === 1 && dy === 1 && board[midY][midX] && board[midY][midX].piece && canEat(piece, target);
    }
    return canEat(piece, target);
}

function aiPlay() {
    if (gameOver || currentTurn !== 'ai') return;

    const moves = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = board[y][x];
            if (!cell.revealed) {
                moves.push({ type: 'flip', x, y, score: difficulty === 'hard' ? Math.random() : 0 });
            } else if (cell.piece && (aiSide === 'red' ? /[KABNRPS]/.test(cell.piece) : /[kabnrps]/.test(cell.piece))) {
                for (let ty = 0; ty < GRID_HEIGHT; ty++) {
                    for (let tx = 0; tx < GRID_WIDTH; tx++) {
                        if (isValidMove(x, y, tx, ty, true)) {
                            const target = board[ty][tx] ? board[ty][tx].piece : null;
                            const score = target ? (target === (aiSide === 'red' ? 'k' : 'K') ? 100 : 1) : 0.5;
                            moves.push({ type: 'move', fromX: x, fromY: y, toX: tx, toY: ty, score: difficulty === 'hard' ? score + Math.random() : score });
                        }
                    }
                }
            }
        }
    }

    if (moves.length === 0) {
        gameOver = true;
        alert('無合法移動，遊戲結束');
        return;
    }

    moves.sort((a, b) => b.score - a.score); // 優先吃子或關鍵移動
    const move = moves[0];

    if (move.type === 'flip') {
        board[move.y][move.x].revealed = true;
        animatePiece(move.x, move.y, move.x, move.y, board[move.y][move.x].piece, () => {
            updateScoreboard();
            if (checkWin()) return;
            currentTurn = 'player';
            drawBoard();
        });
    } else {
        const piece = board[move.fromY][move.fromX].piece;
        if (board[move.toY][move.toX].piece) {
            aiCaptured.push(board[move.toY][move.toX].piece);
        }
        board[move.toY][move.toX] = { piece, revealed: true };
        board[move.fromY][move.fromX] = { piece: null, revealed: false };
        animatePiece(move.fromX, move.fromY, move.toX, move.toY, piece, () => {
            updateScoreboard();
            if (checkWin()) return;
            currentTurn = 'player';
            drawBoard();
        });
    }
}

function handleClick(e) {
    if (gameOver || currentTurn !== 'player') return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellWidth);
    const y = Math.floor((e.clientY - rect.top) / cellHeight);
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;

    if (!playerSide) {
        if (!board[y][x].revealed) {
            board[y][x].revealed = true;
            const piece = board[y][x].piece;
            playerSide = piece === piece.toUpperCase() ? 'red' : 'black';
            aiSide = playerSide === 'red' ? 'black' : 'red';
            animatePiece(x, y, x, y, piece, () => {
                updateScoreboard();
                currentTurn = 'ai';
                setTimeout(aiPlay, 500);
            });
        }
    } else if (selectedPiece) {
        if (isValidMove(selectedPiece.x, selectedPiece.y, x, y)) {
            const piece = board[selectedPiece.y][selectedPiece.x].piece;
            if (board[y][x].piece) {
                playerCaptured.push(board[y][x].piece);
            }
            board[y][x] = { piece, revealed: true };
            board[selectedPiece.y][selectedPiece.x] = { piece: null, revealed: false };
            animatePiece(selectedPiece.x, selectedPiece.y, x, y, piece, () => {
                updateScoreboard();
                selectedPiece = null;
                if (checkWin()) return;
                currentTurn = 'ai';
                setTimeout(aiPlay, 500);
            });
        } else {
            selectedPiece = null;
            drawBoard();
        }
    } else if (!board[y][x].revealed) {
        board[y][x].revealed = true;
        animatePiece(x, y, x, y, board[y][x].piece, () => {
            updateScoreboard();
            if (checkWin()) return;
            currentTurn = 'ai';
            setTimeout(aiPlay, 500);
        });
    } else if (board[y][x].piece && (playerSide === 'red' ? /[KABNRPS]/.test(board[y][x].piece) : /[kabnrps]/.test(board[y][x].piece))) {
        selectedPiece = { x, y };
        drawBoard();
    }
}

canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleClick(e.touches[0]);
}, { passive: false });

document.getElementById('reset-btn').addEventListener('click', () => {
    initializeGame();
    drawBoard();
});

document.getElementById('easy-btn').addEventListener('click', () => {
    difficulty = 'easy';
    initializeGame();
    drawBoard();
    document.getElementById('difficulty-display').textContent = '模式：簡單';
});

document.getElementById('hard-btn').addEventListener('click', () => {
    difficulty = 'hard';
    initializeGame();
    drawBoard();
    document.getElementById('difficulty-display').textContent = '模式：困難';
});

window.addEventListener('resize', resizeCanvas);

initializeGame();
drawBoard();