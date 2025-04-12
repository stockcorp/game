const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
const rankOrder = { '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13 };

let deck = [];
let hands = [[], [], [], []];
let tableCards = [];
let currentPlayer = 0;
let lastPlayed = null;
let scores = [0, 0, 0, 0];
let selectedCards = [];
let passes = 0;
let moveHistory = [];
let timer = 30;
let timerInterval = null;
let isAutoPlay = false;
let gameEnded = false;
let isFirstRound = true;

// Sound effects
const startSound = document.getElementById('start-sound');
const passSound = document.getElementById('pass-sound');
const pairSound = document.getElementById('pair-sound');
const straightSound = document.getElementById('straight-sound');
const straightFlushSound = document.getElementById('straight-flush-sound');
const fourOfAKindSound = document.getElementById('four-of-a-kind-sound');
const fullHouseSound = document.getElementById('full-house-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');

function initGame() {
    try {
        startSound.play().catch(e => console.warn('無法播放 start.mp3:', e));
    } catch (e) {
        console.warn('音效初始化錯誤:', e);
    }
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    deck.sort(() => Math.random() - 0.5);
    hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) {
        hands[i % 4].push(deck[i]);
    }
    hands.forEach(hand => hand.sort(compareCards));
    currentPlayer = hands.findIndex(hand => hand.some(card => card.rank === '3' && card.suit === '♣')) || 0;
    tableCards = [];
    lastPlayed = null;
    selectedCards = [];
    passes = 0;
    moveHistory = [];
    timer = 30;
    isAutoPlay = false;
    gameEnded = false;
    isFirstRound = true;
    updateUI();
    updateStatus();
    updateHistory();
    startTimer();
    if (currentPlayer !== 0) {
        setTimeout(aiPlay, 2500);
    } else if (isAutoPlay) {
        setTimeout(autoPlay, 2500);
    }
}

function compareCards(a, b) {
    if (rankOrder[a.rank] !== rankOrder[b.rank]) {
        return rankOrder[b.rank] - rankOrder[a.rank];
    }
    return suitOrder[b.suit] - suitOrder[a.suit];
}

function updateUI() {
    try {
        // Update player hand
        const playerHand = document.getElementById('player-hand');
        playerHand.innerHTML = '<div class="player-label">玩家</div>';
        if (hands[0].length > 0) {
            hands[0].forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card', ['♥', '♦'].includes(card.suit) ? 'red' : 'black');
                if (selectedCards.includes(index)) cardDiv.classList.add('selected');
                cardDiv.textContent = `${card.suit}${card.rank}`;
                cardDiv.onclick = () => toggleCardSelection(index);
                playerHand.appendChild(cardDiv);
            });
        } else {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = '無手牌';
            emptyDiv.style.fontSize = '16px';
            emptyDiv.style.color = '#6b4e31';
            playerHand.appendChild(emptyDiv);
        }

        // Update opponent hands
        for (let i = 1; i <= 3; i++) {
            const aiHand = document.getElementById(`ai${i}-hand`);
            aiHand.innerHTML = '';
            if (hands[i].length > 0) {
                const cardCount = hands[i].length;
                const maxAngle = 60;
                const angleStep = cardCount > 1 ? Math.min(maxAngle / (cardCount - 1), 10) : 0;
                hands[i].forEach((_, j) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.classList.add('opponent-card');
                    const angle = (j - (cardCount - 1) / 2) * angleStep;
                    cardDiv.style.transform = `rotate(${angle}deg)`;
                    cardDiv.style.left = `${j * 10}px`;
                    aiHand.appendChild(cardDiv);
                });
            }
        }

        // Update table cards
        const tableDiv = document.getElementById('table-cards');
        tableDiv.innerHTML = '';
        if (tableCards.length > 0) {
            tableCards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card', ['♥', '♦'].includes(card.suit) ? 'red' : 'black');
                cardDiv.textContent = `${card.suit}${card.rank}`;
                tableDiv.appendChild(cardDiv);
            });
        }

        // Update scoreboard
        document.getElementById('scores').textContent = `玩家: ${scores[0]} | AI 1: ${scores[1]} | AI 2: ${scores[2]} | AI 3: ${scores[3]}`;
        document.getElementById('cards-remaining').textContent = `玩家: ${hands[0].length} | AI 1: ${hands[1].length} | AI 2: ${hands[2].length} | AI 3: ${hands[3].length}`;
    } catch (e) {
        console.error('更新 UI 錯誤:', e);
        showNotification('UI 渲染失敗，請重試！', 'lose');
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `show ${type}`;
    setTimeout(() => notification.className = '', 2000);
}

function updateStatus() {
    const names = ['玩家', 'AI 1', 'AI 2', 'AI 3'];
    if (hands.some(hand => hand.length === 0) && !gameEnded) {
        gameEnded = true;
        const winner = hands.findIndex(hand => hand.length === 0);
        if (winner === 0) {
            winSound.play().catch(e => console.warn('無法播放 win.mp3:', e));
            showNotification('您贏了！', 'win');
        } else {
            loseSound.play().catch(e => console.warn('無法播放 lost.mp3:', e));
            showNotification('您輸了！', 'lose');
        }
        calculateScores();
        clearInterval(timerInterval);
        setTimeout(resetGame, 3000);
    } else {
        document.getElementById('current-player').textContent = `${names[currentPlayer]}${isAutoPlay && currentPlayer === 0 ? ' (電腦代玩)' : ''}`;
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = 30;
    document.getElementById('timer').textContent = `計時器: ${timer}秒`;
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = `計時器: ${timer}秒`;
        if (timer <= 0) pass();
    }, 1000);
}

function updateHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = moveHistory.map((move, i) => `${i + 1}. ${move}`).join('<br>');
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

function toggleCardSelection(index) {
    if (currentPlayer !== 0 || isAutoPlay) return;
    const idx = selectedCards.indexOf(index);
    if (idx === -1) selectedCards.push(index);
    else selectedCards.splice(idx, 1);
    updateUI();
}

function playCards() {
    if (currentPlayer !== 0 || isAutoPlay) {
        showNotification('現在不是您的回合！', 'lose');
        return;
    }
    if (selectedCards.length === 0) {
        showNotification('請選擇卡牌！', 'lose');
        return;
    }
    const cards = selectedCards.map(i => hands[0][i]);
    const combo = getCombination(cards);
    if (!combo) {
        showNotification('無效組合！', 'lose');
        selectedCards = [];
        updateUI();
        return;
    }
    if (isFirstRound && !cards.some(card => card.rank === '3' && card.suit === '♣')) {
        showNotification('第一輪必須包含♣3！', 'lose');
        selectedCards = [];
        updateUI();
        return;
    }
    if (lastPlayed && !canBeat(combo, lastPlayed)) {
        showNotification('出牌必須大於桌面上的牌！', 'lose');
        selectedCards = [];
        updateUI();
        return;
    }
    if (combo.type !== 'single') playComboSound(combo.type);
    animateCards(cards, 'player', combo.type);
    moveHistory.push(`玩家出: ${combo.type} (${cards.map(c => `${c.suit}${c.rank}`).join(', ')})`);
    selectedCards.sort((a, b) => b - a);
    for (let i of selectedCards) hands[0].splice(i, 1);
    selectedCards = [];
    passes = 0;
    if (isFirstRound && cards.some(card => card.rank === '3' && card.suit === '♣')) isFirstRound = false;
    nextPlayer();
}

function pass() {
    if (currentPlayer !== 0 || isAutoPlay) return;
    if (isFirstRound && hands[0].some(card => card.rank === '3' && card.suit === '♣')) {
        showNotification('持有梅花三必須出牌！', 'lose');
        return;
    }
    passSound.play().catch(e => console.warn('無法播放 pass.mp3:', e));
    moveHistory.push('玩家: 過牌');
    passes++;
    if (passes >= 3) {
        tableCards = [];
        lastPlayed = null;
        passes = 0;
        isFirstRound = false;
    }
    nextPlayer();
}

function autoPlay() {
    if (currentPlayer !== 0 || !isAutoPlay) return;
    const hand = hands[0];
    if (isFirstRound) {
        let validCombos = getAllCombinations(hand).filter(combo => 
            combo.cards.some(card => card.rank === '3' && card.suit === '♣')
        );
        if (validCombos.length > 0) {
            const combo = validCombos[0];
            if (combo.type !== 'single') playComboSound(combo.type);
            animateCards(combo.cards, 'player', combo.type);
            moveHistory.push(`玩家 (電腦代玩) 出: ${combo.type} (${combo.cards.map(c => `${c.suit}${c.rank}`).join(', ')})`);
            tableCards = combo.cards;
            lastPlayed = combo;
            hands[0] = hand.filter(card => !combo.cards.includes(card));
            passes = 0;
            isFirstRound = false;
            nextPlayer();
            return;
        }
    }
    const combos = getAllCombinations(hand);
    let validCombo = null;
    for (let combo of combos) {
        if (!lastPlayed || canBeat(combo, lastPlayed)) {
            validCombo = combo;
            break;
        }
    }
    if (validCombo) {
        if (validCombo.type !== 'single') playComboSound(validCombo.type);
        animateCards(validCombo.cards, 'player', validCombo.type);
        moveHistory.push(`玩家 (電腦代玩) 出: ${validCombo.type} (${validCombo.cards.map(c => `${c.suit}${c.rank}`).join(', ')})`);
        tableCards = validCombo.cards;
        lastPlayed = validCombo;
        hands[0] = hand.filter(card => !combo.cards.includes(card));
        passes = 0;
    } else {
        if (isFirstRound && hand.some(card => card.rank === '3' && card.suit === '♣')) {
            showNotification('持有梅花三必須出牌！', 'lose');
            return;
        }
        passSound.play().catch(e => console.warn('無法播放 pass.mp3:', e));
        moveHistory.push('玩家 (電腦代玩): 過牌');
        passes++;
        if (passes >= 3) {
            tableCards = [];
            lastPlayed = null;
            passes = 0;
            isFirstRound = false;
        }
    }
    nextPlayer();
}

function toggleAutoPlay() {
    isAutoPlay = !isAutoPlay;
    document.getElementById('current-player').textContent = isAutoPlay ? '玩家 (電腦代玩)' : '玩家';
    if (isAutoPlay && currentPlayer === 0) {
        setTimeout(autoPlay, 2500);
    } else {
        startTimer();
    }
}

function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % 4;
    updateUI();
    updateStatus();
    if (hands[currentPlayer].length === 0) {
        calculateScores();
        return;
    }
    startTimer();
    if (currentPlayer !== 0) {
        setTimeout(aiPlay, 2500);
    } else if (isAutoPlay) {
        setTimeout(autoPlay, 2500);
    }
}

function aiPlay() {
    const hand = hands[currentPlayer];
    const names = ['玩家', 'AI 1', 'AI 2', 'AI 3'];
    if (isFirstRound && !hand.some(card => card.rank === '3' && card.suit === '♣')) {
        passSound.play().catch(e => console.warn('無法播放 pass.mp3:', e));
        moveHistory.push(`${names[currentPlayer]}: 過牌`);
        passes++;
        if (passes >= 3) {
            tableCards = [];
            lastPlayed = null;
            passes = 0;
            isFirstRound = false;
        }
        nextPlayer();
        return;
    }
    if (isFirstRound) {
        let validCombos = getAllCombinations(hand).filter(combo => 
            combo.cards.some(card => card.rank === '3' && card.suit === '♣')
        );
        if (validCombos.length > 0) {
            const combo = validCombos[0];
            if (combo.type !== 'single') playComboSound(combo.type);
            animateCards(combo.cards, `ai${currentPlayer}`, combo.type);
            moveHistory.push(`${names[currentPlayer]}出: ${combo.type} (${combo.cards.map(c => `${c.suit}${c.rank}`).join(', ')})`);
            tableCards = combo.cards;
            lastPlayed = combo;
            hands[currentPlayer] = hand.filter(card => !combo.cards.includes(card));
            passes = 0;
            isFirstRound = false;
            nextPlayer();
            return;
        }
    }
    const combos = getAllCombinations(hand);
    let validCombo = null;
    for (let combo of combos) {
        if (!lastPlayed || canBeat(combo, lastPlayed)) {
            validCombo = combo;
            break;
        }
    }
    if (validCombo) {
        if (validCombo.type !== 'single') playComboSound(validCombo.type);
        animateCards(validCombo.cards, `ai${currentPlayer}`, validCombo.type);
        moveHistory.push(`${names[currentPlayer]}出: ${combo.type} (${combo.cards.map(c => `${c.suit}${c.rank}`).join(', ')})`);
        tableCards = validCombo.cards;
        lastPlayed = validCombo;
        hands[currentPlayer] = hand.filter(card => !combo.cards.includes(card));
        passes = 0;
    } else {
        passSound.play().catch(e => console.warn('無法播放 pass.mp3:', e));
        moveHistory.push(`${names[currentPlayer]}: 過牌`);
        passes++;
        if (passes >= 3) {
            tableCards = [];
            lastPlayed = null;
            passes = 0;
            isFirstRound = false;
        }
    }
    nextPlayer();
}

function playComboSound(type) {
    const sounds = {
        'pair': pairSound,
        'straight': straightSound,
        'straightFlush': straightFlushSound,
        'fourOfAKind': fourOfAKindSound,
        'fullHouse': fullHouseSound
    };
    if (sounds[type]) sounds[type].play().catch(e => console.warn(`無法播放 ${type} 音效:`, e));
}

function animateCards(cards, source, comboType) {
    const tableDiv = document.getElementById('table-cards');
    tableDiv.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', ['♥', '♦'].includes(card.suit) ? 'red' : 'black', 'animate-slide', 'animate-flip');
        cardDiv.textContent = `${card.suit}${card.rank}`;
        let startX = 0, startY = 0;
        if (source === 'player') {
            startX = 0;
            startY = 200;
        } else if (source === 'ai1') {
            startX = 0;
            startY = -200;
        } else if (source === 'ai2') {
            startX = -300;
            startY = 0;
        } else if (source === 'ai3') {
            startX = 300;
            startY = 0;
        }
        cardDiv.style.setProperty('--start-x', `${startX}px`);
        cardDiv.style.setProperty('--start-y', `${startY}px`);
        cardDiv.style.transform = `translate(${startX}px, ${startY}px) rotateY(180deg)`;
        tableDiv.appendChild(cardDiv);
        setTimeout(() => {
            cardDiv.style.transform = 'translate(0, 0) rotateY(0deg)';
            cardDiv.classList.remove('animate-slide', 'animate-flip');
        }, 50);
    });
    setTimeout(() => {
        tableCards = cards;
        updateUI();
    }, 500);
}

function getCombination(cards) {
    cards.sort(compareCards);
    const counts = {};
    cards.forEach(card => counts[card.rank] = (counts[card.rank] || 0) + 1);

    if (cards.length === 1) {
        return { type: 'single', value: rankOrder[cards[0].rank], suit: suitOrder[cards[0].suit], cards };
    }
    if (cards.length === 2 && cards[0].rank === cards[1].rank) {
        return { type: 'pair', value: rankOrder[cards[0].rank], suit: Math.max(suitOrder[cards[0].suit], suitOrder[cards[1].suit]), cards };
    }
    if (cards.length === 5) {
        if (isStraight(cards)) {
            let value, suit;
            const sequence = cards.map(c => c.rank).sort((a, b) => rankOrder[b] - rankOrder[a]).join('');
            if (sequence === '23456') {
                value = 14;
                suit = suitOrder[cards.find(c => c.rank === '2').suit];
            } else if (sequence === 'A2345') {
                value = 0;
                suit = suitOrder[cards.find(c => c.rank === '5').suit];
            } else {
                value = rankOrder[cards[0].rank];
                suit = suitOrder[cards[0].suit];
            }
            return { type: 'straight', value, suit, cards };
        }
        if (Object.values(counts).sort().join('') === '23') {
            let tripleRank = Object.keys(counts).find(k => counts[k] === 3);
            return { type: 'fullHouse', value: rankOrder[tripleRank], cards };
        }
    }
    if (cards.length === 5 && Object.values(counts).includes(4)) {
        let fourRank = Object.keys(counts).find(k => counts[k] === 4);
        return { type: 'fourOfAKind', value: rankOrder[fourRank], cards };
    }
    if (cards.length === 7) {
        let fiveCards = cards.slice(0, 5);
        fiveCards.sort(compareCards);
        if (isStraightFlush(fiveCards)) {
            let value, suit;
            const sequence = fiveCards.map(c => c.rank).sort((a, b) => rankOrder[b] - rankOrder[a]).join('');
            if (sequence === '23456') {
                value = 14;
                suit = suitOrder[fiveCards.find(c => c.rank === '2').suit];
            } else if (sequence === 'A2345') {
                value = 0;
                suit = suitOrder[fiveCards.find(c => c.rank === '5').suit];
            } else {
                value = rankOrder[fiveCards[0].rank];
                suit = suitOrder[fiveCards[0].suit];
            }
            return { type: 'straightFlush', value, suit, cards };
        }
    }
    return null;
}

function canBeat(newCombo, oldCombo) {
    const typeOrder = { 'straightFlush': 5, 'fourOfAKind': 4, 'fullHouse': 3, 'straight': 2, 'pair': 1, 'single': 0 };

    if (newCombo.type === 'pair') {
        if (oldCombo.type === 'pair') {
            if (newCombo.value !== oldCombo.value) return newCombo.value > oldCombo.value;
            return newCombo.suit > oldCombo.suit;
        }
        if (oldCombo.type === 'fourOfAKind' || oldCombo.type === 'straightFlush') return false;
        showNotification('一對只能被一對、鐵支或同花順壓！', 'lose');
        return false;
    }

    if (newCombo.type === 'fullHouse') {
        if (oldCombo.type === 'pair') {
            showNotification('葫蘆和一對不能互壓！', 'lose');
            return false;
        }
        if (oldCombo.type === 'fullHouse') return newCombo.value > oldCombo.value;
        if (oldCombo.type === 'fourOfAKind' || oldCombo.type === 'straightFlush') return false;
        return true;
    }

    if (typeOrder[newCombo.type] > typeOrder[oldCombo.type]) return true;
    if (typeOrder[newCombo.type] < typeOrder[oldCombo.type]) return false;
    if (newCombo.type === 'single') {
        if (newCombo.value !== oldCombo.value) return newCombo.value > oldCombo.value;
        return newCombo.suit > oldCombo.suit;
    }
    if (newCombo.type === 'straight' || newCombo.type === 'straightFlush') {
        return newCombo.value > oldCombo.value;
    }
    if (newCombo.type === 'fourOfAKind') {
        return newCombo.value > oldCombo.value;
    }
    return false;
}

function getAllCombinations(hand) {
    let combos = [];
    hand.forEach(card => combos.push({ type: 'single', value: rankOrder[card.rank], suit: suitOrder[card.suit], cards: [card] }));
    for (let i = 0; i < hand.length - 1; i++) {
        if (hand[i].rank === hand[i + 1].rank) {
            combos.push({ type: 'pair', value: rankOrder[hand[i].rank], suit: Math.max(suitOrder[hand[i].suit], suitOrder[hand[i + 1].suit]), cards: [hand[i], hand[i + 1]] });
        }
    }
    if (hand.length >= 5) combos.push(...getFiveCardCombinations(hand));
    if (hand.length >= 7) combos.push(...getSevenCardCombinations(hand));
    return combos.sort((a, b) => {
        const typeOrder = { 'straightFlush': 5, 'fourOfAKind': 4, 'fullHouse': 3, 'straight': 2, 'pair': 1, 'single': 0 };
        if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[b.type] - typeOrder[a.type];
        if (a.value !== b.value) return b.value - a.value;
        if (a.suit && b.suit) return b.suit - a.suit;
        return 0;
    });
}

function getFiveCardCombinations(hand) {
    const combos = [];
    const combinations = getCombinations(hand, 5);
    combinations.forEach(cards => {
        cards.sort(compareCards);
        if (isStraight(cards)) {
            let value, suit;
            const sequence = cards.map(c => c.rank).sort((a, b) => rankOrder[b] - rankOrder[a]).join('');
            if (sequence === '23456') {
                value = 14;
                suit = suitOrder[cards.find(c => c.rank === '2').suit];
            } else if (sequence === 'A2345') {
                value = 0;
                suit = suitOrder[cards.find(c => c.rank === '5').suit];
            } else {
                value = rankOrder[cards[0].rank];
                suit = suitOrder[cards[0].suit];
            }
            combos.push({ type: 'straight', value, suit, cards });
        }
        const counts = {};
        cards.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
        if (Object.values(counts).sort().join('') === '23') {
            let tripleRank = Object.keys(counts).find(k => counts[k] === 3);
            combos.push({ type: 'fullHouse', value: rankOrder[tripleRank], cards });
        }
        if (Object.values(counts).includes(4)) {
            let fourRank = Object.keys(counts).find(k => counts[k] === 4);
            combos.push({ type: 'fourOfAKind', value: rankOrder[fourRank], cards });
        }
    });
    return combos;
}

function getSevenCardCombinations(hand) {
    const combos = [];
    const combinations = getCombinations(hand, 7);
    combinations.forEach(cards => {
        let fiveCards = cards.slice(0, 5);
        fiveCards.sort(compareCards);
        if (isStraightFlush(fiveCards)) {
            let value, suit;
            const sequence = fiveCards.map(c => c.rank).sort((a, b) => rankOrder[b] - rankOrder[a]).join('');
            if (sequence === '23456') {
                value = 14;
                suit = suitOrder[fiveCards.find(c => c.rank === '2').suit];
            } else if (sequence === 'A2345') {
                value = 0;
                suit = suitOrder[fiveCards.find(c => c.rank === '5').suit];
            } else {
                value = rankOrder[fiveCards[0].rank];
                suit = suitOrder[fiveCards[0].suit];
            }
            combos.push({ type: 'straightFlush', value, suit, cards });
        }
    });
    return combos;
}

function getCombinations(arr, k) {
    const result = [];
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    combine(0, []);
    return result;
}

function isStraight(cards) {
    const validSequences = [
        '23456', '34567', '45678', '56789', '678910', '78910J', '8910JQ', '910JQK', '10JQKA', 'A2345'
    ];
    let ranks = cards.map(card => card.rank);
    let sequence = ranks.sort((a, b) => rankOrder[b] - rankOrder[a]).join('');
    return validSequences.includes(sequence);
}

function isFlush(cards) {
    return cards.every(card => card.suit === cards[0].suit);
}

function isStraightFlush(cards) {
    return isStraight(cards) && isFlush(cards);
}

function calculateScores() {
    let winner = hands.findIndex(hand => hand.length === 0);
    if (winner === -1) return;
    let points = 0;
    hands.forEach((hand, index) => {
        if (index !== winner) {
            let count = hand.length;
            let penalty = count <= 9 ? count : count <= 12 ? count * 2 : count * 3;
            points += penalty;
        }
    });
    scores[winner] += points;
    updateUI();
    updateStatus();
    updateHistory();
}

function resetGame() {
    hands = [[], [], [], []];
    initGame();
    updateUI();
}

// Bind buttons
document.getElementById('play-btn').onclick = playCards;
document.getElementById('pass-btn').onclick = pass;
document.getElementById('auto-btn').onclick = toggleAutoPlay;
document.getElementById('reset-btn').onclick = resetGame;

// Preload sounds on user interaction
document.addEventListener('click', () => {
    [startSound, passSound, pairSound, straightSound, straightFlushSound, fourOfAKindSound, fullHouseSound, winSound, loseSound]
        .forEach(sound => sound.load());
}, { once: true });

initGame();