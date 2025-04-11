// 初始棋盤設置
const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// 棋子符號對應 Unicode
const pieceSymbols = {
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
};

let board = JSON.parse(JSON.stringify(initialBoard));
let selectedPiece = null;
let currentPlayer = 'white';

function createBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            if (board[row][col]) {
                square.textContent = pieceSymbols[board[row][col]];
            }
            square.addEventListener('click', handleSquareClick);
            chessboard.appendChild(square);
        }
    }
}

function handleSquareClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (selectedPiece) {
        // 嘗試移動棋子
        if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            clearHighlights();
            selectedPiece = null;
            togglePlayer();
        } else {
            clearHighlights();
            selectedPiece = null;
        }
    }

    // 選擇棋子
    const piece = board[row][col];
    if (piece && isPlayerPiece(piece)) {
        selectedPiece = { row, col };
        highlightSquare(row, col, 'selected');
        highlightPossibleMoves(row, col);
    }
}

function isPlayerPiece(piece) {
    if (currentPlayer === 'white') {
        return piece === piece.toUpperCase();
    } else {
        return piece === piece.toLowerCase();
    }
}

function highlightSquare(row, col, type) {
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    square.classList.add(type);
}

function clearHighlights() {
    document.querySelectorAll('.selected, .possible').forEach(square => {
        square.classList.remove('selected', 'possible');
    });
}

function highlightPossibleMoves(row, col) {
    // 簡化版：僅示例兵的移動
    const piece = board[row][col];
    if (piece.toLowerCase() === 'p') {
        const direction = piece === 'P' ? -1 : 1;
        const newRow = row + direction;
        if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
            highlightSquare(newRow, col, 'possible');
        }
    }
    // 可擴展其他棋子的移動規則
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (piece.toLowerCase() === 'p') {
        const direction = piece === 'P' ? -1 : 1;
        const startRow = piece === 'P' ? 6 : 1;
        // 兵向前一格
        if (fromCol === toCol && toRow === fromRow + direction && !board[toRow][toCol]) {
            return true;
        }
        // 兵向前兩格
        if (fromRow === startRow && fromCol === toCol && toRow === fromRow + 2 * direction && !board[toRow][toCol] && !board[fromRow + direction][toCol]) {
            return true;
        }
        // 兵吃子
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && board[toRow][toCol] && !isPlayerPiece(board[toRow][toCol])) {
            return true;
        }
    }
    return false; // 其他棋子規則待實現
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = '';
    createBoard();
}

function togglePlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    document.getElementById('status').textContent = `輪到${currentPlayer === 'white' ? '白方' : '黑方'}`;
}

// 初始化遊戲
createBoard();