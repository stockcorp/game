const canvas = document.getElementById('chess-board');
const ctx = canvas.getContext('2d');
const gridWidth = 8, gridHeight = 8;
let cellWidth, cellHeight, board = [];
let currentPlayer = 'white'; // 玩家為白方，AI 為黑方
let playerColor = 'white', aiColor = 'black';
let whiteScore = 16, blackScore = 16;
const stoneSound = document.getElementById('stone-sound');
let selectedPiece = null, gameOver = false;
let whiteCaptured = [], blackCaptured = [];
let difficulty = 'easy';
const EASY_DEPTH = 2, HARD_DEPTH = 4; // 西洋棋計算較複雜，深度稍低
let aiMoving = false;

function resizeCanvas() {
    try {
        const containerWidth = document.querySelector('.board-section').offsetWidth || 480;
        const maxWidth = Math.min(containerWidth, 480);
        canvas.width = maxWidth;
        canvas.height = maxWidth; // 西洋棋為 8x8，正方形
        cellWidth = canvas.width / gridWidth;
        cellHeight = canvas.height / gridHeight;
        drawBoard();
        console.log('Canvas resized:', canvas.width, canvas.height);
    } catch (error) {
        console.error('Resize canvas failed:', error);
    }
}

function initializeBoard() {
    // 西洋棋初始佈局（白方在下，黑方在上）
    board = [
        ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'], // 黑方第8排
        ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'], // 黑方第7排
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'], // 白方第2排
        ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']  // 白方第1排
    ].map(row => row.map(piece => ({ piece, revealed: true }))); // 所有棋子初始明示

    console.log('Board initialized - White King:', board.flat().some(cell => cell && cell.piece === 'wk'));
    console.log('Board initialized - Black King:', board.flat().some(cell => cell && cell.piece === 'bk'));
    
    whiteScore = 16;
    blackScore = 16;
    whiteCaptured = [];
    blackCaptured = [];
    gameOver = false;
    currentPlayer = 'white';
    playerColor = 'white';
    aiColor = 'black';
    selectedPiece = null;
    aiMoving = false;
    updateScoreboard();
    updateCapturedList();
    updateDifficultyDisplay();
    resizeCanvas();
    checkAudio();
}

function checkAudio() {
    if (!stoneSound) {
        console.error('Audio element not found, check <audio id="stone-sound"> in HTML');
        return;
    }
    stoneSound.load();
    stoneSound.onerror = () => console.error('Audio file failed to load, check ../img/stone-drop.mp3 path');
}

function drawBoard() {
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#f0d9b5' : '#8b5a2b'; // 黑白格
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const { piece } = board[y][x];
                if (piece) drawPiece(x, y, piece);
            }
        }
        if (selectedPiece) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.strokeRect(selectedPiece.x * cellWidth, selectedPiece.y * cellHeight, cellWidth, cellHeight);
        }
        console.log('Board drawn');
    } catch (error) {
        console.error('Draw board failed:', error);
    }
}

function drawPiece(x, y, piece) {
    ctx.fillStyle = piece.startsWith('w') ? '#fff' : '#000';
    ctx.font = `bold ${cellWidth * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbols = { 
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
    };
    ctx.fillText(symbols[piece[1]], x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
}

function animatePiece(fromX, fromY, toX, toY, piece, callback) {
    try {
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
            else if (callback) callback();
        }

        if (stoneSound) {
            stoneSound.currentTime = 0;
            stoneSound.play().catch(error => console.error('Audio play failed:', error));
        }
        requestAnimationFrame(step);
    } catch (error) {
        console.error('Animation failed:', error);
        if (callback) callback();
    }
}

function updateScoreboard() {
    whiteScore = board.flat().filter(cell => cell && cell.piece && cell.piece.startsWith('w')).length;
    blackScore = board.flat().filter(cell => cell && cell.piece && cell.piece.startsWith('b')).length;
    document.getElementById('white-score').textContent = `白方：${whiteScore}`;
    document.getElementById('black-score').textContent = `黑方：${blackScore}`;
    const currentPlayerElement = document.getElementById('current-player');
    currentPlayerElement.textContent = `當前玩家：${currentPlayer === 'white' ? '白方' : '黑方'}`;
    currentPlayerElement.classList.remove('white', 'black');
    currentPlayerElement.classList.add(currentPlayer);
}

function updateCapturedList() {
    const symbols = { 
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    document.getElementById('white-captured').innerHTML = `白方被吃：<span>${whiteCaptured.map(p => symbols[p[1]]).join(', ')}</span>`;
    document.getElementById('black-captured').innerHTML = `黑方被吃：<span>${blackCaptured.map(p => symbols[p[1]]).join(', ')}</span>`;
}

function updateDifficultyDisplay() {
    document.getElementById('difficulty-display').textContent = `模式：${difficulty === 'easy' ? '簡單' : '困難'}`;
}

function checkGameOver() {
    const whiteKingExists = board.some(row => row.some(cell => cell && cell.piece === 'wk'));
    const blackKingExists = board.some(row => row.some(cell => cell && cell.piece === 'bk'));
    
    if (!whiteKingExists) {
        gameOver = true;
        alert('黑方勝！');
        return true;
    }
    if (!blackKingExists) {
        gameOver = true;
        alert('白方勝！');
        return true;
    }
    return false;
}

function canEat(attacker, defender) {
    return true; // 西洋棋中任何棋子可吃對方棋子，無等級限制
}

function isValidMove(fromX, fromY, toX, toY) {
    if (!board[fromY][fromX] || !board[fromY][fromX].piece.startsWith('w')) return false;
    const piece = board[fromY][fromX].piece;
    const dx = toX - fromX, dy = toY - fromY;
    const target = board[toY][toX] ? board[toY][toX].piece : null;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    // 檢查目標是否為己方棋子
    if (target && target.startsWith('w')) return false;

    switch (piece[1]) {
        case 'p': // 兵
            if (dx === 0 && !target) {
                if (fromY === 6 && dy === -1) return true; // 前進一格
                if (fromY === 6 && dy === -2 && !board[fromY - 1][fromX].piece) return true; // 初始前進兩格
            } else if (absDx === 1 && dy === -1 && target) return true; // 吃子
            return false;
        case 'r': // 車
            if (dx === 0 || dy === 0) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'n': // 馬
            return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);
        case 'b': // 象
            if (absDx === absDy) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'q': // 后
            if (dx === 0 || dy === 0 || absDx === absDy) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'k': // 王
            return absDx <= 1 && absDy <= 1;
        default:
            return false;
    }
}

function isValidMoveForAI(fromX, fromY, toX, toY) {
    if (!board[fromY][fromX] || !board[fromY][fromX].piece.startsWith('b')) return false;
    const piece = board[fromY][fromX].piece;
    const dx = toX - fromX, dy = toY - fromY;
    const target = board[toY][toX] ? board[toY][toX].piece : null;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    if (target && target.startsWith('b')) return false;

    switch (piece[1]) {
        case 'p': // 兵
            if (dx === 0 && !target) {
                if (fromY === 1 && dy === 1) return true;
                if (fromY === 1 && dy === 2 && !board[fromY + 1][fromX].piece) return true;
            } else if (absDx === 1 && dy === 1 && target) return true;
            return false;
        case 'r': // 車
            if (dx === 0 || dy === 0) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'n': // 馬
            return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);
        case 'b': // 象
            if (absDx === absDy) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'q': // 后
            if (dx === 0 || dy === 0 || absDx === absDy) return isPathClear(fromX, fromY, toX, toY);
            return false;
        case 'k': // 王
            return absDx <= 1 && absDy <= 1;
        default:
            return false;
    }
}

function isPathClear(fromX, fromY, toX, toY) {
    const dx = toX - fromX, dy = toY - fromY;
    const stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    const stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
    let x = fromX + stepX, y = fromY + stepY;
    while (x !== toX || y !== toY) {
        if (board[y][x].piece) return false;
        x += stepX;
        y += stepY;
    }
    return true;
}

function evaluateBoard() {
    let score = 0;
    const values = { 'K': 1000, 'Q': 9, 'R': 5, 'B': 3, 'N': 3, 'P': 1, 'k': 1000, 'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1 };
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = board[y][x];
            if (cell && cell.piece) {
                score += cell.piece.startsWith('w') ? -values[cell.piece[1]] : values[cell.piece[1]];
            }
        }
    }
    return score;
}

function minimax(depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || checkGameOver()) return evaluateBoard();
    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = board[y][x];
                if (cell.piece && cell.piece.startsWith('b')) {
                    for (let ty = 0; ty < gridHeight; ty++) {
                        for (let tx = 0; tx < gridWidth; tx++) {
                            if (isValidMoveForAI(x, y, tx, ty)) {
                                const originalPiece = board[y][x].piece;
                                const targetPiece = board[tx][ty] ? board[tx][ty].piece : null;
                                if (targetPiece) whiteCaptured.push(targetPiece);
                                board[tx][ty] = { piece: originalPiece, revealed: true };
                                board[y][x] = { piece: null, revealed: true };
                                const evalScore = minimax(depth - 1, alpha, beta, false);
                                board[y][x] = { piece: originalPiece, revealed: true };
                                board[tx][ty] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: true };
                                if (targetPiece) whiteCaptured.pop();
                                maxEval = Math.max(maxEval, evalScore);
                                alpha = Math.max(alpha, evalScore);
                                if (beta <= alpha) break;
                            }
                        }
                    }
                }
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = board[y][x];
                if (cell.piece && cell.piece.startsWith('w')) {
                    for (let ty = 0; ty < gridHeight; ty++) {
                        for (let tx = 0; tx < gridWidth; tx++) {
                            if (isValidMove(x, y, tx, ty)) {
                                const originalPiece = board[y][x].piece;
                                const targetPiece = board[tx][ty] ? board[tx][ty].piece : null;
                                if (targetPiece) blackCaptured.push(targetPiece);
                                board[tx][ty] = { piece: originalPiece, revealed: true };
                                board[y][x] = { piece: null, revealed: true };
                                const evalScore = minimax(depth - 1, alpha, beta, true);
                                board[y][x] = { piece: originalPiece, revealed: true };
                                board[tx][ty] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: true };
                                if (targetPiece) blackCaptured.pop();
                                minEval = Math.min(minEval, evalScore);
                                beta = Math.min(beta, evalScore);
                                if (beta <= alpha) break;
                            }
                        }
                    }
                }
            }
        }
        return minEval;
    }
}

function aiMove() {
    if (gameOver || currentPlayer !== aiColor) {
        console.log('AI not moving - gameOver:', gameOver, 'currentPlayer:', currentPlayer, 'aiColor:', aiColor);
        aiMoving = false;
        return;
    }
    aiMoving = true;
    console.log('AI moving, currentPlayer:', currentPlayer);

    const validMoves = [];
    const depth = difficulty === 'easy' ? EASY_DEPTH : HARD_DEPTH;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = board[y][x];
            if (cell.piece && cell.piece.startsWith('b')) {
                for (let ty = 0; ty < gridHeight; ty++) {
                    for (let tx = 0; tx < gridWidth; tx++) {
                        if (isValidMoveForAI(x, y, tx, ty)) {
                            validMoves.push({ fromX: x, fromY: y, toX: tx, toY: ty });
                        }
                    }
                }
            }
        }
    }

    if (validMoves.length === 0) {
        console.log('AI has no valid moves, game over');
        gameOver = true;
        aiMoving = false;
        return;
    }

    let bestMove = null, bestScore = -Infinity;
    for (const move of validMoves) {
        const originalPiece = board[move.fromY][move.fromX].piece;
        const targetPiece = board[move.toY][move.toX] ? board[move.toY][move.toX].piece : null;
        if (targetPiece) whiteCaptured.push(targetPiece);
        board[move.toY][move.toX] = { piece: originalPiece, revealed: true };
        board[move.fromY][move.fromX] = { piece: null, revealed: true };
        const evalScore = minimax(depth - 1, -Infinity, Infinity, false);
        board[move.fromY][move.fromX] = { piece: originalPiece, revealed: true };
        board[move.toY][move.toX] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: true };
        if (targetPiece) whiteCaptured.pop();
        if (evalScore > bestScore) {
            bestScore = evalScore;
            bestMove = move;
        }
    }

    const piece = board[bestMove.fromY][bestMove.fromX].piece;
    if (board[bestMove.toY][bestMove.toX].piece) whiteCaptured.push(board[bestMove.toY][bestMove.toX].piece);
    board[bestMove.toY][bestMove.toX] = { piece, revealed: true };
    board[bestMove.fromY][bestMove.fromX] = { piece: null, revealed: true };
    animatePiece(bestMove.fromX, bestMove.fromY, bestMove.toX, bestMove.toY, piece, () => {
        updateScoreboard();
        updateCapturedList();
        if (!checkGameOver()) {
            currentPlayer = playerColor;
            document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'white' ? '白方' : '黑方'}`;
            drawBoard();
        }
        aiMoving = false;
        console.log('AI moved piece from:', bestMove.fromX, bestMove.fromY, 'to:', bestMove.toX, bestMove.toY);
    });
}

function handleMove(e) {
    if (gameOver || currentPlayer !== playerColor || aiMoving) {
        console.log('Move blocked - gameOver:', gameOver, 'currentPlayer:', currentPlayer, 'aiMoving:', aiMoving);
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellWidth);
    const y = Math.floor((e.clientY - rect.top) / cellHeight);
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;

    console.log('Player clicked:', x, y);

    if (selectedPiece) {
        if (isValidMove(selectedPiece.x, selectedPiece.y, x, y)) {
            const piece = board[selectedPiece.y][selectedPiece.x].piece;
            if (board[y][x].piece) blackCaptured.push(board[y][x].piece);
            board[y][x] = { piece, revealed: true };
            board[selectedPiece.y][selectedPiece.x] = { piece: null, revealed: true };
            animatePiece(selectedPiece.x, selectedPiece.y, x, y, piece, () => {
                updateScoreboard();
                updateCapturedList();
                selectedPiece = null;
                if (!checkGameOver()) {
                    currentPlayer = aiColor;
                    document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'white' ? '白方' : '黑方'}`;
                    drawBoard();
                    console.log('Player moved piece, triggering AI');
                    setTimeout(aiMove, 500);
                }
            });
        } else {
            selectedPiece = null;
            drawBoard();
            console.log('Invalid move, deselected');
        }
    } else if (board[y][x].piece && board[y][x].piece.startsWith('w')) {
        selectedPiece = { x, y };
        drawBoard();
        console.log('Player selected piece:', board[y][x].piece);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    canvas.addEventListener('click', e => handleMove(e));
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        handleMove(e.touches[0]);
    }, { passive: false });

    document.getElementById('reset-btn').addEventListener('click', () => {
        initializeBoard();
        drawBoard();
    });

    document.getElementById('easy-btn').addEventListener('click', () => {
        difficulty = 'easy';
        initializeBoard();
        drawBoard();
        updateDifficultyDisplay();
    });

    document.getElementById('hard-btn').addEventListener('click', () => {
        difficulty = 'hard';
        initializeBoard();
        drawBoard();
        updateDifficultyDisplay();
    });

    window.addEventListener('resize', resizeCanvas);

    initializeBoard();
    drawBoard();
    updateScoreboard();
    updateCapturedList();
    updateDifficultyDisplay();
    console.log('Game initialized');
});
