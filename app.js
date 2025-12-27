/**
 * Poker Night Tracker
 * A simple app to track buy-ins, cash-outs, and high hands for poker games
 */

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

const elements = {
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
    
    // High Hands & Activity
    highHandsList: document.getElementById('highHandsList'),
    activityList: document.getElementById('activityList'),
    
    // Modal & Footer
    historyModal: document.getElementById('historyModal'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyContent: document.getElementById('historyContent'),
    viewHistoryBtn: document.getElementById('viewHistoryBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    clearDataBtn: document.getElementById('clearDataBtn')
};

// Duration timer interval
let durationInterval = null;

// ===========================
// Initialization
// ===========================

function init() {
    loadFromStorage();
    setupEventListeners();
    
    if (state.currentSession) {
        restoreSession();
    }
    
    renderAll();
}

function setupEventListeners() {
    // Session controls
    elements.startSessionBtn.addEventListener('click', startSession);
    elements.endSessionBtn.addEventListener('click', endSession);
    
    // Player management
    elements.addPlayerBtn.addEventListener('click', addPlayer);
    elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    
    // Forms
    elements.buyinForm.addEventListener('submit', handleBuyin);
    elements.highHandForm.addEventListener('submit', handleHighHand);
    
    // Cash-out modal
    elements.closeCashoutBtn.addEventListener('click', hideCashoutModal);
    elements.cashoutModal.addEventListener('click', (e) => {
        if (e.target === elements.cashoutModal) hideCashoutModal();
    });
    elements.cashoutAmountInput.addEventListener('input', updateCashoutPreview);
    elements.confirmCashoutBtn.addEventListener('click', confirmCashout);
    
    // Quick amount buttons
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.buyinAmount.value = btn.dataset.amount;
            elements.buyinAmount.focus();
        });
    });
    
    // Modal & Footer
    elements.viewHistoryBtn.addEventListener('click', showHistory);
    elements.closeHistoryBtn.addEventListener('click', hideHistory);
    elements.historyModal.addEventListener('click', (e) => {
        if (e.target === elements.historyModal) hideHistory();
    });
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.clearDataBtn.addEventListener('click', clearAllData);
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
    state.currentSession = {
        id: Date.now(),
        startTime: new Date().toISOString(),
        endTime: null,
        players: [],
        activities: [],
        highHands: []
    };
    
    state.players = [];
    state.activities = [];
    state.highHands = [];
    
    saveToStorage();
    renderAll();
    updateSessionUI(true);
    startDurationTimer();
    
    addActivity('system', 'Session started', null);
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
    elements.sessionIndicator.classList.toggle('active', isActive);
    elements.sessionIndicator.querySelector('.session-text').textContent = 
        isActive ? 'Session Active' : 'No Active Session';
    
    elements.startSessionBtn.classList.toggle('hidden', isActive);
    elements.endSessionBtn.classList.toggle('hidden', !isActive);
    elements.sessionInfo.classList.toggle('hidden', !isActive);
    
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
    
    const player = {
        id: Date.now(),
        name: name,
        buyins: [],
        cashout: null,
        totalBuyin: 0
    };
    
    state.players.push(player);
    elements.playerNameInput.value = '';
    
    addActivity('player', `${name} joined the game`, null);
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
    return state.highHands
        .filter(hh => hh.playerId === playerId)
        .reduce((sum, hh) => sum + (hh.bonus || 0), 0);
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
    updateTotalPot();
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
    
    elements.highHandsList.innerHTML = state.highHands.map(hh => `
        <li class="high-hand-item">
            <div class="high-hand-header">
                <span class="high-hand-type">${escapeHtml(hh.handType)}</span>
                ${hh.bonus > 0 ? `<span class="high-hand-bonus">+$${hh.bonus}</span>` : ''}
            </div>
            <div class="high-hand-player">${escapeHtml(hh.playerName)}</div>
            ${hh.cards ? `<div class="high-hand-cards">${escapeHtml(hh.cards)}</div>` : ''}
        </li>
    `).join('');
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

document.addEventListener('DOMContentLoaded', init);

