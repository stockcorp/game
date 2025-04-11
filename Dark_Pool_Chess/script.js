const canvas = document.getElementById('dark-pool-board');
const ctx = canvas.getContext('2d');
const gridWidth = 8, gridHeight = 4;
let cellWidth, cellHeight, board = [];
let currentPlayer = 'red'; // 玩家初始為紅方，翻棋後確定陣營
let playerColor = null, aiColor = null;
let redScore = 16, blackScore = 16;
const stoneSound = document.getElementById('stone-sound');
let selectedPiece = null, gameOver = false;
let redCaptured = [], blackCaptured = [];
let difficulty = 'easy';
const EASY_DEPTH = 3, HARD_DEPTH = 4;
let firstMove = true;
let aiMoving = false;

function resizeCanvas() {
    try {
        const containerWidth = document.querySelector('.board-section').offsetWidth || 480;
        const maxWidth = Math.min(containerWidth, 480);
        canvas.width = maxWidth;
        canvas.height = maxWidth / 2;
        cellWidth = canvas.width / gridWidth;
        cellHeight = canvas.height / gridHeight;
        drawBoard();
        console.log('Canvas resized:', canvas.width, canvas.height);
    } catch (error) {
        console.error('Resize canvas failed:', error);
    }
}

function initializeBoard() {
    const pieces = [
        'K', 'A', 'A', 'B', 'B', 'N', 'N', 'R', 'R', 'P', 'P', 'S', 'S', 'S', 'S', 'S',
        'k', 'a', 'a', 'b', 'b', 'n', 'n', 'r', 'r', 'p', 'p', 's', 's', 's', 's', 's'
    ];
    shuffleArray(pieces);
    board = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));
    let index = 0;
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            board[y][x] = { piece: pieces[index++], revealed: false };
        }
    }
    console.log('Board initialized - Red King:', board.flat().some(cell => cell && cell.piece === 'K'));
    console.log('Board initialized - Black King:', board.flat().some(cell => cell && cell.piece === 'k'));
    
    redScore = 16;
    blackScore = 16;
    redCaptured = [];
    blackCaptured = [];
    gameOver = false;
    currentPlayer = 'red';
    playerColor = null;
    aiColor = null;
    firstMove = true;
    selectedPiece = null;
    aiMoving = false;
    updateScoreboard();
    updateCapturedList();
    updateDifficultyDisplay();
    resizeCanvas();
    checkAudio();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
        ctx.fillStyle = '#f0d9b5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#4a2c00';
        ctx.lineWidth = 1;
        for (let x = 0; x <= gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellWidth, 0);
            ctx.lineTo(x * cellWidth, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellHeight);
            ctx.lineTo(canvas.width, y * cellHeight);
            ctx.stroke();
        }
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
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
        console.log('Board drawn');
    } catch (error) {
        console.error('Draw board failed:', error);
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
        else if (callback) callback();
    }

    if (stoneSound) {
        stoneSound.currentTime = 0;
        stoneSound.play().catch(error => console.error('Audio play failed:', error));
    }
    requestAnimationFrame(step);
}

function updateScoreboard() {
    redScore = board.flat().filter(cell => cell && cell.piece && cell.piece === cell.piece.toUpperCase()).length;
    blackScore = board.flat().filter(cell => cell && cell.piece && cell.piece === cell.piece.toLowerCase()).length;
    document.getElementById('red-score').textContent = `紅方：${redScore}`;
    document.getElementById('black-score').textContent = `黑方：${blackScore}`;
    const currentPlayerElement = document.getElementById('current-player');
    currentPlayerElement.textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
    currentPlayerElement.classList.remove('red', 'black');
    currentPlayerElement.classList.add(currentPlayer);
}

function updateCapturedList() {
    const symbols = { K: '將', A: '士', B: '象', N: '馬', R: '車', P: '炮', S: '兵', k: '帥', a: '士', b: '相', n: '馬', r: '車', p: '炮', s: '卒' };
    document.getElementById('red-captured').innerHTML = `紅方被吃：<span>${redCaptured.map(p => symbols[p]).join(', ')}</span>`;
    document.getElementById('black-captured').innerHTML = `黑方被吃：<span>${blackCaptured.map(p => symbols[p]).join(', ')}</span>`;
}

function updateDifficultyDisplay() {
    document.getElementById('difficulty-display').textContent = `模式：${difficulty === 'easy' ? '簡單' : '困難'}`;
}

function checkGameOver() {
    if (firstMove) return false;
    const redKingExists = board.some(row => row.some(cell => cell && cell.piece === 'K'));
    const blackKingExists = board.some(row => row.some(cell => cell && cell.piece === 'k'));
    
    if (!redKingExists && blackKingExists) {
        gameOver = true;
        alert('黑方勝！');
        return true;
    }
    if (!blackKingExists && redKingExists) {
        gameOver = true;
        alert('紅方勝！');
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

function isValidMove(fromX, fromY, toX, toY) {
    if (!playerColor || !board[fromY][fromX] || !board[fromY][fromX].revealed) return false;
    const piece = board[fromY][fromX].piece;
    const isPlayerPiece = playerColor === 'red' ? /[KABNRPS]/.test(piece) : /[kabnrps]/.test(piece);
    if (!isPlayerPiece) return false;
    
    const dx = Math.abs(toX - fromX), dy = Math.abs(toY - fromY);
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return false;

    const target = board[toY][toX] ? board[toY][toX].piece : null;
    if (!target) return true;
    
    const isOpponentPiece = playerColor === 'red' ? /[kabnrps]/.test(target) : /[KABNRPS]/.test(target);
    if (!isOpponentPiece) return false;

    if (piece === 'P' || piece === 'p') {
        const midX = fromX + (toX - fromX) / 2, midY = fromY + (toY - fromY) / 2;
        return board[midY][midX] && board[midY][midX].piece && canEat(piece, target);
    }
    return canEat(piece, target);
}

function isValidMoveForAI(fromX, fromY, toX, toY) {
    if (!aiColor || !board[fromY][fromX] || !board[fromY][fromX].revealed) return false;
    const piece = board[fromY][fromX].piece;
    const isAIPiece = aiColor === 'red' ? /[KABNRPS]/.test(piece) : /[kabnrps]/.test(piece);
    if (!isAIPiece) return false;
    
    const dx = Math.abs(toX - fromX), dy = Math.abs(toY - fromY);
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return false;

    const target = board[toY][toX] ? board[toY][toX].piece : null;
    if (!target) return true;
    
    const isOpponentPiece = aiColor === 'red' ? /[kabnrps]/.test(target) : /[KABNRPS]/.test(target);
    if (!isOpponentPiece) return false;

    if (piece === 'P' || piece === 'p') {
        const midX = fromX + (toX - fromX) / 2, midY = fromY + (toY - fromY) / 2;
        return board[midY][midX] && board[midY][midX].piece && canEat(piece, target);
    }
    return canEat(piece, target);
}

function evaluateBoard() {
    let score = 0;
    const values = { K: 1000, A: 2, B: 2, N: 4, R: 9, P: 4.5, S: 1, k: 1000, a: 2, b: 2, n: 4, r: 9, p: 4.5, s: 1 };
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = board[y][x];
            if (cell && cell.revealed && cell.piece) {
                score += cell.piece === cell.piece.toUpperCase() ? -values[cell.piece] : values[cell.piece];
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
                if (!cell.revealed) {
                    board[y][x].revealed = true;
                    const evalScore = minimax(depth - 1, alpha, beta, false);
                    board[y][x].revealed = false;
                    maxEval = Math.max(maxEval, evalScore);
                    alpha = Math.max(alpha, evalScore);
                    if (beta <= alpha) break;
                } else if (cell.piece && isAIPiece(cell.piece)) {
                    for (let ty = 0; ty < gridHeight; ty++) {
                        for (let tx = 0; tx < gridWidth; tx++) {
                            if (isValidMoveForAI(x, y, tx, ty)) {
                                const originalPiece = board[y][x].piece;
                                const targetPiece = board[tx][ty] ? board[tx][ty].piece : null;
                                if (targetPiece) {
                                    if (aiColor === 'red') blackCaptured.push(targetPiece);
                                    else redCaptured.push(targetPiece);
                                }
                                board[tx][ty] = { piece: originalPiece, revealed: true };
                                board[y][x] = { piece: null, revealed: false };
                                const evalScore = minimax(depth - 1, alpha, beta, false);
                                board[y][x] = { piece: originalPiece, revealed: true };
                                board[tx][ty] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: false };
                                if (targetPiece) {
                                    if (aiColor === 'red') blackCaptured.pop();
                                    else redCaptured.pop();
                                }
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
                if (!cell.revealed) {
                    board[y][x].revealed = true;
                    const evalScore = minimax(depth - 1, alpha, beta, true);
                    board[y][x].revealed = false;
                    minEval = Math.min(minEval, evalScore);
                    beta = Math.min(beta, evalScore);
                    if (beta <= alpha) break;
                } else if (cell.piece && isPlayerPiece(cell.piece)) {
                    for (let ty = 0; ty < gridHeight; ty++) {
                        for (let tx = 0; tx < gridWidth; tx++) {
                            if (isValidMove(x, y, tx, ty)) {
                                const originalPiece = board[y][x].piece;
                                const targetPiece = board[tx][ty] ? board[tx][ty].piece : null;
                                if (targetPiece) {
                                    if (playerColor === 'red') blackCaptured.push(targetPiece);
                                    else redCaptured.push(targetPiece);
                                }
                                board[tx][ty] = { piece: originalPiece, revealed: true };
                                board[y][x] = { piece: null, revealed: false };
                                const evalScore = minimax(depth - 1, alpha, beta, true);
                                board[y][x] = { piece: originalPiece, revealed: true };
                                board[tx][ty] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: false };
                                if (targetPiece) {
                                    if (playerColor === 'red') blackCaptured.pop();
                                    else redCaptured.pop();
                                }
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

function isPlayerPiece(piece) {
    return playerColor === 'red' ? /[KABNRPS]/.test(piece) : /[kabnrps]/.test(piece);
}

function isAIPiece(piece) {
    return aiColor === 'red' ? /[KABNRPS]/.test(piece) : /[kabnrps]/.test(piece);
}

function aiMove() {
    if (gameOver || !aiColor || currentPlayer !== aiColor || aiMoving) {
        console.log('AI not moving - gameOver:', gameOver, 'aiColor:', aiColor, 'currentPlayer:', currentPlayer, 'aiMoving:', aiMoving);
        return;
    }
    aiMoving = true;
    console.log('AI moving');

    const validMoves = [];
    const depth = difficulty === 'easy' ? EASY_DEPTH : HARD_DEPTH;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cell = board[y][x];
            if (!cell.revealed) {
                validMoves.push({ type: 'flip', x, y });
            } else if (cell.piece && isAIPiece(cell.piece)) {
                for (let ty = 0; ty < gridHeight; ty++) {
                    for (let tx = 0; tx < gridWidth; tx++) {
                        if (isValidMoveForAI(x, y, tx, ty)) {
                            validMoves.push({ type: 'move', fromX: x, fromY: y, toX: tx, toY: ty });
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
        if (move.type === 'flip') {
            board[move.y][move.x].revealed = true;
            const evalScore = minimax(depth - 1, -Infinity, Infinity, false);
            board[move.y][move.x].revealed = false;
            if (evalScore > bestScore) {
                bestScore = evalScore;
                bestMove = move;
            }
        } else {
            const originalPiece = board[move.fromY][move.fromX].piece;
            const targetPiece = board[move.toY][move.toX] ? board[move.toY][move.toX].piece : null;
            if (targetPiece) {
                if (aiColor === 'red') blackCaptured.push(targetPiece);
                else redCaptured.push(targetPiece);
            }
            board[move.toY][move.toX] = { piece: originalPiece, revealed: true };
            board[move.fromY][move.fromX] = { piece: null, revealed: false };
            const evalScore = minimax(depth - 1, -Infinity, Infinity, false);
            board[move.fromY][move.fromX] = { piece: originalPiece, revealed: true };
            board[move.toY][move.toX] = targetPiece ? { piece: targetPiece, revealed: true } : { piece: null, revealed: false };
            if (targetPiece) {
                if (aiColor === 'red') blackCaptured.pop();
                else redCaptured.pop();
            }
            if (evalScore > bestScore) {
                bestScore = evalScore;
                bestMove = move;
            }
        }
    }

    if (bestMove.type === 'flip') {
        board[bestMove.y][bestMove.x].revealed = true;
        animatePiece(bestMove.x, bestMove.y, bestMove.x, bestMove.y, board[bestMove.y][bestMove.x].piece, () => {
            updateScoreboard();
            updateCapturedList();
            if (!checkGameOver()) {
                currentPlayer = playerColor;
                document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
                drawBoard();
            }
            aiMoving = false;
            console.log('AI flipped piece');
        });
    } else {
        const piece = board[bestMove.fromY][bestMove.fromX].piece;
        if (board[bestMove.toY][bestMove.toX].piece) {
            if (aiColor === 'red') blackCaptured.push(board[bestMove.toY][bestMove.toX].piece);
            else redCaptured.push(board[bestMove.toY][bestMove.toX].piece);
        }
        board[bestMove.toY][bestMove.toX] = { piece, revealed: true };
        board[bestMove.fromY][bestMove.fromX] = { piece: null, revealed: false };
        animatePiece(bestMove.fromX, bestMove.fromY, bestMove.toX, bestMove.toY, piece, () => {
            updateScoreboard();
            updateCapturedList();
            if (!checkGameOver()) {
                currentPlayer = playerColor;
                document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
                drawBoard();
            }
            aiMoving = false;
            console.log('AI moved piece');
        });
    }
}

function handleMove(e) {
    if (gameOver || (playerColor && currentPlayer !== playerColor) || aiMoving) {
        console.log('Move blocked - gameOver:', gameOver, 'playerColor:', playerColor, 'currentPlayer:', currentPlayer, 'aiMoving:', aiMoving);
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellWidth);
    const y = Math.floor((e.clientY - rect.top) / cellHeight);
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;

    console.log('Player clicked:', x, y);

    if (firstMove) {
        if (!board[y][x].revealed) {
            board[y][x].revealed = true;
            const piece = board[y][x].piece;
            playerColor = piece === piece.toUpperCase() ? 'red' : 'black';
            aiColor = playerColor === 'red' ? 'black' : 'red';
            animatePiece(x, y, x, y, piece, () => {
                updateScoreboard();
                updateCapturedList();
                firstMove = false;
                currentPlayer = aiColor;
                document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
                drawBoard();
                setTimeout(aiMove, 500);
                console.log('First move - playerColor:', playerColor, 'aiColor:', aiColor);
            });
        }
    } else if (selectedPiece) {
        if (isValidMove(selectedPiece.x, selectedPiece.y, x, y)) {
            const piece = board[selectedPiece.y][selectedPiece.x].piece;
            if (board[y][x].piece) {
                if (playerColor === 'red') blackCaptured.push(board[y][x].piece);
                else redCaptured.push(board[y][x].piece);
            }
            board[y][x] = { piece, revealed: true };
            board[selectedPiece.y][selectedPiece.x] = { piece: null, revealed: false };
            animatePiece(selectedPiece.x, selectedPiece.y, x, y, piece, () => {
                updateScoreboard();
                updateCapturedList();
                selectedPiece = null;
                if (!checkGameOver()) {
                    currentPlayer = aiColor;
                    document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
                    drawBoard();
                    setTimeout(aiMove, 500);
                }
                console.log('Player moved piece');
            });
        } else {
            selectedPiece = null;
            drawBoard();
            console.log('Invalid move, deselected');
        }
    } else if (!board[y][x].revealed) {
        board[y][x].revealed = true;
        animatePiece(x, y, x, y, board[y][x].piece, () => {
            updateScoreboard();
            updateCapturedList();
            if (!checkGameOver()) {
                currentPlayer = aiColor;
                document.getElementById('current-player').textContent = `當前玩家：${currentPlayer === 'red' ? '紅方' : '黑方'}`;
                drawBoard();
                setTimeout(aiMove, 500);
            }
            console.log('Player flipped piece');
        });
    } else if (board[y][x].piece && isPlayerPiece(board[y][x].piece)) {
        selectedPiece = { x, y };
        drawBoard();
        console.log('Player selected piece:', board[y][x].piece);
    }
}

// 事件監聽器移至 DOMContentLoaded
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
