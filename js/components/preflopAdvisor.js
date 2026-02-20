const RANK_VALUES = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    T: 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2
};

const POSITION_EDGE = {
    UTG: -0.03,
    MP: -0.01,
    CO: 0.01,
    BTN: 0.03,
    SB: -0.01,
    BB: 0
};

function normalizeHand(rankA, rankB, suited) {
    const first = RANK_VALUES[rankA] >= RANK_VALUES[rankB] ? rankA : rankB;
    const second = first === rankA ? rankB : rankA;

    if (first === second) {
        return `${first}${second}`;
    }

    return `${first}${second}${suited ? "s" : "o"}`;
}

function baseEquityForHand(handCode) {
    const premium = new Set(["AA", "KK", "QQ", "JJ", "AKs"]);
    const strong = new Set(["TT", "AQs", "AJs", "KQs", "AKo", "99"]);
    const playable = new Set(["88", "77", "ATs", "KJs", "QJs", "AJo", "KQo", "66", "55"]);
    const speculative = new Set(["44", "33", "22", "A9s", "KTs", "QTs", "JTs", "T9s", "ATo", "KJo", "QJo"]);

    if (premium.has(handCode)) return 0.68;
    if (strong.has(handCode)) return 0.6;
    if (playable.has(handCode)) return 0.54;
    if (speculative.has(handCode)) return 0.48;
    return 0.42;
}

function adjustedEquity(handCode, playersCount, position) {
    const opponents = Math.max(1, playersCount - 1);
    const multiwayPenalty = Math.max(0, (opponents - 1) * 0.03);
    const positionBonus = POSITION_EDGE[position] || 0;

    const equity = baseEquityForHand(handCode) - multiwayPenalty + positionBonus;
    return Math.max(0.12, Math.min(0.85, equity));
}

export function evaluatePreflopSpot(input) {
    const handCode = normalizeHand(input.rankA, input.rankB, input.suited);
    const equity = adjustedEquity(handCode, input.playersCount, input.position);
    const potOdds = input.callAmount <= 0 ? 0 : input.callAmount / (input.potSize + input.callAmount);
    const edge = equity - potOdds;

    let action = "Fold";
    if (edge >= 0.08) {
        action = "Raise";
    } else if (edge >= 0.02) {
        action = "Call";
    }

    const confidence = Math.round(Math.max(25, Math.min(95, 60 + edge * 220)));
    const reasons = [
        `Hand: ${handCode}`,
        `Estimated equity: ${(equity * 100).toFixed(1)}%`,
        `Pot odds needed: ${(potOdds * 100).toFixed(1)}%`,
        `Edge: ${(edge * 100).toFixed(1)}%`
    ];

    if (input.stackBb > 0 && input.stackBb < 20 && action === "Call") {
        reasons.push("Short stack note: consider shove/fold ranges at <20bb.");
    }

    return { action, confidence, reasons, handCode, equity, potOdds, edge };
}

function countByRank(cards) {
    return cards.reduce((acc, card) => {
        acc[card.rank] = (acc[card.rank] || 0) + 1;
        return acc;
    }, {});
}

function countBySuit(cards) {
    return cards.reduce((acc, card) => {
        acc[card.suit] = (acc[card.suit] || 0) + 1;
        return acc;
    }, {});
}

function getMadeHandStrength(holeCards, boardCards) {
    const allCards = [...holeCards, ...boardCards];
    const rankMap = countByRank(allCards);
    const rankCounts = Object.values(rankMap).sort((a, b) => b - a);
    const suitCounts = Object.values(countBySuit(allCards)).sort((a, b) => b - a);

    const uniqueRanks = [...new Set(allCards.map(card => RANK_VALUES[card.rank]))].sort((a, b) => a - b);
    if (uniqueRanks.includes(14)) uniqueRanks.unshift(1);

    let hasStraight = false;
    for (let i = 0; i <= uniqueRanks.length - 5; i += 1) {
        const isRun = uniqueRanks[i + 4] - uniqueRanks[i] === 4;
        if (isRun) {
            hasStraight = true;
            break;
        }
    }

    const hasFlush = suitCounts[0] >= 5;
    const hasTrips = rankCounts[0] === 3;
    const hasQuads = rankCounts[0] === 4;
    const hasPair = rankCounts[0] === 2;
    const pairCount = rankCounts.filter(count => count === 2).length;
    const hasFullHouse = hasTrips && (rankCounts[1] >= 2);

    let label = "High Card";
    let score = 0.34;

    if (hasQuads) {
        label = "Four of a Kind";
        score = 0.92;
    } else if (hasFullHouse) {
        label = "Full House";
        score = 0.88;
    } else if (hasFlush) {
        label = "Flush";
        score = 0.82;
    } else if (hasStraight) {
        label = "Straight";
        score = 0.78;
    } else if (hasTrips) {
        label = "Trips";
        score = 0.72;
    } else if (pairCount >= 2) {
        label = "Two Pair";
        score = 0.62;
    } else if (hasPair) {
        const topBoardRank = Math.max(...boardCards.map(card => RANK_VALUES[card.rank]));
        const pairRank = Object.keys(rankMap).find(rank => rankMap[rank] === 2);
        const isTopPair = pairRank && RANK_VALUES[pairRank] >= topBoardRank;
        label = isTopPair ? "Top Pair" : "Pair";
        score = isTopPair ? 0.55 : 0.49;
    }

    return { label, score };
}

function getDrawStrength(holeCards, boardCards) {
    const allCards = [...holeCards, ...boardCards];
    const suitCounts = Object.values(countBySuit(allCards)).sort((a, b) => b - a);
    const hasFlushDraw = suitCounts[0] === 4;

    const uniqueRanks = [...new Set(allCards.map(card => RANK_VALUES[card.rank]))].sort((a, b) => a - b);
    if (uniqueRanks.includes(14)) uniqueRanks.unshift(1);

    let longestRun = 1;
    let currentRun = 1;
    for (let i = 1; i < uniqueRanks.length; i += 1) {
        if (uniqueRanks[i] === uniqueRanks[i - 1] + 1) {
            currentRun += 1;
            longestRun = Math.max(longestRun, currentRun);
        } else {
            currentRun = 1;
        }
    }

    const hasOpenEnded = longestRun >= 4;
    const hasGutshot = !hasOpenEnded && longestRun === 3;

    let drawBoost = 0;
    const notes = [];

    if (hasFlushDraw) {
        drawBoost += 0.08;
        notes.push("Flush draw");
    }
    if (hasOpenEnded) {
        drawBoost += 0.06;
        notes.push("Open-ended straight draw");
    } else if (hasGutshot) {
        drawBoost += 0.03;
        notes.push("Gutshot straight draw");
    }

    return { drawBoost, notes };
}

export function evaluateFlopSpot(input) {
    const holeCards = [input.cardA, input.cardB];
    const boardCards = [input.flop1, input.flop2, input.flop3];
    const potOdds = input.callAmount <= 0 ? 0 : input.callAmount / (input.potSize + input.callAmount);

    const made = getMadeHandStrength(holeCards, boardCards);
    const draws = getDrawStrength(holeCards, boardCards);

    const opponents = Math.max(1, input.playersCount - 1);
    const multiwayPenalty = Math.max(0, (opponents - 1) * 0.02);
    const positionBonus = POSITION_EDGE[input.position] || 0;
    const stackAdjustment = input.stackBb > 0 && input.stackBb < 25 ? 0.01 : 0;

    const equity = Math.max(
        0.12,
        Math.min(0.9, made.score + draws.drawBoost + positionBonus - multiwayPenalty + stackAdjustment)
    );
    const edge = equity - potOdds;

    let action = "Fold";
    if (edge >= 0.09) {
        action = "Raise";
    } else if (edge >= 0.02) {
        action = "Call";
    }

    const confidence = Math.round(Math.max(25, Math.min(95, 58 + edge * 230)));
    const reasons = [
        `Street: Flop`,
        `Made hand: ${made.label}`,
        `Estimated equity: ${(equity * 100).toFixed(1)}%`,
        `Pot odds needed: ${(potOdds * 100).toFixed(1)}%`,
        `Edge: ${(edge * 100).toFixed(1)}%`
    ];

    if (draws.notes.length > 0) {
        reasons.push(`Draws: ${draws.notes.join(", ")}`);
    }

    return { action, confidence, reasons, equity, potOdds, edge };
}
