function fillDeck(deck) {
  deck.push('AS');
  deck.push('KS');
  deck.push('QS');
  deck.push('JS');
  deck.push('TS');
  deck.push('9S');
  deck.push('8S');
  deck.push('7S');
  deck.push('6S');
  deck.push('5S');
  deck.push('4S');
  deck.push('3S');
  deck.push('2S');
  deck.push('AH');
  deck.push('KH');
  deck.push('QH');
  deck.push('JH');
  deck.push('TH');
  deck.push('9H');
  deck.push('8H');
  deck.push('7H');
  deck.push('6H');
  deck.push('5H');
  deck.push('4H');
  deck.push('3H');
  deck.push('2H');
  deck.push('AD');
  deck.push('KD');
  deck.push('QD');
  deck.push('JD');
  deck.push('TD');
  deck.push('9D');
  deck.push('8D');
  deck.push('7D');
  deck.push('6D');
  deck.push('5D');
  deck.push('4D');
  deck.push('3D');
  deck.push('2D');
  deck.push('AC');
  deck.push('KC');
  deck.push('QC');
  deck.push('JC');
  deck.push('TC');
  deck.push('9C');
  deck.push('8C');
  deck.push('7C');
  deck.push('6C');
  deck.push('5C');
  deck.push('4C');
  deck.push('3C');
  deck.push('2C');

  // 洗牌
  // Shuffle the deck array with Fisher-Yates
  var i, j, tempi, tempj;
  for (i = 0; i < deck.length; i += 1) {
    j = Math.floor(Math.random() * (i + 1));
    tempi = deck[i];
    tempj = deck[j];
    deck[i] = tempj;
    deck[j] = tempi;
  }

  return deck;
}

export default class Game {
  constructor(smallBlind, bigBlind) {
    // 小盲注
    this.smallBlind = smallBlind;

    // 大盲注
    this.bigBlind = bigBlind;

    // 底池
    this.pot = 0;

    // 回合狀態
    this.roundName = 'Deal';

    // 玩家下注數
    this.bets = [];

    // 每回合玩家下注數
    this.roundBets = [];

    // 牌組
    this.deck = [];

    // 公牌
    this.board = [];

    // 洗牌
    this.fillDeck()
  }

  fillDeck() {
    this.deck = fillDeck([]);
  }

  reset() {
    this.roundName = 'Deal';
    this.pot = 0;
    this.bets = [];
    this.board = [];
    this.fillDeck();
  }

  toJSON() {
    return {
      pot: this.pot,
      bets: this.bets,
      roundBets: this.roundBets,
      board: this.board,
      deck: this.deck
    };
  }
}