/**
 * Poker Night Tracker
 * A simple app to track buy-ins, cash-outs, and high hands for poker games
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

// ===========================
// LocalStorage Keys
// ===========================

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
        // Session
        sessionIndicator: document.getElementById('sessionIndicator'),
        startSessionBtn: document.getElementById('startSessionBtn'),
        endSessionBtn: document.getElementById('endSessionBtn'),
        sessionInfo: document.getElementById('sessionInfo'),
        sessionDuration: document.getElementById('sessionDuration'),
        totalPot: document.getElementById('totalPot'),
        
        // Players
        playerNameInput: document.getElementById('playerNameInput'),
        addPlayerBtn: document.getElementById('addPlayerBtn'),
        playersList: document.getElementById('playersList'),
        
        // Buy-in
        buyinForm: document.getElementById('buyinForm'),
        buyinPlayer: document.getElementById('buyinPlayer'),
        buyinAmount: document.getElementById('buyinAmount'),
        
        // Cash-out Modal
        cashoutModal: document.getElementById('cashoutModal'),
        closeCashoutBtn: document.getElementById('closeCashoutBtn'),
        cashoutPlayerName: document.getElementById('cashoutPlayerName'),
        cashoutTotalBuyin: document.getElementById('cashoutTotalBuyin'),
        cashoutAmountInput: document.getElementById('cashoutAmountInput'),
        cashoutResult: document.getElementById('cashoutResult'),
        cashoutResultValue: document.getElementById('cashoutResultValue'),
        confirmCashoutBtn: document.getElementById('confirmCashoutBtn'),
        
        // High Hand
        highHandForm: document.getElementById('highHandForm'),
        highHandPlayer: document.getElementById('highHandPlayer'),
        highHandType: document.getElementById('highHandType'),
        highHandCards: document.getElementById('highHandCards'),
        highHandBonus: document.getElementById('highHandBonus'),
        bonus5Btn: document.getElementById('bonus5Btn'),
        bonus10Btn: document.getElementById('bonus10Btn'),
        bonus5Calc: document.getElementById('bonus5Calc'),
        bonus5Total: document.getElementById('bonus5Total'),
        bonus10Calc: document.getElementById('bonus10Calc'),
        bonus10Total: document.getElementById('bonus10Total'),
        
        // High Hands & Activity
        highHandsList: document.getElementById('highHandsList'),
        activityList: document.getElementById('activityList'),
        
        // Settlement
        settlementSection: document.getElementById('settlementSection'),
        settlementContent: document.getElementById('settlementContent'),
        
        // Modal & Footer
        historyModal: document.getElementById('historyModal'),
        closeHistoryBtn: document.getElementById('closeHistoryBtn'),
        historyContent: document.getElementById('historyContent'),
        viewHistoryBtn: document.getElementById('viewHistoryBtn'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        clearDataBtn: document.getElementById('clearDataBtn')
    };
}

// Duration timer interval
let durationInterval = null;

// ===========================
// Initialization
// ===========================

function init() {
    initElements();
    loadFromStorage();
    setupEventListeners();
    
    if (state.currentSession) {
        restoreSession();
    }
    
    renderAll();
}

function setupEventListeners() {
    // Session controls
    if (elements.startSessionBtn) elements.startSessionBtn.addEventListener('click', startSession);
    if (elements.endSessionBtn) elements.endSessionBtn.addEventListener('click', endSession);
    
    // Player management
    if (elements.addPlayerBtn) elements.addPlayerBtn.addEventListener('click', addPlayer);
    if (elements.playerNameInput) elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    
    // Forms
    if (elements.buyinForm) elements.buyinForm.addEventListener('submit', handleBuyin);
    if (elements.highHandForm) elements.highHandForm.addEventListener('submit', handleHighHand);
    
    // Cash-out modal
    if (elements.closeCashoutBtn) elements.closeCashoutBtn.addEventListener('click', hideCashoutModal);
    if (elements.cashoutModal) elements.cashoutModal.addEventListener('click', (e) => {
        if (e.target === elements.cashoutModal) hideCashoutModal();
    });
    if (elements.cashoutAmountInput) elements.cashoutAmountInput.addEventListener('input', updateCashoutPreview);
    if (elements.confirmCashoutBtn) elements.confirmCashoutBtn.addEventListener('click', confirmCashout);
    
    // Quick amount buttons for buy-in form
    document.querySelectorAll('.chip-btn[data-amount]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (elements.buyinAmount) {
                elements.buyinAmount.value = btn.dataset.amount;
                elements.buyinAmount.focus();
            }
        });
    });
    
    // Bonus amount buttons for high hand
    if (elements.bonus5Btn) {
        elements.bonus5Btn.addEventListener('click', () => selectBonusAmount(5));
    }
    if (elements.bonus10Btn) {
        elements.bonus10Btn.addEventListener('click', () => selectBonusAmount(10));
    }
    
    // Quick amount buttons for initial buy-in modal
    document.querySelectorAll('.chip-btn[data-initial]').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('initialBuyinAmount');
            if (input) {
                input.value = btn.dataset.initial;
                input.focus();
            }
        });
    });
    
    // Initial buy-in modal
    const closeInitialBuyinBtn = document.getElementById('closeInitialBuyinBtn');
    const confirmInitialBuyinBtn = document.getElementById('confirmInitialBuyinBtn');
    const initialBuyinModal = document.getElementById('initialBuyinModal');
    
    if (closeInitialBuyinBtn) closeInitialBuyinBtn.addEventListener('click', hideInitialBuyinModal);
    if (confirmInitialBuyinBtn) confirmInitialBuyinBtn.addEventListener('click', confirmInitialBuyin);
    if (initialBuyinModal) initialBuyinModal.addEventListener('click', (e) => {
        if (e.target === initialBuyinModal) hideInitialBuyinModal();
    });
    
    // Modal & Footer
    if (elements.viewHistoryBtn) elements.viewHistoryBtn.addEventListener('click', showHistory);
    if (elements.closeHistoryBtn) elements.closeHistoryBtn.addEventListener('click', hideHistory);
    if (elements.historyModal) elements.historyModal.addEventListener('click', (e) => {
        if (e.target === elements.historyModal) hideHistory();
    });
    if (elements.exportDataBtn) elements.exportDataBtn.addEventListener('click', exportData);
    if (elements.clearDataBtn) elements.clearDataBtn.addEventListener('click', clearAllData);
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

function startSession() {
    // Show initial buy-in modal
    showInitialBuyinModal();
}

function showInitialBuyinModal() {
    const modal = document.getElementById('initialBuyinModal');
    const input = document.getElementById('initialBuyinAmount');
    if (modal) {
        modal.classList.remove('hidden');
        if (input) {
            input.value = '20';
            input.focus();
        }
    }
}

function hideInitialBuyinModal() {
    const modal = document.getElementById('initialBuyinModal');
    if (modal) modal.classList.add('hidden');
}

function confirmInitialBuyin() {
    const input = document.getElementById('initialBuyinAmount');
    const initialBuyin = input ? parseFloat(input.value) || 0 : 0;
    
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
    
    const buyinText = initialBuyin > 0 ? ` (Initial buy-in: $${initialBuyin})` : '';
    addActivity('system', `Session started${buyinText}`, null);
}

function endSession() {
    if (!state.currentSession) return;
    
    const confirm = window.confirm('Are you sure you want to end this session? Make sure all players have cashed out.');
    if (!confirm) return;
    
    state.currentSession.endTime = new Date().toISOString();
    state.currentSession.players = state.players;
    state.currentSession.activities = state.activities;
    state.currentSession.highHands = state.highHands;
    
    // Calculate final stats
    state.currentSession.totalPot = calculateTotalPot();
    state.currentSession.playerCount = state.players.length;
    
    // Add to history
    state.sessions.unshift(state.currentSession);
    
    // Clear current session
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
    if (elements.sessionIndicator) {
        elements.sessionIndicator.classList.toggle('active', isActive);
        const sessionText = elements.sessionIndicator.querySelector('.session-text');
        if (sessionText) {
            sessionText.textContent = isActive ? 'Session Active' : 'No Active Session';
        }
    }
    
    if (elements.startSessionBtn) elements.startSessionBtn.classList.toggle('hidden', isActive);
    if (elements.endSessionBtn) elements.endSessionBtn.classList.toggle('hidden', !isActive);
    if (elements.sessionInfo) elements.sessionInfo.classList.toggle('hidden', !isActive);
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
}

function updateDuration() {
    if (!state.currentSession) return;
    
    const start = new Date(state.currentSession.startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    let durationStr = '';
    if (hours > 0) {
        durationStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    elements.sessionDuration.textContent = durationStr;
}

// ===========================
// Player Management
// ===========================

function addPlayer() {
    if (!state.currentSession) {
        alert('Please start a session first!');
        return;
    }
    
    const name = elements.playerNameInput.value.trim();
    if (!name) return;
    
    // Check for duplicate
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
    
    // Auto-apply initial buy-in if set
    if (initialBuyin > 0) {
        player.buyins.push({
            amount: initialBuyin,
            time: new Date().toISOString()
        });
        player.totalBuyin = initialBuyin;
    }
    
    state.players.push(player);
    elements.playerNameInput.value = '';
    
    if (initialBuyin > 0) {
        addActivity('buyin', `${name} joined with $${initialBuyin} buy-in`, initialBuyin);
    } else {
        addActivity('player', `${name} joined the game`, null);
    }
    
    saveCurrentSession();
    renderAll();
}

function removePlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    if (player.buyins.length > 0) {
        const confirm = window.confirm(`${player.name} has buy-ins recorded. Are you sure you want to remove them?`);
        if (!confirm) return;
    }
    
    state.players = state.players.filter(p => p.id !== playerId);
    addActivity('player', `${player.name} left the game`, null);
    saveCurrentSession();
    renderAll();
}

// ===========================
// Buy-in & Cash-out
// ===========================

function handleBuyin(e) {
    e.preventDefault();
    
    if (!state.currentSession) {
        alert('Please start a session first!');
        return;
    }
    
    const playerId = parseInt(elements.buyinPlayer.value);
    const amount = parseFloat(elements.buyinAmount.value);
    
    if (!playerId || !amount || amount <= 0) return;
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    player.buyins.push({
        amount: amount,
        time: new Date().toISOString()
    });
    player.totalBuyin += amount;
    
    addActivity('buyin', `${player.name} bought in`, amount);
    
    elements.buyinForm.reset();
    saveCurrentSession();
    renderAll();
}

// Current player being cashed out
let cashoutPlayerId = null;

function getPlayerHighHandBonus(playerId) {
    // Only the CURRENT (latest) high hand winner gets the bonus
    if (state.highHands.length === 0) return 0;
    
    const currentHighHand = state.highHands[state.highHands.length - 1];
    if (currentHighHand.playerId === playerId) {
        return currentHighHand.bonus || 0;
    }
    return 0;
}

function openCashoutModal(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    cashoutPlayerId = playerId;
    
    const highHandBonus = getPlayerHighHandBonus(playerId);
    
    elements.cashoutPlayerName.textContent = player.name;
    elements.cashoutTotalBuyin.textContent = `$${player.totalBuyin}`;
    
    // Show high hand bonus if any
    const bonusEl = document.getElementById('cashoutHighHandBonus');
    if (bonusEl) {
        if (highHandBonus > 0) {
            bonusEl.textContent = `+$${highHandBonus}`;
            bonusEl.parentElement.classList.remove('hidden');
        } else {
            bonusEl.parentElement.classList.add('hidden');
        }
    }
    
    elements.cashoutAmountInput.value = '';
    elements.cashoutResult.classList.add('hidden');
    elements.cashoutResultValue.className = 'result-value';
    
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
    const highHandBonus = getPlayerHighHandBonus(cashoutPlayerId);
    // Profit = cash out + high hand bonus - buy-ins
    const profit = (cashoutAmount + highHandBonus) - player.totalBuyin;
    
    elements.cashoutResult.classList.remove('hidden');
    
    if (profit > 0) {
        elements.cashoutResultValue.textContent = `+$${profit} Won!`;
        elements.cashoutResultValue.className = 'result-value profit';
    } else if (profit < 0) {
        elements.cashoutResultValue.textContent = `-$${Math.abs(profit)} Lost`;
        elements.cashoutResultValue.className = 'result-value loss';
    } else {
        elements.cashoutResultValue.textContent = `$0 Even`;
        elements.cashoutResultValue.className = 'result-value even';
    }
}

function confirmCashout() {
    const player = state.players.find(p => p.id === cashoutPlayerId);
    if (!player) return;
    
    const amount = parseFloat(elements.cashoutAmountInput.value);
    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const highHandBonus = getPlayerHighHandBonus(cashoutPlayerId);
    
    player.cashout = {
        amount: amount,
        highHandBonus: highHandBonus,
        time: new Date().toISOString()
    };
    
    // Profit = cash out + high hand bonus - buy-ins
    const profit = (amount + highHandBonus) - player.totalBuyin;
    const profitStr = profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`;
    
    addActivity('cashout', `${player.name} cashed out (${profitStr})`, amount);
    
    hideCashoutModal();
    saveCurrentSession();
    renderAll();
}

// ===========================
// High Hand
// ===========================

function handleHighHand(e) {
    e.preventDefault();
    
    if (!state.currentSession) {
        alert('Please start a session first!');
        return;
    }
    
    const playerId = parseInt(elements.highHandPlayer.value);
    const handType = elements.highHandType.value;
    const cards = elements.highHandCards.value.trim();
    const bonus = parseFloat(elements.highHandBonus.value) || 0;
    
    if (!playerId || !handType) return;
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    const highHand = {
        id: Date.now(),
        playerId: playerId,
        playerName: player.name,
        handType: handType,
        cards: cards,
        bonus: bonus,
        time: new Date().toISOString()
    };
    
    state.highHands.push(highHand);
    
    let activityText = `${player.name} hit ${handType}`;
    if (bonus > 0) {
        activityText += ` (+$${bonus} bonus)`;
    }
    addActivity('highhand', activityText, bonus || null);
    
    elements.highHandForm.reset();
    saveCurrentSession();
    renderAll();
}

// ===========================
// Activity Log
// ===========================

function addActivity(type, text, amount) {
    const activity = {
        id: Date.now(),
        type: type,
        text: text,
        amount: amount,
        time: new Date().toISOString()
    };
    
    state.activities.unshift(activity);
    
    // Keep only last 50 activities
    if (state.activities.length > 50) {
        state.activities = state.activities.slice(0, 50);
    }
}

// ===========================
// Calculations
// ===========================

function calculateTotalPot() {
    return state.players.reduce((sum, player) => sum + player.totalBuyin, 0);
}

function calculatePlayerProfit(player) {
    if (!player.cashout) return null;
    return player.cashout.amount - player.totalBuyin;
}

// ===========================
// Rendering
// ===========================

function renderAll() {
    renderPlayers();
    renderPlayerSelects();
    renderHighHands();
    renderActivity();
    renderSettlement();
    updateTotalPot();
    updateBonusButtons();
}

function renderPlayers() {
    if (!state.currentSession || state.players.length === 0) {
        elements.playersList.innerHTML = '<li class="empty-state">Start a session to add players</li>';
        return;
    }
    
    elements.playersList.innerHTML = state.players.map(player => {
        const hasCashedOut = player.cashout !== null;
        const highHandBonus = getPlayerHighHandBonus(player.id);
        let actionHtml = '';
        
        // Show high hand indicator if player has one
        const hhIndicator = highHandBonus > 0 ? `<span class="hh-indicator" title="High Hand Bonus">🏆+$${highHandBonus}</span>` : '';
        
        if (hasCashedOut) {
            // Include high hand bonus in profit calculation
            const bonus = player.cashout.highHandBonus || highHandBonus;
            const profit = (player.cashout.amount + bonus) - player.totalBuyin;
            let resultClass = 'even';
            let resultText = '$0';
            
            if (profit > 0) {
                resultClass = 'profit';
                resultText = `+$${profit}`;
            } else if (profit < 0) {
                resultClass = 'loss';
                resultText = `-$${Math.abs(profit)}`;
            }
            
            actionHtml = `<span class="player-result ${resultClass}">${resultText}</span>`;
        } else if (player.totalBuyin > 0) {
            actionHtml = `<button class="cashout-btn" onclick="openCashoutModal(${player.id})">Cash Out</button>`;
        }
        
        return `
            <li>
                <div class="player-info">
                    <div class="player-avatar">${player.name.charAt(0)}</div>
                    <div class="player-details">
                        <span class="player-name">${escapeHtml(player.name)} ${hhIndicator}</span>
                        <span class="player-stats">${player.buyins.length} buy-in${player.buyins.length !== 1 ? 's' : ''} • $${player.totalBuyin}</span>
                    </div>
                </div>
                <div class="player-actions">
                    ${actionHtml}
                    <button class="remove-player-btn" onclick="removePlayer(${player.id})" title="Remove player">✕</button>
                </div>
            </li>
        `;
    }).join('');
}

function renderPlayerSelects() {
    const options = state.players.map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)}</option>`
    ).join('');
    
    const defaultOption = '<option value="">Select player...</option>';
    
    elements.buyinPlayer.innerHTML = defaultOption + options;
    elements.highHandPlayer.innerHTML = defaultOption + options;
}

function renderHighHands() {
    if (state.highHands.length === 0) {
        elements.highHandsList.innerHTML = '<li class="empty-state">No high hands recorded</li>';
        return;
    }
    
    // Only show the current (latest) high hand as the winner
    const currentHH = state.highHands[state.highHands.length - 1];
    
    let html = `
        <li class="high-hand-item current">
            <div class="high-hand-header">
                <span class="high-hand-type">${escapeHtml(currentHH.handType)}</span>
                ${currentHH.bonus > 0 ? `<span class="high-hand-bonus">+$${currentHH.bonus}</span>` : ''}
            </div>
            <div class="high-hand-player">🏆 ${escapeHtml(currentHH.playerName)}</div>
            ${currentHH.cards ? `<div class="high-hand-cards">${escapeHtml(currentHH.cards)}</div>` : ''}
        </li>
    `;
    
    // Show previous high hands as "beaten" (optional history)
    if (state.highHands.length > 1) {
        const previousHands = state.highHands.slice(0, -1).reverse();
        html += previousHands.map(hh => `
            <li class="high-hand-item beaten">
                <div class="high-hand-header">
                    <span class="high-hand-type">${escapeHtml(hh.handType)}</span>
                    <span class="beaten-label">beaten</span>
                </div>
                <div class="high-hand-player">${escapeHtml(hh.playerName)}</div>
            </li>
        `).join('');
    }
    
    elements.highHandsList.innerHTML = html;
}

function renderActivity() {
    // Filter to only show buy-ins
    const buyinActivities = state.activities.filter(a => a.type === 'buyin');
    
    if (buyinActivities.length === 0) {
        elements.activityList.innerHTML = '<li class="empty-state">No buy-ins recorded yet</li>';
        return;
    }
    
    elements.activityList.innerHTML = buyinActivities.slice(0, 20).map(activity => {
        const time = new Date(activity.time);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let amountHtml = '';
        if (activity.amount !== null) {
            amountHtml = `<span class="activity-amount">$${activity.amount}</span>`;
        }
        
        return `
            <li class="activity-item">
                <span class="activity-time">${timeStr}</span>
                <span class="activity-text">${activity.text} ${amountHtml}</span>
            </li>
        `;
    }).join('');
}

function updateTotalPot() {
    const total = calculateTotalPot();
    elements.totalPot.textContent = `$${total}`;
}

// ===========================
// Bonus Buttons
// ===========================

function updateBonusButtons() {
    const playerCount = state.players.length;
    
    if (elements.bonus5Calc) {
        elements.bonus5Calc.textContent = `${playerCount} × $5`;
    }
    if (elements.bonus5Total) {
        elements.bonus5Total.textContent = `= $${playerCount * 5}`;
    }
    if (elements.bonus10Calc) {
        elements.bonus10Calc.textContent = `${playerCount} × $10`;
    }
    if (elements.bonus10Total) {
        elements.bonus10Total.textContent = `= $${playerCount * 10}`;
    }
}

function selectBonusAmount(multiplier) {
    const playerCount = state.players.length;
    const amount = playerCount * multiplier;
    
    if (elements.highHandBonus) {
        elements.highHandBonus.value = amount;
    }
    
    // Visual feedback - highlight selected button
    if (elements.bonus5Btn) elements.bonus5Btn.classList.remove('selected');
    if (elements.bonus10Btn) elements.bonus10Btn.classList.remove('selected');
    
    if (multiplier === 5 && elements.bonus5Btn) {
        elements.bonus5Btn.classList.add('selected');
    } else if (multiplier === 10 && elements.bonus10Btn) {
        elements.bonus10Btn.classList.add('selected');
    }
}

// ===========================
// Settlement Section
// ===========================

function renderSettlement() {
    if (!elements.settlementSection || !elements.settlementContent) {
        return;
    }
    
    // Only show if there are players with activity
    const hasActivity = state.players.some(p => p.totalBuyin > 0);
    
    if (!hasActivity) {
        elements.settlementSection.classList.add('hidden');
        elements.settlementContent.innerHTML = '';
        return;
    }
    
    elements.settlementSection.classList.remove('hidden');
    
    const totalPot = calculateTotalPot();
    
    // Calculate each player's profit/loss
    const playerResults = state.players.map(player => {
        const highHandBonus = getPlayerHighHandBonus(player.id);
        
        if (player.cashout) {
            const bonus = player.cashout.highHandBonus || highHandBonus;
            const profit = (player.cashout.amount + bonus) - player.totalBuyin;
            return {
                name: player.name,
                profit: profit,
                cashedOut: true,
                cashoutAmount: player.cashout.amount,
                highHandBonus: bonus
            };
        } else {
            // Not cashed out yet - show as pending
            return {
                name: player.name,
                profit: null,
                cashedOut: false,
                totalBuyin: player.totalBuyin,
                highHandBonus: highHandBonus
            };
        }
    });
    
    // Separate into winners, losers, and pending
    const winners = playerResults.filter(p => p.cashedOut && p.profit > 0).sort((a, b) => b.profit - a.profit);
    const losers = playerResults.filter(p => p.cashedOut && p.profit < 0).sort((a, b) => a.profit - b.profit);
    const even = playerResults.filter(p => p.cashedOut && p.profit === 0);
    const pending = playerResults.filter(p => !p.cashedOut && p.totalBuyin > 0);
    
    // Calculate totals
    const totalWinnings = winners.reduce((sum, p) => sum + p.profit, 0);
    const totalLosses = Math.abs(losers.reduce((sum, p) => sum + p.profit, 0));
    const isBalanced = Math.abs(totalWinnings - totalLosses) < 0.01;
    
    let html = `
        <div class="settlement-pot">
            <div class="settlement-pot-label">Total Pot</div>
            <div class="settlement-pot-value">$${totalPot}</div>
        </div>
    `;
    
    // Winners section
    if (winners.length > 0) {
        html += `
            <div class="settlement-group">
                <div class="settlement-group-header winners">
                    🟢 WINNERS (+$${totalWinnings})
                </div>
                ${winners.map(p => `
                    <div class="settlement-player">
                        <span class="settlement-player-name">${escapeHtml(p.name)}${p.highHandBonus > 0 ? ' 🏆' : ''}</span>
                        <span class="settlement-player-amount profit">+$${p.profit}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Even section
    if (even.length > 0) {
        html += `
            <div class="settlement-group">
                <div class="settlement-group-header" style="color: var(--text-muted)">
                    ⚪ EVEN
                </div>
                ${even.map(p => `
                    <div class="settlement-player">
                        <span class="settlement-player-name">${escapeHtml(p.name)}</span>
                        <span class="settlement-player-amount" style="color: var(--text-muted)">$0</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Losers section
    if (losers.length > 0) {
        html += `
            <div class="settlement-group">
                <div class="settlement-group-header losers">
                    🔴 OWES (-$${totalLosses})
                </div>
                ${losers.map(p => `
                    <div class="settlement-player">
                        <span class="settlement-player-name">${escapeHtml(p.name)}</span>
                        <span class="settlement-player-amount loss">-$${Math.abs(p.profit)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Pending section
    if (pending.length > 0) {
        html += `
            <div class="settlement-group">
                <div class="settlement-group-header pending">
                    ⏳ NOT CASHED OUT
                </div>
                ${pending.map(p => `
                    <div class="settlement-player">
                        <span class="settlement-player-name">${escapeHtml(p.name)}${p.highHandBonus > 0 ? ' 🏆' : ''}</span>
                        <span class="settlement-player-amount pending">$${p.totalBuyin} in play</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Balance check (only show if someone has cashed out)
    if (winners.length > 0 || losers.length > 0) {
        const balanceClass = isBalanced ? 'balanced' : 'unbalanced';
        const balanceText = isBalanced 
            ? '✓ Balanced' 
            : `⚠ Unbalanced (${pending.length} pending)`;
        
        html += `
            <div class="settlement-balance">
                <span class="settlement-balance-label">Verification</span>
                <span class="settlement-balance-check ${balanceClass}">${balanceText}</span>
            </div>
        `;
    }
    
    elements.settlementContent.innerHTML = html;
}

// ===========================
// History Modal
// ===========================

function showHistory() {
    if (state.sessions.length === 0) {
        elements.historyContent.innerHTML = '<div class="empty-state">No session history yet</div>';
    } else {
        elements.historyContent.innerHTML = state.sessions.map(session => {
            const startDate = new Date(session.startTime);
            const endDate = session.endTime ? new Date(session.endTime) : null;
            
            const dateStr = startDate.toLocaleDateString([], { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            let durationStr = 'In Progress';
            if (endDate) {
                const diff = Math.floor((endDate - startDate) / 1000 / 60);
                const hours = Math.floor(diff / 60);
                const minutes = diff % 60;
                durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            }
            
            const highHandCount = session.highHands ? session.highHands.length : 0;
            
            return `
                <div class="history-session">
                    <div class="history-session-header">
                        <span class="history-session-date">${dateStr}</span>
                        <span class="history-session-duration">${durationStr}</span>
                    </div>
                    <div class="history-stats">
                        <div class="history-stat">
                            <span class="history-stat-label">Players</span>
                            <span class="history-stat-value">${session.playerCount || session.players?.length || 0}</span>
                        </div>
                        <div class="history-stat">
                            <span class="history-stat-label">Total Pot</span>
                            <span class="history-stat-value">$${session.totalPot || 0}</span>
                        </div>
                        <div class="history-stat">
                            <span class="history-stat-label">High Hands</span>
                            <span class="history-stat-value">${highHandCount}</span>
                        </div>
                    </div>
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
    a.download = `poker-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function clearAllData() {
    const confirm = window.confirm('Are you sure you want to clear ALL data? This cannot be undone!');
    if (!confirm) return;
    
    const doubleConfirm = window.confirm('This will delete all sessions and history. Are you really sure?');
    if (!doubleConfirm) return;
    
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
// Helper Functions
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

// Make functions available globally for onclick
window.removePlayer = removePlayer;
window.openCashoutModal = openCashoutModal;

// ===========================
// Initialize App
// ===========================

// App is initialized after PIN unlock (see initPinLock function)

