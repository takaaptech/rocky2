import { each } from 'lodash';

export default class Player {
  constructor(user, seatNum, table) {
    // 名稱
    this.name = user.name || '';

    // 籌碼
    this.chips = user.chips || 0;

    // seat num
    this.seatNum = seatNum;

    // socket id
    this.socketId = user.socketId;

    // 牌桌
    this.table = table;

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

  check() {
    console.log('check')
    let checkAllow = true;

    for (let i = 0; i < this.table.game.bets.length; i += 1) {
      if (this.table.game.bets[i] !== 0) {
        checkAllow = false;
      }
    }

    if (checkAllow) {

      each(this.table.players, (player, idx) => {
        if (this === player) {
          this.table.game.bets[idx] = 0;
          this.talked = true;
        }
      });

      this.turnBet = { action: "check" };

      this.table.progress();
    } else {
      console.log("Check not allowed, replay please");
    }
  }

  fold() {
    console.log('fold');

    each(this.table.players, (player, idx) => {
      if (this === player) {
        let bet = parseInt(this.table.game.bets[idx], 10);
        this.table.game.bets[idx] = 0;
        this.table.game.pot += bet;
        this.talked = true;
      }
    });

    this.folded = true;
    this.turnBet = { action: "fold" };
    this.table.progress();
  }

  bet(bet) {
    console.log('bet');

    if (this.chips > bet) {
      each(this.table.players, (player, idx) => {
        if (this === player) {
          this.table.game.bets[idx] += bet;
          player.chips -= bet;
          this.talked = true;
        }
      });

      //Attemp to progress the game
      this.turnBet = { action: 'bet', amount: bet };
      this.table.progress();
    } else {
      console.log('You don\'t have enought chips --> ALL IN !!!');
      this.AllIn();
    }
  }

  call() {
    const table = this.table;
    const maxBet = table.getMaxBet();

    if (this.chips > maxBet) {
      // Match the highest bet
      each(table.players, (player, idx) => {
        if (this === player) {
          if (table.game.bets[idx] >= 0) {
            this.chips += table.game.bets[idx];
          }
          this.chips -= maxBet;
          table.game.bets[idx] = maxBet;
          this.talked = true;
        }
      });

      // Attemp to progress the game
      this.turnBet = { action: 'call', amount: maxBet };

      table.progress();
    } else {
      console.log('You don\'t have enought chips --> ALL IN !!!');
      this.allIn();
    }
  }

  allIn() {
    console.log('allIn');

    let allInValue = 0;

    each(table.players, (player, idx) => {
      if (this === player) {
        if (player.chips !== 0) {
          allInValue = player.chips;
          this.table.game.bets[idx] += player.chips;
          player.chips = 0;
          this.allIn = true;
          this.talked = true;
        }
      }
    });

    this.turnBet = { action: 'allin', amount: allInValue };
    this.table.progress();
  }

  toJSON() {
    return {
      name: this.name,
      socketId: this.socketId,
      seatNum: this.seatNum,
      chips: this.chips,
      cards: this.cards,
      hand: this.hand,
      folded: this.folded,
      allIn: this.allIn,
      talked: this.talked
    }
  }
}