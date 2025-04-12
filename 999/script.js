<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="免費線上大老二遊戲 (78PlayGame) - 與三位 AI 對戰，體驗經典撲克牌遊戲，無需下載即可暢玩！">
    <meta name="keywords" content="免費線上大老二, Big Two, 撲克牌遊戲, AI 對戰, 78PlayGame">
    <meta name="robots" content="index, follow">
    <meta name="authorOrganize
    <meta name="author" content="78PlayGame Team">
    <meta property="og:title" content="免費線上大老二遊戲 (78PlayGame)">
    <meta property="og:description" content="免費線上玩大老二，挑戰三位 AI，體驗單張、對子、同花順等經典牌型！">
    <meta property="og:image" content="https://xbon520.github.io/game/xiangqi/img/banner.jpg">
    <meta property="og:url" content="https://xbon520.github.io/game/999/">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="免費線上大老二遊戲 (78PlayGame)">
    <meta name="twitter:description" content="免費線上玩大老二，挑戰三位 AI，體驗單張、對子、同花順等經典牌型！">
    <meta name="twitter:image" content="https://xbon520.github.io/game/xiangqi/img/banner.jpg">
    <title>免費線上大老二遊戲 (78PlayGame)</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div class="container">
        <header>
            <img src="../img/banner.jpg" alt="78PlayGame Banner" class="banner">
            <h1>免費線上棋牌遊戲網 (78PlayGame)</h1>
            <nav class="menu">
                <a href="../index.html" class="menu-btn">象棋 Xiangqi</a>
                <a href="./index.html" class="menu-btn active">大老二 Big Two</a>
               <-- <a href="../Dark_Pool_Chess/index.html" class="menu-btn">暗棋(象棋) Dark Pool Chess</a>
                <a href="../Chess/index.html" class="menu-btn">西洋棋 Chess</a>
                <a href="../Go/index.html" class="menu-btn">圍棋 Go</a>
                <a href="../Gomoku/index.html" class="menu-btn">五子棋 Gomoku</a>
                <a href="../Draughts/index.html" class="menu-btn">國際跳棋 Draughts</a> -->
                <a href="../about.html" class="menu-btn">關於</a>
            </nav>
        </header>
        <div class="game-section">
            <div class="ad-left">
                <!-- Google AdSense 左側廣告 -->
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="你的 AdSense ID"
                     data-ad-slot="你的廣告位 ID"
                     data-ad-format="auto"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>
            <div class="game-content">
                <div class="board-section">
                    <div id="game-container">
                        <div id="opponents">
                            <div class="opponent" id="ai1">
                                <div class="player-label">AI 1</div>
                                <div class="opponent-hand" id="ai1-hand"></div>
                            </div>
                            <div class="opponent" id="ai2">
                                <div class="player-label">AI 2</div>
                                <div class="opponent-hand" id="ai2-hand"></div>
                            </div>
                            <div class="opponent" id="ai3">
                                <div class="player-label">AI 3</div>
                                <div class="opponent-hand" id="ai3-hand"></div>
                            </div>
                        </div>
                        <div id="table">
                            <div id="table-cards"></div>
                        </div>
                        <div id="player-hand">
                            <div class="player-label" style="position: absolute; top: -30px;">玩家</div>
                        </div>
                    </div>
                    <div id="info-panel">
                        <div id="status">等待開始...</div>
                        <div id="scores">得分: 玩家: 0 | AI 1: 0 | AI 2: 0 | AI 3: 0</div>
                        <div id="timer">計時器: 30秒</div>
                        <div id="controls">
                            <button onclick="playCards()">出牌</button>
                            <button onclick="pass()">過牌</button>
                            <button onclick="toggleAutoPlay()">電腦代玩</button>
                            <button onclick="resetGame()">重新洗牌</button>
                        </div>
                        <div id="history"></div>
                    </div>
                    <div id="notification"></div>
                </div>
            </div>
            <div class="ad-right">
                <!-- Google AdSense 右側廣告 -->
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="你的 AdSense ID"
                     data-ad-slot="你的廣告位 ID"
                     data-ad-format="auto"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>
        </div>
        <div class="rules-box">
            <h2>大老二玩法說明</h2>
            <p><strong>遊戲目標</strong></p>
            <p>最先出完手中所有牌的玩家獲勝。遊戲由四位玩家（您對三位 AI）進行，使用一副標準撲克牌（52張）。</p>
            <p><strong>牌型</strong></p>
            <p>- <strong>單張</strong>：單一張牌，比較點數（3 最小，2 最大）及花色（♠ > ♥ > ♦ > ♣）。</p>
            <p>- <strong>對子</strong>：兩張相同點數的牌。</p>
            <p>- <strong>順子</strong>：五張連續點數的牌（如 3-4-5-6-7），以最大牌比較。</p>
            <p>- <strong>葫蘆</strong>：三張相同點數加一對，以三張的點數比較。</p>
            <p>- <strong>鐵支</strong>：四張相同點數加一張任意牌，以四張點數比較。</p>
            <p>- <strong>同花順</strong>：五張同花色且連續的牌（如 ♠3-♠4-♠5-♠6-♠7），以最大牌比較。</p>
            <p><strong>遊戲流程</strong></p>
            <p>- 每局開始時，52張牌平均分給四位玩家（每人13張）。</p>
            <p>- 持有 ♣3 的玩家首先出牌，且第一輪必須包含 ♣3。</p>
            <p>- 玩家輪流出牌，出牌必須大於桌面上的牌（同牌型比較點數，或更高級牌型）。</p>
            <p>- 若無法或不願出牌，可選擇「過牌」。連續三人過牌後，桌面清空，上一出牌者繼續出任意牌型。</p>
            <p>- 遊戲結束時，最先出完牌的玩家獲勝，其他玩家的剩餘牌數將轉化為勝利者的得分。</p>
            <p><strong>得分規則</strong></p>
            <p>- 剩餘牌數 ≤ 9：每張牌 1 分。</p>
            <p>- 剩餘牌數 10-12：每張牌 2 分。</p>
            <p>- 剩餘牌數 13：每張牌 3 分。</p>
            <p><strong>控制按鈕</strong></p>
            <p>- 出牌：將選中的牌出到桌上。</p>
            <p>- 過牌：放棄本輪出牌機會。</p>
            <p>- 電腦代玩：啟動 AI 自動為您出牌。</p>
            <p>- 重新洗牌：重新洗牌並開始新遊戲。</p>
        </div>
        <footer class="footer">
            <p>© 2025 78PlayGame.com。保留所有權利。</p>
        </footer>
        <audio id="start-sound" src="./sounds/start.mp3" preload="auto"></audio>
        <audio id="pass-sound" src="./sounds/pass.mp3" preload="auto"></audio>
        <audio id="pair-sound" src="./sounds/001.mp3" preload="auto"></audio>
        <audio id="straight-sound" src="./sounds/002.mp3" preload="auto"></audio>
        <audio id="straight-flush-sound" src="./sounds/003.mp3" preload="auto"></audio>
        <audio id="four-of-a-kind-sound" src="./sounds/004.mp3" preload="auto"></audio>
        <audio id="full-house-sound" src="./sounds/005.mp3" preload="auto"></audio>
        <audio id="win-sound" src="./sounds/win.mp3" preload="auto"></audio>
        <audio id="lose-sound" src="./sounds/lost.mp3" preload="auto"></audio>
    </div>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
    <script src="./script.js"></script>
</body>
</html>