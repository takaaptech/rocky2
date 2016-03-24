import { EventEmitter } from 'events';

import Game from './game';
import Player from './player';

import { each, find, max, range } from 'lodash';

import * as Hand from './hand.js';

export default class Table extends EventEmitter {
  constructor(smallBlind, bigBlind, minPlayers, maxPlayers, minBuyIn, maxBuyIn) {
    super();

    // 小盲注
    this.smallBlind = smallBlind;

    // 大盲注
    this.bigBlind = bigBlind;

    // 最小玩家數
    this.minPlayers = minPlayers;

    // 最大玩家數
    this.maxPlayers = maxPlayers;

    // 最小買入
    this.minBuyIn = minBuyIn;

    // 最大買入
    this.maxBuyIn = maxBuyIn;

    // 玩家
    this.players = [];

    // 遊戲
    this.game = null;

    // 發牌人員位置
    this.dealer = 0;

    // 記錄玩家位置
    this.currentPlayer = 0;

    // 回合小盲注位置
    this.smallBlindPosition = 0;

    // 回合大盲注位置
    this.bigBlindPosition = 0;

    // 座位編號
    this.playersOnSeat = {};

    // 記錄前一個使用者下注行為
    this.turnBet = {};

    // 統計贏家
    this.winners = [];

    // 統計輸家
    this.losers = [];

    var error;

    if (minPlayers < 2) {
      error = new Error('Parameter [minPlayers] must be a postive integer of a minimum value of 2.');
    } else if (maxPlayers > 10) {
      error = new Error('Parameter [maxPlayers] must be a positive integer less than or equal to 10.');
    } else if (minPlayers > maxPlayers) {
      error = new Error('Parameter [minPlayers] must be less than or equal to [maxPlayers].');
    }

    if (error) {
      throw error;
    }
  }

  addPlayer(user, seatNum) {
    // 檢查加入牌局狀況
    if (this.isJoin(user) || this.playersOnSeat[seatNum]) {
      return;
    }

    // 籌碼額度檢查
    if (user.chips >= this.minBuyIn && user.chips <= this.maxBuyIn) {
      this.playersOnSeat[seatNum] = new Player(user, seatNum, this);
      this.emit('addPlayer');
    }

    // 若已達最小玩家人數即開始新牌局
    if (this.players.length === 0 && Object.keys(this.playersOnSeat).length >= this.minPlayers) {
      this.start();
    }
  }

  start() {
    this.emit('startGame');
    if (!this.game) {
      this.game = new Game(this.smallBlind, this.bigBlind);
      this.newRound();
    }
  }

  newRound() {
    // 設定新牌局玩家
    each(this.playersOnSeat, (player) => {
      this.players.push(player);
    });

    this.winners = [];
    this.losers = [];

    // 初始每任玩家
    each(this.players, (player, idx) => {
      player.cards.push(this.game.deck.pop());
      player.cards.push(this.game.deck.pop());
      this.game.bets[idx] = 0;
      this.game.roundBets[idx] = 0;
    });

    // 決定大小盲注玩家位置
    let smallBlind, bigBlind;

    smallBlind = this.dealer + 1;

    if (smallBlind >= this.players.length) {
      smallBlind = 0;
    }

    bigBlind = this.dealer + 2;

    if (bigBlind >= this.players.length) {
      bigBlind -= this.players.length;
    }

    // 大小盲注下注
    this.players[smallBlind].chips -= this.smallBlind;
    this.players[bigBlind].chips -= this.bigBlind;

    this.game.bets[smallBlind] = this.smallBlind;
    this.game.bets[bigBlind] = this.bigBlind;

    // 記錄大小盲注玩家位置
    this.smallBlindPosition = smallBlind;
    this.bigBlindPosition = bigBlind;

    // 取得目前玩家
    this.currentPlayer = this.dealer + 3;

    if (this.currentPlayer >= this.players.length) {
      this.currentPlayer -= this.players.length;
    }

    this.emit('newRound');
  }

  action(type, user, ...args) {
    const currentPlayer = this.getCurrentPlayer();

    if (!currentPlayer) {
      return false;
    }

    if (user.socketId === currentPlayer.socketId && currentPlayer[type]) {
      return currentPlayer[type].apply(currentPlayer, args);
    } else {
      return false;
    }
  }

  call(user) {
    this.action('call', user);
  }

  check(user) {
    this.action('check', user);
  }

  fold(user) {
    this.action('fold', user);
  }

  bet(user, amt) {
    this.action('bet', user, amt);
  }

  allIn(user) {
    this.action('allIn', user);
  }

  getWinners() {
    return this.winners;
  }

  getLosers() {
    return this.losers;
  }

  initNewRound() {
    this.dealer += 1;
    if (this.dealer >= this.players.length) {
      this.dealer = 0;
    }
    this.players = []
    this.game.reset();
    this.newRound();
  }

  toJSON() {
    var game = {};

    if (this.game) {
      game = this.game.toJSON();
    }

    return {
      game: game,
      playersOnSeat: this.playersOnSeat,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      maxBuyIn: this.maxBuyIn,
      minBuyIn: this.minBuyIn,
      dealer: this.dealer,
      smallBlindPosition: this.smallBlindPosition,
      bigBlindPosition: this.bigBlindPosition,
      currentPlayer: this.getCurrentPlayer(),
      players: this.players
    };
  }

  getMaxBet() {
    return max(this.game.bets);
  }

  getPlayerByIndex(index) {
    return this.players[index];
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  removePlayer(user) {
    var bool = false;

    each(this.players, (player) => {
      if (player.socketId == user.socketId) {
        bool = true;
        player.fold();
      }
    });

    each(this.playersOnSeat, (player, num) => {
      if (player.socketId == user.socketId) {
        bool = true;
        delete this.playersOnSeat[num];
      }
    });

    if (bool) {
      this.emit('removePlayer');
    }
  }

  isJoin(user) {
    return find(this.playersOnSeat, (player) => player.socketId == user.socketId);
  }

  checkForEndOfRound() {
    let endOfRound = true;

    const maxBet = this.getMaxBet();

    each(this.players, (player, idx) => {
      if (player.folded === false) {
        if (player.talked === false || this.game.bets[idx] !== maxBet) {
          if (player.allIn === false) {
            this.currentPlayer = idx;
            endOfRound = false;
          }
        }
      }
    });

    return endOfRound;
  }

  progress() {
    const game = this.game;
    const isEndOfRound = this.checkForEndOfRound();
    this.emit('turn');

    if (game && isEndOfRound === true) {

      // 調整玩家位置
      this.currentPlayer = (this.currentPlayer >= this.players.length - 1)
        ? (this.currentPlayer - this.players.length + 1) : (this.currentPlayer + 1 );

      // 將下注金額移去底池
      each(game.bets, (bet, idx) => {
        bet = parseInt(bet, 10);
        game.pot += bet
        game.roundBets[idx] += bet;
      });

      switch (game.roundName) {
        case 'Deal':
          console.log('effective deal');
          game.roundName = 'Flop';
          game.deck.pop();

          range(3).forEach(() => {
            game.board.push(game.deck.pop());
          });

          for (let i = 0; i < game.bets.length; i += 1) {
            game.bets[i] = 0;
          }

          each(this.players, (player) => {
            player.talked = false;
          });

          this.emit('deal');

          break;
        case 'Flop':
          console.log('effective flop');

          game.roundName = 'Turn';

          game.deck.pop();

          game.board.push(game.deck.pop());

          for (let i = 0; i < game.bets.length; i += 1) {
            game.bets[i] = 0;
          }

          each(this.players, (player) => {
            player.talked = false;
          });

          this.emit('deal');
          break;

        case 'Turn':
          console.log('effective turn');
          game.roundName = 'River';
          game.deck.pop();
          game.board.push(game.deck.pop());

          for (let i = 0; i < game.bets.length; i += 1) {
            game.bets[i] = 0;
          }

          each(this.players, (player) => {
            player.talked = false;
          });

          this.emit('deal');
          break;

        case 'River':
          game.roundName = 'Showdown';
          game.bets.splice(0, game.bets.length);

          each(this.players, (player) => {
            player.hand = Hand.rankHand(Hand.create(player.cards.concat(game.board)));
          });

          this.checkForWinner();

          this.checkForBankrupt();

          this.emit('gameOver');

          this.initNewRound();
          break;
      }
    }

  }

  checkForWinner() {
    let winners = [];
    let maxRank = 0.000;

    each(this.players, (player, idx) => {
      if (player.hand.rank === maxRank && player.folded === false) {
        winners.push(idx);
      }

      if (player.hand.rank > maxRank && player.folded === false) {
        maxRank = player.hand.rank;
        winners.splice(0, winners.length);
        winners.push(idx);
      }
    });

    // 計算金額
    let part = 0;
    let prize = 0;
    let minBets = 0;

    let allInPlayer = this.checkForAllInPlayer(winners);

    if (allInPlayer.length > 0) {
      minBets = this.game.roundBets[winners[0]];

      each(allInPlayer, (idx) => {
        if (this.game.roundBets[idx] !== 0 && this.game.roundBets[idx] < minBets) {
          minBets = this.game.roundBets[idx];
        }
      });
      part = parseInt(minBets, 10);
    } else {
      part = parseInt(this.game.roundBets[winners[0]], 10);
    }

    for (let i = 0; i < this.game.roundBets.length; i += 1) {
      if (this.game.roundBets[i] > part) {
        prize += part;
        this.game.roundBets[i] -= part;
      } else {
        prize += this.game.roundBets[i];
        this.game.roundBets[i] = 0;
      }
    }

    each(winners, (idx) => {
      const winnerPrize = prize / winners.length;
      const winningPlayer = this.getPlayerByIndex(idx);
      winningPlayer.chips += winnerPrize;
      if (this.game.roundBets[idx] === 0) {
        winningPlayer.folded = true;
        this.winners.push({
          name: winningPlayer.name,
          amount: winnerPrize,
          hand: winningPlayer.hand,
          chips: winningPlayer.chips
        });
      }
      console.log('player ' + winningPlayer.name + ' wins !!');
    });

    let roundEnd = true;

    each(this.game.roundBets, (roundBet) => {
      if (roundBet !== 0) {
        roundEnd = false;
      }
    });

    if (roundEnd === false) {
      this.checkForWinner();
    }
  }

  checkForBankrupt() {
    each(this.players, (player, idx) => {
      if (player.chips === 0) {
        this.losers.push(player);
        console.log('player ' + player.name + ' is going bankrupt');
        this.players.splice(idx, 1);
      }
    });
  }

  checkForAllInPlayer(winners) {
    let allInPlayer = [];
    each(winners, (idx) => {
      let player = this.getPlayerByIndex(idx);
      if (player.allIn === true) {
        allInPlayer.push(idx);
      }
    });
    return allInPlayer;
  }

}
