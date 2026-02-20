export function buildPlayersListMarkup(currentSession, players, getPlayerHighHandBonus, escapeHtml) {
    if (!currentSession || players.length === 0) {
        return '<li class="empty-state">Start a session to add players</li>';
    }

    return players.map(player => {
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

export function buildPlayerOptionsMarkup(players, escapeHtml) {
    const options = players.map(player => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join('');
    return '<option value="">Select player...</option>' + options;
}

export function buildActivityMarkup(activities) {
    const buyinActivities = activities.filter(activity => activity.type === 'buyin');

    if (buyinActivities.length === 0) {
        return '<li class="empty-state">No buy-ins yet</li>';
    }

    return buyinActivities.slice(0, 10).map(activity => {
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

export function buildHighHandMarkup(highHands, escapeHtml) {
    if (highHands.length === 0) {
        return '<span class="empty-state">No high hand yet</span>';
    }

    const currentHH = highHands[highHands.length - 1];
    return `
        <div class="hh-winner">
            <span class="hh-player">${escapeHtml(currentHH.playerName)}</span>
            <span class="hh-hand">${escapeHtml(currentHH.handType)}</span>
        </div>
        ${currentHH.bonus > 0 ? `<div class="hh-bonus">+$${currentHH.bonus} bonus</div>` : ''}
        ${currentHH.cards ? `<div class="hh-cards">${escapeHtml(currentHH.cards)}</div>` : ''}
    `;
}

export function buildSettlementSections(results, escapeHtml) {
    const winners = results.filter(result => result.settled && result.profit > 0).sort((a, b) => b.profit - a.profit);
    const losers = results.filter(result => result.settled && result.profit < 0).sort((a, b) => a.profit - b.profit);
    const even = results.filter(result => result.settled && result.profit === 0);
    const pending = results.filter(result => !result.settled && result.totalBuyin > 0);

    const winnersMarkup = winners.length > 0 || even.length > 0 ? `
        <div class="settle-group-header">
            <span>🏆 Winners</span>
            <span>+$${winners.reduce((sum, player) => sum + player.profit, 0)}</span>
        </div>
        <div class="settle-group-list">
            ${winners.map(player => `
                <div class="settle-result-row">
                    <span class="settle-result-name">
                        ${escapeHtml(player.name)}
                        ${player.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${player.hhBonus}</span>` : ''}
                    </span>
                    <span class="settle-result-amount profit">+$${player.profit}</span>
                </div>
            `).join('')}
            ${even.map(player => `
                <div class="settle-result-row">
                    <span class="settle-result-name">
                        ${escapeHtml(player.name)}
                        ${player.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${player.hhBonus}</span>` : ''}
                    </span>
                    <span class="settle-result-amount" style="color: var(--text-muted)">$0</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    const losersMarkup = losers.length > 0 ? `
        <div class="settle-group-header">
            <span>💸 Owes</span>
            <span>-$${Math.abs(losers.reduce((sum, player) => sum + player.profit, 0))}</span>
        </div>
        <div class="settle-group-list">
            ${losers.map(player => `
                <div class="settle-result-row">
                    <span class="settle-result-name">
                        ${escapeHtml(player.name)}
                        ${player.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${player.hhBonus}</span>` : ''}
                    </span>
                    <span class="settle-result-amount loss">-$${Math.abs(player.profit)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';

    const pendingMarkup = pending.length > 0 ? pending.map(player => `
        <div class="settle-pending-row">
            <div class="settle-pending-info">
                <div class="settle-pending-name">
                    ${escapeHtml(player.name)}
                    ${player.hhBonus > 0 ? `<span class="hh-bonus-tag">🏆 +$${player.hhBonus}</span>` : ''}
                </div>
                <div class="settle-pending-buyin">$${player.totalBuyin} in</div>
            </div>
            <input type="number" class="settle-input" id="settle-${player.id}" placeholder="$" min="0">
            <button class="settle-btn" onclick="confirmSettle(${player.id})">✓</button>
        </div>
    `).join('') : '';

    const totalWinnings = winners.reduce((sum, player) => sum + player.profit, 0);
    const totalLosses = Math.abs(losers.reduce((sum, player) => sum + player.profit, 0));
    const diff = Math.abs(totalWinnings - totalLosses);

    return {
        winners,
        losers,
        even,
        pending,
        winnersMarkup,
        losersMarkup,
        pendingMarkup,
        totalWinnings,
        totalLosses,
        diff
    };
}
