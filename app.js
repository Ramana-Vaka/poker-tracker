/**
 * Poker Night Tracker v2
 * Tabbed Dashboard Design
 */

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init);

// ===========================
// State Management
// ===========================

const state = {
    currentSession: null,
    sessions: [],
    players: [],
    activities: [],
    highHands: []
};

const STORAGE_KEYS = {
    SESSIONS: 'poker_sessions',
    CURRENT_SESSION: 'poker_current_session'
};

// ===========================
// DOM Elements
// ===========================

let elements = {};

function initElements() {
    elements = {
        // Header & Stats
        sessionBadge: document.getElementById('sessionBadge'),
        sessionStatus: document.getElementById('sessionStatus'),
        playerCount: document.getElementById('playerCount'),
        totalPot: document.getElementById('totalPot'),
        sessionTime: document.getElementById('sessionTime'),
        sessionToggleBtn: document.getElementById('sessionToggleBtn'),
        statsBar: document.getElementById('statsBar'),
        
        // Players
        playerNameInput: document.getElementById('playerNameInput'),
        addPlayerBtn: document.getElementById('addPlayerBtn'),
        addPlayerBar: document.getElementById('addPlayerBar'),
        playersList: document.getElementById('playersList'),
        playerCountBadge: document.getElementById('playerCountBadge'),
        
        // Buy-in
        buyinForm: document.getElementById('buyinForm'),
        buyinPlayer: document.getElementById('buyinPlayer'),
        buyinAmount: document.getElementById('buyinAmount'),
        activityList: document.getElementById('activityList'),
        
        // High Hand
        highHandForm: document.getElementById('highHandForm'),
        highHandPlayer: document.getElementById('highHandPlayer'),
        highHandType: document.getElementById('highHandType'),
        highHandCards: document.getElementById('highHandCards'),
        highHandBonus: document.getElementById('highHandBonus'),
        bonus5Btn: document.getElementById('bonus5Btn'),
        bonus10Btn: document.getElementById('bonus10Btn'),
        bonus5Text: document.getElementById('bonus5Text'),
        bonus10Text: document.getElementById('bonus10Text'),
        currentHighHand: document.getElementById('currentHighHand'),
        hhDisplay: document.getElementById('hhDisplay'),
        
        // Settlement
        settlePotValue: document.getElementById('settlePotValue'),
        settlePlayerCount: document.getElementById('settlePlayerCount'),
        settleWinners: document.getElementById('settleWinners'),
        settleLosers: document.getElementById('settleLosers'),
        settlePending: document.getElementById('settlePending'),
        settlePendingCount: document.getElementById('settlePendingCount'),
        settlePendingList: document.getElementById('settlePendingList'),
        settleBalance: document.getElementById('settleBalance'),
        
        // Modals
        initialBuyinModal: document.getElementById('initialBuyinModal'),
        closeInitialBuyinBtn: document.getElementById('closeInitialBuyinBtn'),
        initialBuyinAmount: document.getElementById('initialBuyinAmount'),
        confirmInitialBuyinBtn: document.getElementById('confirmInitialBuyinBtn'),
        
        cashoutModal: document.getElementById('cashoutModal'),
        closeCashoutBtn: document.getElementById('closeCashoutBtn'),
        cashoutPlayerName: document.getElementById('cashoutPlayerName'),
        cashoutTotalBuyin: document.getElementById('cashoutTotalBuyin'),
        cashoutBonusLine: document.getElementById('cashoutBonusLine'),
        cashoutHighHandBonus: document.getElementById('cashoutHighHandBonus'),
        cashoutAmountInput: document.getElementById('cashoutAmountInput'),
        cashoutResult: document.getElementById('cashoutResult'),
        cashoutResultValue: document.getElementById('cashoutResultValue'),
        confirmCashoutBtn: document.getElementById('confirmCashoutBtn'),
        
        historyModal: document.getElementById('historyModal'),
        closeHistoryBtn: document.getElementById('closeHistoryBtn'),
        historyContent: document.getElementById('historyContent'),
        
        // Footer
        viewHistoryBtn: document.getElementById('viewHistoryBtn'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        clearDataBtn: document.getElementById('clearDataBtn'),
        
        // Tabs
        tabPlayers: document.getElementById('tabPlayers'),
        tabBuyin: document.getElementById('tabBuyin'),
        tabHighHand: document.getElementById('tabHighHand'),
        tabSettlement: document.getElementById('tabSettlement')
    };
}

let durationInterval = null;
let cashoutPlayerId = null;
let selectedHandType = '';

// ===========================
// Initialization
// ===========================

function init() {
    initElements();
    loadFromStorage();
    setupEventListeners();
    setupTabNavigation();
    
    if (state.currentSession) {
        restoreSession();
    }
    
    renderAll();
}

function setupEventListeners() {
    // Session toggle
    if (elements.sessionToggleBtn) {
        elements.sessionToggleBtn.addEventListener('click', toggleSession);
    }
    
    // Player management
    if (elements.addPlayerBtn) {
        elements.addPlayerBtn.addEventListener('click', addPlayer);
    }
    if (elements.playerNameInput) {
        elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addPlayer();
        });
    }
    
    // Forms
    if (elements.buyinForm) {
        elements.buyinForm.addEventListener('submit', handleBuyin);
    }
    if (elements.highHandForm) {
        elements.highHandForm.addEventListener('submit', handleHighHand);
    }
    
    // Quick amount buttons for buy-in
    document.querySelectorAll('.chip[data-amount]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (elements.buyinAmount) {
                elements.buyinAmount.value = btn.dataset.amount;
            }
        });
    });
    
    // Quick amount buttons for initial buy-in modal
    document.querySelectorAll('.chip[data-initial]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (elements.initialBuyinAmount) {
                elements.initialBuyinAmount.value = btn.dataset.initial;
            }
        });
    });
    
    // Hand type buttons
    document.querySelectorAll('.hand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.hand-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedHandType = btn.dataset.hand;
            if (elements.highHandType) {
                elements.highHandType.value = selectedHandType;
            }
        });
    });
    
    // Bonus buttons
    if (elements.bonus5Btn) {
        elements.bonus5Btn.addEventListener('click', () => selectBonus(5));
    }
    if (elements.bonus10Btn) {
        elements.bonus10Btn.addEventListener('click', () => selectBonus(10));
    }
    
    // Initial buy-in modal
    if (elements.closeInitialBuyinBtn) {
        elements.closeInitialBuyinBtn.addEventListener('click', hideInitialBuyinModal);
    }
    if (elements.confirmInitialBuyinBtn) {
        elements.confirmInitialBuyinBtn.addEventListener('click', confirmInitialBuyin);
    }
    if (elements.initialBuyinModal) {
        elements.initialBuyinModal.addEventListener('click', (e) => {
            if (e.target === elements.initialBuyinModal) hideInitialBuyinModal();
        });
    }
    
    // Cashout modal
    if (elements.closeCashoutBtn) {
        elements.closeCashoutBtn.addEventListener('click', hideCashoutModal);
    }
    if (elements.cashoutModal) {
        elements.cashoutModal.addEventListener('click', (e) => {
            if (e.target === elements.cashoutModal) hideCashoutModal();
        });
    }
    if (elements.cashoutAmountInput) {
        elements.cashoutAmountInput.addEventListener('input', updateCashoutPreview);
    }
    if (elements.confirmCashoutBtn) {
        elements.confirmCashoutBtn.addEventListener('click', confirmCashout);
    }
    
    // History modal
    if (elements.closeHistoryBtn) {
        elements.closeHistoryBtn.addEventListener('click', hideHistory);
    }
    if (elements.historyModal) {
        elements.historyModal.addEventListener('click', (e) => {
            if (e.target === elements.historyModal) hideHistory();
        });
    }
    
    // Footer actions
    if (elements.viewHistoryBtn) {
        elements.viewHistoryBtn.addEventListener('click', showHistory);
    }
    if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener('click', exportData);
    }
    if (elements.clearDataBtn) {
        elements.clearDataBtn.addEventListener('click', clearAllData);
    }
}

function setupTabNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
            
            // Update active state
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Show/hide add player bar based on tab
    if (elements.addPlayerBar) {
        if (tabId === 'tabPlayers') {
            elements.addPlayerBar.classList.remove('hidden');
        } else {
            elements.addPlayerBar.classList.add('hidden');
        }
    }
}

// ===========================
// Storage Functions
// ===========================

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(state.currentSession));
}

function loadFromStorage() {
    const sessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const currentSession = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    
    if (sessions) {
        state.sessions = JSON.parse(sessions);
    }
    
    if (currentSession) {
        state.currentSession = JSON.parse(currentSession);
        if (state.currentSession) {
            state.players = state.currentSession.players || [];
            state.activities = state.currentSession.activities || [];
            state.highHands = state.currentSession.highHands || [];
        }
    }
}

// ===========================
// Session Management
// ===========================

function toggleSession() {
    if (state.currentSession) {
        endSession();
    } else {
        showInitialBuyinModal();
    }
}

function showInitialBuyinModal() {
    if (elements.initialBuyinModal) {
        elements.initialBuyinModal.classList.remove('hidden');
        if (elements.initialBuyinAmount) {
            elements.initialBuyinAmount.value = '20';
            elements.initialBuyinAmount.focus();
        }
    }
}

function hideInitialBuyinModal() {
    if (elements.initialBuyinModal) {
        elements.initialBuyinModal.classList.add('hidden');
    }
}

function confirmInitialBuyin() {
    const initialBuyin = elements.initialBuyinAmount ? parseFloat(elements.initialBuyinAmount.value) || 0 : 0;
    
    state.currentSession = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        endTime: null,
        initialBuyin: initialBuyin,
        players: [],
        activities: [],
        highHands: []
    };
    
    state.players = [];
    state.activities = [];
    state.highHands = [];
    
    hideInitialBuyinModal();
    saveToStorage();
    renderAll();
    updateSessionUI(true);
    startDurationTimer();
    
    addActivity('system', 'Session started', null);
}

function endSession() {
    if (!state.currentSession) return;
    
    const confirm = window.confirm('End this session? Make sure all players have cashed out.');
    if (!confirm) return;
    
    state.currentSession.endTime = new Date().toISOString();
    state.currentSession.players = state.players;
    state.currentSession.activities = state.activities;
    state.currentSession.highHands = state.highHands;
    state.currentSession.totalPot = calculateTotalPot();
    state.currentSession.playerCount = state.players.length;
    
    state.sessions.unshift(state.currentSession);
    
    state.currentSession = null;
    state.players = [];
    state.activities = [];
    state.highHands = [];
    
    stopDurationTimer();
    saveToStorage();
    renderAll();
    updateSessionUI(false);
}

function restoreSession() {
    updateSessionUI(true);
    startDurationTimer();
}

function updateSessionUI(isActive) {
    if (elements.sessionBadge) {
        elements.sessionBadge.classList.toggle('active', isActive);
    }
    if (elements.sessionStatus) {
        elements.sessionStatus.textContent = isActive ? 'Live' : 'No Session';
    }
    if (elements.sessionToggleBtn) {
        elements.sessionToggleBtn.textContent = isActive ? '⏹' : '▶';
        elements.sessionToggleBtn.title = isActive ? 'End Session' : 'Start Session';
        elements.sessionToggleBtn.classList.toggle('danger', isActive);
    }
}

function startDurationTimer() {
    updateDuration();
    durationInterval = setInterval(updateDuration, 1000);
}

function stopDurationTimer() {
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
    if (elements.sessionTime) {
        elements.sessionTime.textContent = '0:00';
    }
}

function updateDuration() {
    if (!state.currentSession || !elements.sessionTime) return;
    
    const start = new Date(state.currentSession.startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
        elements.sessionTime.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        elements.sessionTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ===========================
// Player Management
// ===========================

function addPlayer() {
    if (!state.currentSession) {
        alert('Start a session first!');
        return;
    }
    
    const name = elements.playerNameInput.value.trim();
    if (!name) return;
    
    if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Player already exists!');
        return;
    }
    
    const initialBuyin = state.currentSession.initialBuyin || 0;
    
    const player = {
        id: Date.now(),
        name: name,
        buyins: [],
        cashout: null,
        totalBuyin: 0
    };
    
    if (initialBuyin > 0) {
        player.buyins.push({ amount: initialBuyin, time: new Date().toISOString() });
        player.totalBuyin = initialBuyin;
    }
    
    state.players.push(player);
    elements.playerNameInput.value = '';
    
    if (initialBuyin > 0) {
        addActivity('buyin', `${name} joined +$${initialBuyin}`, initialBuyin);
    } else {
        addActivity('player', `${name} joined`, null);
    }
    
    saveCurrentSession();
    renderAll();
}

function removePlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    if (player.buyins.length > 0) {
        if (!window.confirm(`Remove ${player.name}? They have buy-ins recorded.`)) return;
    }
    
    state.players = state.players.filter(p => p.id !== playerId);
    saveCurrentSession();
    renderAll();
}

// ===========================
// Buy-in & Cash-out
// ===========================

function handleBuyin(e) {
    e.preventDefault();
    
    if (!state.currentSession) {
        alert('Start a session first!');
        return;
    }
    
    const playerId = parseInt(elements.buyinPlayer.value);
    const amount = parseFloat(elements.buyinAmount.value);
    
    if (!playerId || !amount || amount <= 0) return;
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    player.buyins.push({ amount: amount, time: new Date().toISOString() });
    player.totalBuyin += amount;
    
    addActivity('buyin', `${player.name} +$${amount}`, amount);
    
    elements.buyinForm.reset();
    saveCurrentSession();
    renderAll();
}

function getPlayerHighHandBonus(playerId) {
    if (state.highHands.length === 0) return 0;
    const currentHH = state.highHands[state.highHands.length - 1];
    return currentHH.playerId === playerId ? (currentHH.bonus || 0) : 0;
}

function openCashoutModal(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    cashoutPlayerId = playerId;
    const hhBonus = getPlayerHighHandBonus(playerId);
    
    elements.cashoutPlayerName.textContent = player.name;
    elements.cashoutTotalBuyin.textContent = `$${player.totalBuyin}`;
    
    if (hhBonus > 0 && elements.cashoutBonusLine) {
        elements.cashoutHighHandBonus.textContent = `+$${hhBonus}`;
        elements.cashoutBonusLine.classList.remove('hidden');
    } else if (elements.cashoutBonusLine) {
        elements.cashoutBonusLine.classList.add('hidden');
    }
    
    elements.cashoutAmountInput.value = '';
    elements.cashoutResult.classList.add('hidden');
    elements.cashoutResult.className = 'cashout-result hidden';
    
    elements.cashoutModal.classList.remove('hidden');
    elements.cashoutAmountInput.focus();
}

function hideCashoutModal() {
    elements.cashoutModal.classList.add('hidden');
    cashoutPlayerId = null;
}

function updateCashoutPreview() {
    const player = state.players.find(p => p.id === cashoutPlayerId);
    if (!player) return;
    
    const cashoutAmount = parseFloat(elements.cashoutAmountInput.value) || 0;
    const hhBonus = getPlayerHighHandBonus(cashoutPlayerId);
    const profit = (cashoutAmount + hhBonus) - player.totalBuyin;
    
    elements.cashoutResult.classList.remove('hidden', 'profit', 'loss', 'even');
    
    if (profit > 0) {
        elements.cashoutResultValue.textContent = `+$${profit}`;
        elements.cashoutResult.classList.add('profit');
    } else if (profit < 0) {
        elements.cashoutResultValue.textContent = `-$${Math.abs(profit)}`;
        elements.cashoutResult.classList.add('loss');
    } else {
        elements.cashoutResultValue.textContent = `$0 Even`;
        elements.cashoutResult.classList.add('even');
    }
}

function confirmCashout() {
    const player = state.players.find(p => p.id === cashoutPlayerId);
    if (!player) return;
    
    const amount = parseFloat(elements.cashoutAmountInput.value);
    if (isNaN(amount) || amount < 0) {
        alert('Enter a valid amount');
        return;
    }
    
    const hhBonus = getPlayerHighHandBonus(cashoutPlayerId);
    
    player.cashout = {
        amount: amount,
        highHandBonus: hhBonus,
        time: new Date().toISOString()
    };
    
    const profit = (amount + hhBonus) - player.totalBuyin;
    const profitStr = profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`;
    
    addActivity('cashout', `${player.name} out (${profitStr})`, amount);
    
    hideCashoutModal();
    saveCurrentSession();
    renderAll();
}

// ===========================
// High Hand
// ===========================

function selectBonus(multiplier) {
    const amount = state.players.length * multiplier;
    if (elements.highHandBonus) {
        elements.highHandBonus.value = amount;
    }
    
    elements.bonus5Btn?.classList.remove('selected');
    elements.bonus10Btn?.classList.remove('selected');
    
    if (multiplier === 5) {
        elements.bonus5Btn?.classList.add('selected');
    } else {
        elements.bonus10Btn?.classList.add('selected');
    }
}

function handleHighHand(e) {
    e.preventDefault();
    
    if (!state.currentSession) {
        alert('Start a session first!');
        return;
    }
    
    const playerId = parseInt(elements.highHandPlayer.value);
    const handType = selectedHandType || elements.highHandType.value;
    const cards = elements.highHandCards.value.trim();
    const bonus = parseFloat(elements.highHandBonus.value) || 0;
    
    if (!playerId || !handType) {
        alert('Select a player and hand type');
        return;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    state.highHands.push({
        id: Date.now(),
        playerId: playerId,
        playerName: player.name,
        handType: handType,
        cards: cards,
        bonus: bonus,
        time: new Date().toISOString()
    });
    
    addActivity('highhand', `${player.name} - ${handType}${bonus ? ` +$${bonus}` : ''}`, bonus || null);
    
    // Reset form
    elements.highHandForm.reset();
    selectedHandType = '';
    document.querySelectorAll('.hand-btn').forEach(b => b.classList.remove('selected'));
    elements.bonus5Btn?.classList.remove('selected');
    elements.bonus10Btn?.classList.remove('selected');
    
    saveCurrentSession();
    renderAll();
}

// ===========================
// Activity Log
// ===========================

function addActivity(type, text, amount) {
    state.activities.unshift({
        id: Date.now(),
        type: type,
        text: text,
        amount: amount,
        time: new Date().toISOString()
    });
    
    if (state.activities.length > 50) {
        state.activities = state.activities.slice(0, 50);
    }
}

// ===========================
// Calculations
// ===========================

function calculateTotalPot() {
    return state.players.reduce((sum, p) => sum + p.totalBuyin, 0);
}

// ===========================
// Rendering
// ===========================

function renderAll() {
    renderPlayers();
    renderPlayerSelects();
    renderActivity();
    renderHighHand();
    renderSettlement();
    updateStats();
    updateBonusButtons();
}

function renderPlayers() {
    if (!elements.playersList) return;
    
    if (!state.currentSession || state.players.length === 0) {
        elements.playersList.innerHTML = '<li class="empty-state">Start a session to add players</li>';
        return;
    }
    
    elements.playersList.innerHTML = state.players.map(player => {
        const hhBonus = getPlayerHighHandBonus(player.id);
        const hhBadge = hhBonus > 0 ? '<span class="hh-badge">🏆</span>' : '';
        
        return `
            <li>
                <div class="player-avatar">${player.name.charAt(0)}</div>
                <div class="player-info">
                    <div class="player-name">${escapeHtml(player.name)} ${hhBadge}</div>
                    <div class="player-stats">${player.buyins.length} buy-in${player.buyins.length !== 1 ? 's' : ''} • $${player.totalBuyin}</div>
                </div>
                <div class="player-actions">
                    <button class="btn-remove" onclick="removePlayer(${player.id})">×</button>
                </div>
            </li>
        `;
    }).join('');
}

function renderPlayerSelects() {
    const options = state.players.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    const defaultOption = '<option value="">Select player...</option>';
    
    if (elements.buyinPlayer) elements.buyinPlayer.innerHTML = defaultOption + options;
    if (elements.highHandPlayer) elements.highHandPlayer.innerHTML = defaultOption + options;
}

function renderActivity() {
    if (!elements.activityList) return;
    
    const buyinActivities = state.activities.filter(a => a.type === 'buyin');
    
    if (buyinActivities.length === 0) {
        elements.activityList.innerHTML = '<li class="empty-state">No buy-ins yet</li>';
        return;
    }
    
    elements.activityList.innerHTML = buyinActivities.slice(0, 10).map(activity => {
        const time = new Date(activity.time);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <li>
                <span class="activity-time">${timeStr}</span>
                <span class="activity-text">${activity.text}</span>
            </li>
        `;
    }).join('');
}

function renderHighHand() {
    if (!elements.hhDisplay) return;
    
    if (state.highHands.length === 0) {
        elements.hhDisplay.innerHTML = '<span class="empty-state">No high hand yet</span>';
        return;
    }
    
    const currentHH = state.highHands[state.highHands.length - 1];
    elements.hhDisplay.innerHTML = `
        <div class="hh-winner">
            <span class="hh-player">${escapeHtml(currentHH.playerName)}</span>
            <span class="hh-hand">${escapeHtml(currentHH.handType)}</span>
        </div>
        ${currentHH.bonus > 0 ? `<div class="hh-bonus">+$${currentHH.bonus} bonus</div>` : ''}
        ${currentHH.cards ? `<div class="hh-cards">${escapeHtml(currentHH.cards)}</div>` : ''}
    `;
}

function renderSettlement() {
    // Update header stats
    if (elements.settlePotValue) {
        elements.settlePotValue.textContent = `$${calculateTotalPot()}`;
    }
    if (elements.settlePlayerCount) {
        elements.settlePlayerCount.textContent = `${state.players.length} players`;
    }
    
    // Calculate results
    const results = state.players.map(player => {
        const hhBonus = getPlayerHighHandBonus(player.id);
        if (player.cashout) {
            const bonus = player.cashout.highHandBonus || hhBonus;
            const profit = (player.cashout.amount + bonus) - player.totalBuyin;
            return { ...player, profit, settled: true, hhBonus: bonus };
        }
        return { ...player, profit: 0, settled: false, hhBonus };
    });
    
    const winners = results.filter(r => r.settled && r.profit > 0).sort((a, b) => b.profit - a.profit);
    const losers = results.filter(r => r.settled && r.profit < 0).sort((a, b) => a.profit - b.profit);
    const even = results.filter(r => r.settled && r.profit === 0);
    const pending = results.filter(r => !r.settled && r.totalBuyin > 0);
    
    // Render Winners
    if (elements.settleWinners) {
        if (winners.length > 0 || even.length > 0) {
            const totalWin = winners.reduce((sum, p) => sum + p.profit, 0);
            elements.settleWinners.innerHTML = `
                <div class="settle-group-header">
                    <span>🏆 Winners</span>
                    <span>+$${totalWin}</span>
                </div>
                <div class="settle-group-list">
                    ${winners.map(p => `
                        <div class="settle-result-row">
                            <span class="settle-result-name">
                                ${escapeHtml(p.name)}
                                ${p.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${p.hhBonus}</span>` : ''}
                            </span>
                            <span class="settle-result-amount profit">+$${p.profit}</span>
                        </div>
                    `).join('')}
                    ${even.map(p => `
                        <div class="settle-result-row">
                            <span class="settle-result-name">
                                ${escapeHtml(p.name)}
                                ${p.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${p.hhBonus}</span>` : ''}
                            </span>
                            <span class="settle-result-amount" style="color: var(--text-muted)">$0</span>
                        </div>
                    `).join('')}
                </div>
            `;
            elements.settleWinners.classList.remove('hidden');
        } else {
            elements.settleWinners.classList.add('hidden');
        }
    }
    
    // Render Losers
    if (elements.settleLosers) {
        if (losers.length > 0) {
            const totalLoss = Math.abs(losers.reduce((sum, p) => sum + p.profit, 0));
            elements.settleLosers.innerHTML = `
                <div class="settle-group-header">
                    <span>💸 Owes</span>
                    <span>-$${totalLoss}</span>
                </div>
                <div class="settle-group-list">
                    ${losers.map(p => `
                        <div class="settle-result-row">
                            <span class="settle-result-name">
                                ${escapeHtml(p.name)}
                                ${p.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${p.hhBonus}</span>` : ''}
                            </span>
                            <span class="settle-result-amount loss">-$${Math.abs(p.profit)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            elements.settleLosers.classList.remove('hidden');
        } else {
            elements.settleLosers.classList.add('hidden');
        }
    }
    
    // Render Pending
    if (elements.settlePending && elements.settlePendingList && elements.settlePendingCount) {
        if (pending.length > 0) {
            elements.settlePendingCount.textContent = `${pending.length} remaining`;
            elements.settlePendingList.innerHTML = pending.map(p => `
                <div class="settle-pending-row">
                    <div class="settle-pending-info">
                        <div class="settle-pending-name">
                            ${escapeHtml(p.name)}
                            ${p.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${p.hhBonus}</span>` : ''}
                        </div>
                        <div class="settle-pending-buyin">$${p.totalBuyin} in</div>
                    </div>
                    <input type="number" class="settle-input" id="settle-${p.id}" placeholder="$" min="0">
                    <button class="settle-btn" onclick="confirmSettle(${p.id})">✓</button>
                </div>
            `).join('');
            elements.settlePending.classList.remove('hidden');
        } else if (state.players.length > 0) {
            elements.settlePending.classList.add('hidden');
        } else {
            elements.settlePendingCount.textContent = '';
            elements.settlePendingList.innerHTML = '<div class="empty-state">Start a session to settle</div>';
            elements.settlePending.classList.remove('hidden');
        }
    }
    
    // Render Balance Check
    if (elements.settleBalance) {
        const totalWinnings = winners.reduce((sum, p) => sum + p.profit, 0);
        const totalLosses = Math.abs(losers.reduce((sum, p) => sum + p.profit, 0));
        const diff = Math.abs(totalWinnings - totalLosses);
        
        if (winners.length > 0 || losers.length > 0) {
            const isBalanced = diff < 0.01 && pending.length === 0;
            elements.settleBalance.innerHTML = `
                <span class="settle-balance-label">Balance Check</span>
                <span class="settle-balance-value ${isBalanced ? 'balanced' : 'unbalanced'}">
                    ${isBalanced ? '✓ Balanced' : `⚠ Off by $${diff.toFixed(0)}${pending.length > 0 ? ` (${pending.length} pending)` : ''}`}
                </span>
            `;
            elements.settleBalance.classList.remove('hidden');
        } else {
            elements.settleBalance.classList.add('hidden');
        }
    }
}

// Inline settle functions
function previewSettle(playerId) {
    // Could add live preview here if needed
}

function confirmSettle(playerId) {
    const input = document.getElementById(`settle-${playerId}`);
    if (!input) return;
    
    const amount = parseFloat(input.value);
    if (isNaN(amount) || amount < 0) {
        alert('Enter a valid amount');
        return;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    const hhBonus = getPlayerHighHandBonus(playerId);
    
    player.cashout = {
        amount: amount,
        highHandBonus: hhBonus,
        time: new Date().toISOString()
    };
    
    const profit = (amount + hhBonus) - player.totalBuyin;
    const profitStr = profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`;
    addActivity('cashout', `${player.name} out (${profitStr})`, amount);
    
    saveCurrentSession();
    renderAll();
}

function undoSettle(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player || !player.cashout) return;
    
    player.cashout = null;
    saveCurrentSession();
    renderAll();
}

function updateStats() {
    if (elements.playerCount) {
        elements.playerCount.textContent = state.players.length;
    }
    if (elements.totalPot) {
        elements.totalPot.textContent = `$${calculateTotalPot()}`;
    }
    if (elements.playerCountBadge) {
        const count = state.players.length;
        elements.playerCountBadge.textContent = `${count} player${count !== 1 ? 's' : ''}`;
    }
}

function updateBonusButtons() {
    const count = state.players.length;
    if (elements.bonus5Text) {
        elements.bonus5Text.textContent = `${count}×$5`;
    }
    if (elements.bonus10Text) {
        elements.bonus10Text.textContent = `${count}×$10`;
    }
}

// ===========================
// History Modal
// ===========================

function showHistory() {
    if (!elements.historyContent) return;
    
    if (state.sessions.length === 0) {
        elements.historyContent.innerHTML = '<div class="empty-state">No session history yet</div>';
    } else {
        elements.historyContent.innerHTML = state.sessions.map(session => {
            const startDate = new Date(session.startTime);
            const dateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return `
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>${dateStr}</strong>
                        <span style="color: var(--text-muted)">${session.playerCount || 0} players</span>
                    </div>
                    <div style="color: var(--gold); font-weight: 600;">Pot: $${session.totalPot || 0}</div>
                </div>
            `;
        }).join('');
    }
    
    elements.historyModal.classList.remove('hidden');
}

function hideHistory() {
    elements.historyModal.classList.add('hidden');
}

// ===========================
// Data Export & Clear
// ===========================

function exportData() {
    const data = {
        exportDate: new Date().toISOString(),
        currentSession: state.currentSession,
        sessions: state.sessions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `poker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function clearAllData() {
    if (!window.confirm('Clear ALL data? This cannot be undone!')) return;
    if (!window.confirm('Are you really sure?')) return;
    
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    
    state.currentSession = null;
    state.sessions = [];
    state.players = [];
    state.activities = [];
    state.highHands = [];
    
    stopDurationTimer();
    updateSessionUI(false);
    renderAll();
}

// ===========================
// Helpers
// ===========================

function saveCurrentSession() {
    if (state.currentSession) {
        state.currentSession.players = state.players;
        state.currentSession.activities = state.activities;
        state.currentSession.highHands = state.highHands;
    }
    saveToStorage();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for onclick
window.removePlayer = removePlayer;
window.openCashoutModal = openCashoutModal;
window.confirmSettle = confirmSettle;
window.undoSettle = undoSettle;
window.previewSettle = previewSettle;
