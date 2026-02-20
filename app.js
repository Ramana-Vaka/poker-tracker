/**
 * Poker Night Tracker v2
 * Tabbed Dashboard Design
 */

import {
    buildActivityMarkup,
    buildHighHandMarkup,
    buildPlayerOptionsMarkup,
    buildPlayersListMarkup,
    buildSettlementSections
} from './js/components/pokerTemplates.js';
import { evaluateFlopSpot, evaluatePreflopSpot } from './js/components/preflopAdvisor.js';

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
        tabSettlement: document.getElementById('tabSettlement'),
        tabAdvisor: document.getElementById('tabAdvisor'),

        // Preflop Advisor
        advisorForm: document.getElementById('advisorForm'),
        advisorStreet: document.getElementById('advisorStreet'),
        advisorCardA: document.getElementById('advisorCardA'),
        advisorCardB: document.getElementById('advisorCardB'),
        advisorBoardSlots: document.getElementById('advisorBoardSlots'),
        advisorFlop1: document.getElementById('advisorFlop1'),
        advisorFlop2: document.getElementById('advisorFlop2'),
        advisorFlop3: document.getElementById('advisorFlop3'),
        advisorPickerGrid: document.getElementById('advisorPickerGrid'),
        advisorPosition: document.getElementById('advisorPosition'),
        advisorPotSize: document.getElementById('advisorPotSize'),
        advisorCallAmount: document.getElementById('advisorCallAmount'),
        advisorPlayersCount: document.getElementById('advisorPlayersCount'),
        advisorStackBb: document.getElementById('advisorStackBb'),
        advisorResult: document.getElementById('advisorResult'),
        advisorAction: document.getElementById('advisorAction'),
        advisorConfidence: document.getElementById('advisorConfidence'),
        advisorReasons: document.getElementById('advisorReasons')
    };
}

let durationInterval = null;
let cashoutPlayerId = null;
let selectedHandType = '';
let advisorActiveSlot = 'A';
let advisorCards = {
    A: { rank: '', suit: '' },
    B: { rank: '', suit: '' },
    F1: { rank: '', suit: '' },
    F2: { rank: '', suit: '' },
    F3: { rank: '', suit: '' }
};

// ===========================
// Initialization
// ===========================

function init() {
    initElements();
    loadFromStorage();
    setupEventListeners();
    setupTabNavigation();
    handleAdvisorStreetChange();
    updateAdvisorCardSlotUI();
    
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
    if (elements.advisorForm) {
        elements.advisorForm.addEventListener('submit', handleAdvisorAnalyze);
    }
    if (elements.advisorCardA && elements.advisorCardB) {
        elements.advisorCardA.addEventListener('click', () => setAdvisorActiveSlot('A'));
        elements.advisorCardB.addEventListener('click', () => setAdvisorActiveSlot('B'));
    }
    if (elements.advisorFlop1 && elements.advisorFlop2 && elements.advisorFlop3) {
        elements.advisorFlop1.addEventListener('click', () => setAdvisorActiveSlot('F1'));
        elements.advisorFlop2.addEventListener('click', () => setAdvisorActiveSlot('F2'));
        elements.advisorFlop3.addEventListener('click', () => setAdvisorActiveSlot('F3'));
    }
    if (elements.advisorStreet) {
        elements.advisorStreet.addEventListener('change', handleAdvisorStreetChange);
    }
    if (elements.advisorPickerGrid) {
        elements.advisorPickerGrid.addEventListener('click', handleAdvisorKeypadClick);
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

    elements.playersList.innerHTML = buildPlayersListMarkup(
        state.currentSession,
        state.players,
        getPlayerHighHandBonus,
        escapeHtml
    );
}

function renderPlayerSelects() {
    const optionsMarkup = buildPlayerOptionsMarkup(state.players, escapeHtml);

    if (elements.buyinPlayer) elements.buyinPlayer.innerHTML = optionsMarkup;
    if (elements.highHandPlayer) elements.highHandPlayer.innerHTML = optionsMarkup;
}

function renderActivity() {
    if (!elements.activityList) return;

    elements.activityList.innerHTML = buildActivityMarkup(state.activities);
}

function renderHighHand() {
    if (!elements.hhDisplay) return;

    elements.hhDisplay.innerHTML = buildHighHandMarkup(state.highHands, escapeHtml);
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
    
    const sections = buildSettlementSections(results, escapeHtml);
    
    // Render Winners
    if (elements.settleWinners) {
        if (sections.winners.length > 0 || sections.even.length > 0) {
            elements.settleWinners.innerHTML = sections.winnersMarkup;
            elements.settleWinners.classList.remove('hidden');
        } else {
            elements.settleWinners.classList.add('hidden');
        }
    }
    
    // Render Losers
    if (elements.settleLosers) {
        if (sections.losers.length > 0) {
            elements.settleLosers.innerHTML = sections.losersMarkup;
            elements.settleLosers.classList.remove('hidden');
        } else {
            elements.settleLosers.classList.add('hidden');
        }
    }
    
    // Render Pending
    if (elements.settlePending && elements.settlePendingList && elements.settlePendingCount) {
        if (sections.pending.length > 0) {
            elements.settlePendingCount.textContent = `${sections.pending.length} remaining`;
            elements.settlePendingList.innerHTML = sections.pendingMarkup;
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
        if (sections.winners.length > 0 || sections.losers.length > 0) {
            const isBalanced = sections.diff < 0.01 && sections.pending.length === 0;
            elements.settleBalance.innerHTML = `
                <span class="settle-balance-label">Balance Check</span>
                <span class="settle-balance-value ${isBalanced ? 'balanced' : 'unbalanced'}">
                    ${isBalanced ? '✓ Balanced' : `⚠ Off by $${sections.diff.toFixed(0)}${sections.pending.length > 0 ? ` (${sections.pending.length} pending)` : ''}`}
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

function handleAdvisorAnalyze(e) {
    e.preventDefault();

    if (!elements.advisorPosition) return;

    const rankA = advisorCards.A.rank;
    const rankB = advisorCards.B.rank;
    const suited = advisorCards.A.suit && advisorCards.B.suit && advisorCards.A.suit === advisorCards.B.suit;
    const street = elements.advisorStreet?.value || 'preflop';
    const position = elements.advisorPosition.value;
    const potSize = parseFloat(elements.advisorPotSize?.value || '0');
    const callAmount = parseFloat(elements.advisorCallAmount?.value || '0');
    const playersCount = parseInt(elements.advisorPlayersCount?.value || '6', 10);
    const stackBb = parseInt(elements.advisorStackBb?.value || '100', 10);

    if (!rankA || !rankB || !advisorCards.A.suit || !advisorCards.B.suit) {
        alert('Select both cards (rank and suit).');
        return;
    }
    if (advisorCards.A.rank === advisorCards.B.rank && advisorCards.A.suit === advisorCards.B.suit) {
        alert('Choose two different cards.');
        return;
    }
    if (callAmount <= 0 || potSize < 0) {
        alert('Enter valid pot and call values.');
        return;
    }

    const cleanPlayers = Number.isNaN(playersCount) ? 6 : playersCount;
    const cleanStack = Number.isNaN(stackBb) ? 100 : stackBb;

    let result;
    if (street === 'flop') {
        if (!isCardComplete(advisorCards.F1) || !isCardComplete(advisorCards.F2) || !isCardComplete(advisorCards.F3)) {
            alert('Select all 3 flop cards.');
            return;
        }

        result = evaluateFlopSpot({
            cardA: advisorCards.A,
            cardB: advisorCards.B,
            flop1: advisorCards.F1,
            flop2: advisorCards.F2,
            flop3: advisorCards.F3,
            position,
            potSize,
            callAmount,
            playersCount: cleanPlayers,
            stackBb: cleanStack
        });
    } else {
        result = evaluatePreflopSpot({
            rankA,
            rankB,
            suited,
            position,
            potSize,
            callAmount,
            playersCount: cleanPlayers,
            stackBb: cleanStack
        });
    }

    renderAdvisorResult(result);
}

function renderAdvisorResult(result) {
    if (!elements.advisorResult || !elements.advisorAction || !elements.advisorConfidence || !elements.advisorReasons) return;

    elements.advisorResult.classList.remove('hidden', 'action-raise', 'action-call', 'action-fold');
    elements.advisorAction.textContent = result.action;
    elements.advisorConfidence.textContent = `Confidence: ${result.confidence}%`;

    const actionClass = result.action.toLowerCase();
    elements.advisorResult.classList.add(`action-${actionClass}`);

    elements.advisorReasons.innerHTML = result.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('');
}

function setAdvisorActiveSlot(slot) {
    advisorActiveSlot = slot;
    if (elements.advisorCardA) {
        elements.advisorCardA.classList.toggle('active', slot === 'A');
    }
    if (elements.advisorCardB) {
        elements.advisorCardB.classList.toggle('active', slot === 'B');
    }
    if (elements.advisorFlop1) {
        elements.advisorFlop1.classList.toggle('active', slot === 'F1');
    }
    if (elements.advisorFlop2) {
        elements.advisorFlop2.classList.toggle('active', slot === 'F2');
    }
    if (elements.advisorFlop3) {
        elements.advisorFlop3.classList.toggle('active', slot === 'F3');
    }
}

function handleAdvisorKeypadClick(e) {
    const key = e.target?.dataset?.key;
    if (!key) return;

    if (key === 'CLEAR') {
        advisorCards = {
            A: { rank: '', suit: '' },
            B: { rank: '', suit: '' },
            F1: { rank: '', suit: '' },
            F2: { rank: '', suit: '' },
            F3: { rank: '', suit: '' }
        };
        setAdvisorActiveSlot('A');
        updateAdvisorCardSlotUI();
        return;
    }

    if (key === 'SWAP') {
        if (advisorActiveSlot === 'A' || advisorActiveSlot === 'B') {
            const temp = advisorCards.A;
            advisorCards.A = advisorCards.B;
            advisorCards.B = temp;
        } else {
            const order = ['F1', 'F2', 'F3'];
            const idx = order.indexOf(advisorActiveSlot);
            if (idx >= 0 && idx < order.length - 1) {
                const left = order[idx];
                const right = order[idx + 1];
                const temp = advisorCards[left];
                advisorCards[left] = advisorCards[right];
                advisorCards[right] = temp;
            }
        }
        updateAdvisorCardSlotUI();
        return;
    }

    if (key === 'BACK') {
        const slotCard = advisorCards[advisorActiveSlot];
        if (slotCard.suit) {
            slotCard.suit = '';
        } else {
            slotCard.rank = '';
        }
        updateAdvisorCardSlotUI();
        return;
    }

    if (['S', 'H', 'D', 'C'].includes(key)) {
        const duplicate = hasDuplicateCardForSlot(advisorActiveSlot, advisorCards[advisorActiveSlot].rank, key);
        if (duplicate) {
            alert('Card already selected in another slot.');
            return;
        }
        advisorCards[advisorActiveSlot].suit = key;
        if (advisorCards[advisorActiveSlot].rank && advisorActiveSlot === 'A' && !advisorCards.B.rank) {
            setAdvisorActiveSlot('B');
        }
        updateAdvisorCardSlotUI();
        return;
    }

    const duplicate = hasDuplicateCardForSlot(advisorActiveSlot, key, advisorCards[advisorActiveSlot].suit);
    if (duplicate) {
        alert('Card already selected in another slot.');
        return;
    }
    advisorCards[advisorActiveSlot].rank = key;
    updateAdvisorCardSlotUI();
}

function updateAdvisorCardSlotUI() {
    if (elements.advisorCardA) {
        elements.advisorCardA.textContent = formatAdvisorCardLabel(advisorCards.A, 'Card 1');
    }
    if (elements.advisorCardB) {
        elements.advisorCardB.textContent = formatAdvisorCardLabel(advisorCards.B, 'Card 2');
    }
    if (elements.advisorFlop1) {
        elements.advisorFlop1.textContent = formatAdvisorCardLabel(advisorCards.F1, 'Flop 1');
    }
    if (elements.advisorFlop2) {
        elements.advisorFlop2.textContent = formatAdvisorCardLabel(advisorCards.F2, 'Flop 2');
    }
    if (elements.advisorFlop3) {
        elements.advisorFlop3.textContent = formatAdvisorCardLabel(advisorCards.F3, 'Flop 3');
    }
}

function formatAdvisorCardLabel(card, fallback) {
    if (!card.rank && !card.suit) return fallback;
    return `${card.rank || '·'}${advisorSuitSymbol(card.suit)}`;
}

function advisorSuitSymbol(suit) {
    if (suit === 'S') return '♠';
    if (suit === 'H') return '♥';
    if (suit === 'D') return '♦';
    if (suit === 'C') return '♣';
    return '·';
}

function hasDuplicateCardForSlot(slot, rank, suit) {
    if (!rank || !suit) return false;
    return Object.entries(advisorCards).some(([otherSlot, card]) => {
        if (otherSlot === slot) return false;
        return card.rank === rank && card.suit === suit;
    });
}

function isCardComplete(card) {
    return !!(card && card.rank && card.suit);
}

function handleAdvisorStreetChange() {
    const street = elements.advisorStreet?.value || 'preflop';
    const isFlop = street === 'flop';

    if (elements.advisorBoardSlots) {
        elements.advisorBoardSlots.classList.toggle('hidden', !isFlop);
    }

    if (!isFlop) {
        advisorCards.F1 = { rank: '', suit: '' };
        advisorCards.F2 = { rank: '', suit: '' };
        advisorCards.F3 = { rank: '', suit: '' };
        if (advisorActiveSlot.startsWith('F')) {
            setAdvisorActiveSlot('A');
        }
    } else if (advisorActiveSlot === 'A' || advisorActiveSlot === 'B') {
        // keep selected slot if already on a hole card
    } else {
        setAdvisorActiveSlot('F1');
    }

    updateAdvisorCardSlotUI();
}

// Global functions for onclick
window.removePlayer = removePlayer;
window.openCashoutModal = openCashoutModal;
window.confirmSettle = confirmSettle;
window.undoSettle = undoSettle;
window.previewSettle = previewSettle;
