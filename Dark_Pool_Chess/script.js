const canvas = document.getElementById('darkpool-board');
const ctx = canvas.getContext('2d');
const gridWidth = 4;
const gridHeight = 8;
let borderWidth, cellWidth, cellHeight;
let board = [];
let revealed = [];
let currentPlayer = 'white';
let whiteScore = 16;
let blackScore = 16;
const stoneSound = document.getElementById('stone-sound');
let selectedPiece = null;
let gameOver = false;
let whiteCaptured = [];
let blackCaptured = [];
let difficulty = 'easy';
const EASY_DEPTH = 3;
const HARD_DEPTH = 4;

const pieces = [
    'wk', 'wa', 'wa', 'wb', 'wb', 'wn', 'wn', 'wr', 'wr', 'wp', 'wp', 'ws', 'ws', 'ws', 'ws', 'ws',
    'bk', 'ba', 'ba', 'bb', 'bb', 'bn', 'bn', 'br', 'br', 'bp', 'bp', 'bs', 'bs', 'bs', 'bs', 'bs'
];

// 動態調整 Canvas 大小
function resizeCanvas() {
    const containerWidth = document.querySelector('.board-section').offsetWidth;
    const maxWidth = Math.min(containerWidth, 480);
    canvas.width = maxWidth;
    canvas.height = maxWidth * (gridHeight / gridWidth);
    borderWidth = canvas.width * 0.04;
    cellWidth = (canvas.width - 2 * borderWidth) / (gridWidth);
    cellHeight = (canvas.height - 2 * borderWidth) / (gridHeight);
    drawBoard();
}

// 隨機打亂陣列
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 初始化棋盤
function initializeBoard() {
    board = Array(gridHeight).fill().map(() => Array(gridWidth).fill(''));
    revealed = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
    const shuffledPieces = shuffle([...pieces]);
    let index = 0;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            board[y][x] = shuffledPieces[index++];
        }
    }
    whiteScore = 16;
    blackScore = 16;
    gameOver = false;
    whiteCaptured = [];
    blackCaptured = [];
    currentPlayer = 'white';
    selectedPiece = null;
    updateCapturedList();
    updateDifficultyDisplay();
    updateScoreboard();
    resizeCanvas();
}

// 繪製棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f0d9b5');
    gradient.addColorStop(1, '#d9b382');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#5a3e2b';
    ctx.lineWidth = 2;

    for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellWidth + borderWidth, borderWidth);
        ctx.lineTo(x * cellWidth + borderWidth, canvas.height - borderWidth);
        ctx.stroke();
    }

    for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(borderWidth, y * cellHeight + borderWidth);
        ctx.lineTo(canvas.width - borderWidth, y * cellHeight + borderWidth);
        ctx.stroke();
    }

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (board[y][x]) {
                drawPiece(x, y, revealed[y][x] ? board[y][x] : 'hidden', 1);
            }
        }
    }

    if (selectedPiece) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.strokeRect(selectedPiece.x * cellWidth + borderWidth, selectedPiece.y * cellHeight + borderWidth, cellWidth, cellHeight);
    }
}

// 繪製棋子
function drawPiece(x, y, piece, opacity = 1) {
    ctx.save();
    const radius = Math.min(cellWidth, cellHeight) * 0.35;
    const centerX = x * cellWidth + borderWidth + cellWidth / 2;
    const centerY = y * cellHeight + borderWidth + cellHeight / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = piece === 'hidden' ? '#8b5a2b' : piece.startsWith('w') ? '#f9d5bb' : '#d9d9d9';
    ctx.globalAlpha = opacity;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = piece === 'hidden' ? '#5a3e2b' : piece.startsWith('w') ? '#e74c3c' : '#333';
    ctx.stroke();

    if (piece !== 'hidden') {
        ctx.font = `bold ${canvas.width * 0.06}px "KaiTi", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = piece.startsWith('w') ? '#e74c3c' : '#000';
        const symbols = { 'r': '車', 'n': '馬', 'b': '象', 'a': '士', 'k': '將', 'p': '炮', 's': '兵' };
        ctx.fillText(symbols[piece[1]], centerX, centerY);
    }

    ctx.restore();
}

// 動畫移動棋子
function animatePiece(fromX, fromY, toX, toY, piece, callback) {
    let opacity = 0;
    const duration = 300;
    const startTime = performance.now();

    function step(timestamp) {
        const elapsed = timestamp - startTime;
        opacity = Math.min(elapsed / duration, 1);
        drawBoard();
        drawPiece(toX, toY, piece, opacity);

        if (elapsed < duration) {
            requestAnimationFrame(step);
        } else if (callback) {
            callback();
        }
    }

    if (stoneSound) {
        stoneSound.currentTime = 0;
        stoneSound.play().catch(error => console.error('音效播放失敗:', error));
    }
    requestAnimationFrame(step);
}

// 更新計分板
function updateScoreboard() {
    whiteScore = board.flat().filter(cell => cell.startsWith('w')).length;
    blackScore = board.flat().filter(cell => cell.startsWith('b')).length;
    document.getElementById('white-score').textContent = `白方：${whiteScore}`;
    document.getElementById('black-score').textContent = `黑方：${blackScore}`;
    const currentPlayerElement = document.getElementById('current-player');
    currentPlayerElement.textContent = `當前玩家：${currentPlayer === 'white' ? '白方' : '黑方'}`;
    currentPlayerElement.classList.remove('white', 'black');
    currentPlayerElement.classList.add(currentPlayer);
}

// 更新被吃棋子記錄
function updateCapturedList() {
    const symbols = { 'r': '車', 'n': '馬', 'b': '象', 'a': '士', 'k': '將', 'p': '炮', 's': '兵' };
    document.getElementById('white-captured').innerHTML = `白方被吃：<span>${whiteCaptured.map(p => symbols[p[1]]).join(', ')}</span>`;
    document.getElementById('black-captured').innerHTML = `黑方被吃：<span>${blackCaptured.map(p => symbols[p[1]]).join(', ')}</span>`;
}

// 更新模式顯示
function updateDifficultyDisplay() {
    document.getElementById('difficulty-display').textContent = `模式：${difficulty === 'easy' ? '簡單' : '困難'}`;
}

// 檢查遊戲是否結束
function checkGameOver() {
    let whiteKing = false;
    let blackKing = false;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (board[y][x] === 'wk') whiteKing = true;
            if (board[y][x] === 'bk') blackKing = true;
        }
    }
    if (!whiteKing) {
        gameOver = true;
        alert('黑方勝！');
    } else if (!blackKing) {
        gameOver = true;
        alert('白方勝！');
    }
    return gameOver;
}

// 檢查是否可以吃子
function canCapture(fromPiece, toPiece) {
    if (!fromPiece || !toPiece) return false;
    const rank = { 'k': 7, 'a': 6, 'b': 5, 'r': 4, 'n': 3, 'p': 2, 's': 1 };
    const fromRank = rank[fromPiece[1]];
    const toRank = rank[toPiece[1]];
    if (fromPiece[1] === 's' && toPiece[1] === 'k') return true;
    if (fromPiece[1] === 'p' && toPiece[1] !== 'p') return false; // 炮只能靠跳吃
    return fromRank >= toRank;
}

// 檢查路徑是否暢通
function isPathClear(fromX, fromY, toX, toY) {
    if (fromX === toX) {
        const [minY, maxY] = [Math.min(fromY, toY), Math.max(fromY, toY)];
        for (let y = minY + 1; y < maxY; y++) if (board[y][fromX]) return false;
    } else if (fromY === toY) {
        const [minX, maxX] = [Math.min(fromX, toX), Math.max(fromX, toX)];
        for (let x = minX + 1; x < maxX; x++) if (board[fromY][x]) return false;
    }
    return true;
}

// 計算路徑間棋子數
function countPiecesBetween(fromX, fromY, toX, toY) {
    let count = 0;
    if (fromX === toX) {
        const [minY, maxY] = [Math.min(fromY, toY), Math.max(fromY, toY)];
        for (let y = minY + 1; y < maxY; y++) if (board[y][fromX]) count++;
    } else if (fromY === toY) {
        const [minX, maxX] = [Math.min(fromX, toX), Math.max(fromX, toX)];
        for (let x = minX + 1; x < maxX; x++) if (board[fromY][x]) count++;
    }
    return count;
}

// 檢查移動合法性（白方）
function isValidMove(fromX, fromY, toX, toY, isFlip = false) {
    if (isFlip) return !revealed[toY][toX] && !board[toY][toX].startsWith('w');
    const piece = board[fromY][fromX];
    if (!piece || !piece.startsWith('w') || !revealed[fromY][fromX]) return false;
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const target = board[toY][toX];

    if (target && target.startsWith('w')) return false;

    switch (piece[1]) {
        case 'k':
        case 's':
            return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        case 'a':
            return dx === 1 && dy === 1;
        case 'b':
            return dx === 2 && dy === 2 && !board[(fromY + toY) / 2][(fromX + toX) / 2];
        case 'n':
            return ((dx === 2 && dy === 1) || (dx === 1 && dy === 2)) && !board[dx === 2 ? fromY + (toY > fromY ? 1 : -1) : fromY][dx === 2 ? fromX : fromX + (toX > fromX ? 1 : -1)];
        case 'r':
            return (dx === 0 || dy === 0) && isPathClear(fromX, fromY, toX, toY) && (!target || canCapture(piece, target));
        case 'p':
            if (!target) return (dx === 0 || dy === 0) && isPathClear(fromX, fromY, toX, toY);
            return (dx === 0 || dy === 0) && countPiecesBetween(fromX, fromY, toX, toY) === 1 && canCapture(piece, target);
        default:
            return false;
    }
}

// 檢查移動合法性（黑方）
function isValidMoveForAI(fromX, fromY, toX, toY, isFlip = false) {
    if (isFlip) return !revealed[toY][toX] && !board[toY][toX].startsWith('b');
    const piece = board[fromY][fromX];
    if (!piece || !piece.startsWith('b') || !revealed[fromY][fromX]) return false;
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const target = board[toY][toX];

    if (target && target.startsWith('b')) return false;

    switch (piece[1]) {
        case 'k':
        case 's':
            return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        case 'a':
            return dx === 1 && dy === 1;
        case 'b':
            return dx === 2 && dy === 2 && !board[(fromY + toY) / 2][(fromX + toX) / 2];
        case 'n':
            return ((dx === 2 && dy === 1) || (dx === 1 && dy === 2)) && !board[dx === 2 ? fromY + (toY > fromY ? 1 : -1) : fromY][dx === 2 ? fromX : fromX + (toX > fromX ? 1 : -1)];
        case 'r':
            return (dx === 0 || dy === 0) && isPathClear(fromX, fromY, toX, toY) && (!target || canCapture(piece, target));
        case 'p':
            if (!target) return (dx === 0 || dy === 0) && isPathClear(fromX, fromY, toX, toY);
            return (dx === 0 || dy === 0) && countPiecesBetween(fromX, fromY, toX, toY) === 1 && canCapture(piece, target);
        default:
            return false;
    }
}

// 評估棋子價值
function getPieceValue(piece) {
    if (!piece) return 0;
    const values = { 'k': 1000, 'a': 6, 'b': 5, 'r': 4, 'n': 3, 'p': 2, 's': 1 };
    return values[piece[1]] || 0;
}

// 評估局面
function evaluateBoard(boardState, revealedState) {
    let score = 0;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const piece = boardState[y][x];
            if (piece && revealedState[y][x]) {
                const value = getPieceValue(piece);
                if (piece.startsWith('b')) {
                    score += value;
                } else {
                    score -= value;
                }
            }
        }
    }
    return score;
}

// Minimax 與 Alpha-Beta 剪枝
function minimax(boardState, revealedState, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || checkGameOverBoard(boardState)) {
        return evaluateBoard(boardState, revealedState);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (boardState[y][x]) {
                    if (boardState[y][x].startsWith('b') && revealedState[y][x]) {
                        for (let ty = 0; ty < gridHeight; ty++) {
                            for (let tx = 0; tx < gridWidth; tx++) {
                                if (isValidMoveForAI(x, y, tx, ty)) {
                                    const tempBoard = boardState.map(row => [...row]);
                                    const tempRevealed = revealedState.map(row => [...row]);
                                    tempBoard[y][x] = '';
                                    tempBoard[ty][tx] = boardState[y][x];
                                    const evalScore = minimax(tempBoard, tempRevealed, depth - 1, alpha, beta, false);
                                    maxEval = Math.max(maxEval, evalScore);
                                    alpha = Math.max(alpha, evalScore);
                                    if (beta <= alpha) break;
                                }
                            }
                        }
                    } else if (!revealedState[y][x]) {
                        const tempBoard = boardState.map(row => [...row]);
                        const tempRevealed = revealedState.map(row => [...row]);
                        tempRevealed[y][x] = true;
                        const evalScore = minimax(tempBoard, tempRevealed, depth - 1, alpha, beta, false);
                        maxEval = Math.max(maxEval, evalScore);
                        alpha = Math.max(alpha, evalScore);
                        if (beta <= alpha) break;
                    }
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (boardState[y][x]) {
                    if (boardState[y][x].startsWith('w') && revealedState[y][x]) {
                        for (let ty = 0; ty < gridHeight; ty++) {
                            for (let tx = 0; tx < gridWidth; tx++) {
                                if (isValidMove(x, y, tx, ty)) {
                                    const tempBoard = boardState.map(row => [...row]);
                                    const tempRevealed = revealedState.map(row => [...row]);
                                    tempBoard[y][x] = '';
                                    tempBoard[ty][tx] = boardState[y][x];
                                    const evalScore = minimax(tempBoard, tempRevealed, depth - 1, alpha, beta, true);
                                    minEval = Math.min(minEval, evalScore);
                                    beta = Math.min(beta, evalScore);
                                    if (beta <= alpha) break;
                                }
                            }
                        }
                    } else if (!revealedState[y][x]) {
                        const tempBoard = boardState.map(row => [...row]);
                        const tempRevealed = revealedState.map(row => [...row]);
                        tempRevealed[y][x] = true;
                        const evalScore = minimax(tempBoard, tempRevealed, depth - 1, alpha, beta, true);
                        minEval = Math.min(minEval, evalScore);
                        beta = Math.min(beta, evalScore);
                        if (beta <= alpha) break;
                    }
                }
            }
        }
        return minEval;
    }
}

// 檢查臨時棋盤是否結束
function checkGameOverBoard(boardState) {
    let whiteKing = false;
    let blackKing = false;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (boardState[y][x] === 'wk') whiteKing = true;
            if (boardState[y][x] === 'bk') blackKing = true;
        }
    }
    return !whiteKing || !blackKing;
}

// AI 移動
function aiMove() {
    if (currentPlayer !== 'black' || gameOver) return;

    let validMoves = [];
    const depth = difficulty === 'easy' ? EASY_DEPTH : HARD_DEPTH;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (board[y][x]) {
                if (board[y][x].startsWith('b') && revealed[y][x]) {
                    for (let ty = 0; ty < gridHeight; ty++) {
                        for (let tx = 0; tx < gridWidth; tx++) {
                            if (isValidMoveForAI(x, y, tx, ty)) {
                                validMoves.push({ fromX: x, fromY: y, toX: tx, toY: ty, isFlip: false });
                            }
                        }
                    }
                } else if (!revealed[y][x]) {
                    validMoves.push({ fromX: x, fromY: y, toX: x, toY: y, isFlip: true });
                }
            }
        }
    }

    if (validMoves.length > 0) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of validMoves) {
            const tempBoard = board.map(row => [...row]);
            const tempRevealed = revealed.map(row => [...row]);
            if (move.isFlip) {
                tempRevealed[move.fromY][move.fromX] = true;
            } else {
                tempBoard[move.fromY][move.fromX] = '';
                tempBoard[move.toY][move.toX] = board[move.fromY][move.fromX];
            }
            const evalScore = minimax(tempBoard, tempRevealed, depth - 1, -Infinity, Infinity, false);
            if (evalScore > bestScore) {
                bestScore = evalScore;
                bestMove = move;
            }
        }

        if (bestMove.isFlip) {
            revealed[bestMove.fromY][bestMove.fromX] = true;
            animatePiece(bestMove.fromX, bestMove.fromY, bestMove.toX, bestMove.toY, board[bestMove.fromY][bestMove.fromX], () => {
                updateScoreboard();
                updateCapturedList();
                if (!checkGameOver()) {
                    currentPlayer = 'white';
                    drawBoard();
                }
            });
        } else {
            const piece = board[bestMove.fromY][bestMove.fromX];
            const target = board[bestMove.toY][bestMove.toX];
            board[bestMove.fromY][bestMove.fromX] = '';
            board[bestMove.toY][bestMove.toX] = piece;
            if (target && target.startsWith('w')) whiteCaptured.push(target);

            animatePiece(bestMove.fromX, bestMove.fromY, bestMove.toX, bestMove.toY, piece, () => {
                updateScoreboard();
                updateCapturedList();
                if (!checkGameOver()) {
                    currentPlayer = 'white';
                    drawBoard();
                }
            });
        }
    }
}

// 處理移動事件
function handleMove(e) {
    if (gameOver || currentPlayer !== 'white') return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.x - rect.left - borderWidth) / cellWidth);
    const y = Math.floor((e.y - rect.top - borderWidth) / cellHeight);

    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;

    if (!selectedPiece && !revealed[y][x] && board[y][x]) {
        if (isValidMove(x, y, x, y, true)) {
            revealed[y][x] = true;
            animatePiece(x, y, x, y, board[y][x], () => {
                updateScoreboard();
                updateCapturedList();
                if (!checkGameOver()) {
                    currentPlayer = 'black';
                    drawBoard();
                    setTimeout(aiMove, 500);
                }
            });
        }
    } else if (!selectedPiece && board[y][x] && board[y][x].startsWith('w') && revealed[y][x]) {
        selectedPiece = { x, y };
        drawBoard();
    } else if (selectedPiece) {
        if (isValidMove(selectedPiece.x, selectedPiece.y, x, y)) {
            const piece = board[selectedPiece.y][selectedPiece.x];
            const target = board[y][x];
            board[selectedPiece.y][selectedPiece.x] = '';
            board[y][x] = piece;
            if (target && target.startsWith('b')) blackCaptured.push(target);

            animatePiece(selectedPiece.x, selectedPiece.y, x, y, piece, () => {
                updateScoreboard();
                updateCapturedList();
                selectedPiece = null;
                if (!checkGameOver()) {
                    currentPlayer = 'black';
                    drawBoard();
                    setTimeout(aiMove, 500);
                }
            });
        } else {
            selectedPiece = null;
            drawBoard();
        }
    }
}

// 滑鼠和觸控事件
canvas.addEventListener('click', (e) => handleMove({ x: e.clientX, y: e.clientY }));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove({ x: touch.clientX, y: touch.clientY });
}, { passive: false });

// 重置遊戲
document.getElementById('reset-btn').addEventListener('click', () => {
    initializeBoard();
    drawBoard();
    updateScoreboard();
    updateCapturedList();
});

// 難度選擇
document.getElementById('easy-btn').addEventListener('click', () => {
    difficulty = 'easy';
    initializeBoard();
    drawBoard();
    updateScoreboard();
    updateCapturedList();
    updateDifficultyDisplay();
});

document.getElementById('hard-btn').addEventListener('click', () => {
    difficulty = 'hard';
    initializeBoard();
    drawBoard();
    updateScoreboard();
    updateCapturedList();
    updateDifficultyDisplay();
});

// 視窗大小變化
window.addEventListener('resize', resizeCanvas);

// 初始化
initializeBoard();
drawBoard();
updateScoreboard();
updateCapturedList();
updateDifficultyDisplay();
