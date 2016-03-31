
function update(map, key, value) {
  if (map.has(key)) {
    map.set(key, (map.get(key) + value));
  } else {
    map.set(key, value);
  }
}

export default class Board {
  constructor() {
    // 底池
    this.pot = 0;

    // 公牌
    this.board = [];

    // 每位玩家當前回合下注狀態
    this.bets = new Map();

    this.roundBets = new Map();
  }

  bet(player, chips) {
    update(this.bets, player, chips);
  }

  push(card) {
    this.board.push(card);
  }

  pushBetsToPot() {
    var pot = 0;

    this.bets.forEach((bet, player) => {
      const intOfBet = parseInt(bet, 10) || 0;
      update(this.roundBets, player, bet);
      pot += intOfBet;
    });

    this.bets.clear();

    this.pot += pot;
  }

  getMaxBet() {
    var maxBet = 0;
    this.bets.forEach((bet) => {
      const intOfBet = parseInt(bet, 10) || 0;
      if (intOfBet > maxBet) {
        maxBet = intOfBet;
      }
    });
    return maxBet;
  }

  getPot() {
    return this.pot;
  }

  reset() {
    this.pot = 0;
    this.board = [];
    this.bets.clear();
    this.roundBets.clear();
  }

}