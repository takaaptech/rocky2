import { each } from 'lodash';
import * as Hand from './hand';

export default class Player {
  constructor(table, user, chips) {
    // 牌桌
    this.table = table;

    this.user = user;

    // 名稱
    this.name = user.name;

    // 籌碼
    this.chips = chips;

    // 手牌
    this.cards = [];

    // 牌組
    this.hand = null;

    // 棄牌
    this.folded = false;

    // 全下
    this.allIn = false;

    // 說話
    this.talked = false;
  }

  isFolded() {
    return this.folded;
  }

  isAllIn() {
    return this.allIn;
  }

  isTalked() {
    return this.talked;
  }

  setBlind(blind) {
    this.chips -= blind;
    this.table.board.bet(this, blind);
  }

  setTalk(bool) {
    this.talked = bool;
  }


  push(card) {
    this.cards.push(card);
  }

  bet(bet) {
    if (this.chips > bet) {
      this.chips -= bet;
      this.table.board.bet(this, bet);
      this.talked = true;
      this.table.progress();
    } else {
      this.all();
    }
  }

  all() {
    const table = this.table;

    if (this.chips !== 0) {
      table.board.bet(this, this.chips);
      this.chips = 0;
      this.allIn = true;
      this.talked = true;
    }

    table.progress();
  }

  call() {
    const table = this.table;
    const maxBet = table.board.getMaxBet();

    if (this.chips > maxBet) {
      this.chips -= maxBet;
      table.board.bet(this, maxBet);
      this.talked = true;
      table.progress();
    } else {
      this.all();
    }
  }

  fold() {
    this.talked = true;
    this.folded = true;
    this.table.progress();
  }

  check() {
    if (this.table.board.getMaxBet() === 0) {
      this.bet(0);
    }
  }

  showHandCards() {
    this.hand = Hand.rankHand({ cards: this.cards.concat(this.table.board.board) });
    console.log(this.hand)
  }

  getHandRank() {
    if (!this.hand) {
      return 0;
    }
    return this.hand.rank;
  }
}