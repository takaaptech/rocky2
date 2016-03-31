import { EventEmitter } from 'events';

import Board from './board';
import Deck from './deck';
import Player from './player';
import * as Hand from './hand.js';

const ROUND_STATE_DEAL = "ROUND_STATE_DEAL";
const ROUND_STATE_FLOP = "ROUND_STATE_FLOP";
const ROUND_STATE_TURN = "ROUND_STATE_TURN";
const ROUND_STATE_RIVER = "ROUND_STATE_RIVER";

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

    // 牌局
    this.board = new Board();

    // 牌盒
    this.deck = new Deck();

    this.playersToAdd = new Map();

    this.playersToRemove = [];

    this.players = [];

    this.dealer = 0;

    this.current = 0;

    this.roundState = null;

    this.winners = [];

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

  addPlayer(sid, user, chips) {
    if (this.playersToAdd.has(sid) || chips < this.minBuyIn || chips > this.maxBuyIn) {
      return false;
    }

    const player = new Player(this, user, chips);

    this.playersToAdd.set(sid, player);

    this.emit('addPlayer', player);

    if (this.players.length === 0 && this.playersToAdd.size >= this.minPlayers) {
      this.emit('startGame');
      this.newRound();
    }

    return true;
  }

  newRound() {
    const table = this;

    table.reset();

    var keys = [];

    for (let k of this.playersToAdd.keys()) {
      keys.push(k);
    }

    keys.sort().forEach((key) => this.players.push(this.playersToAdd.get(key)));

    // 小盲注下注
    const sbPos = this.getSmallBlindPos();
    const bbPos = this.getBigBlindPos();

    // 小盲注下注
    this.players[sbPos].setBlind(this.smallBlind);

    // 大盲注下注
    this.players[bbPos].setBlind(this.bigBlind);

    // 玩家
    this.players.forEach((player) => {
      player.push(this.deck.pop());
      player.push(this.deck.pop());
    });

    // 取得目前玩家
    this.current = bbPos + 1;

    this.roundState = ROUND_STATE_DEAL;

    this.emit('newRound');
  }

  getSmallBlindPos() {
    let pos = this.dealer + 1;
    return pos >= this.players.length ? 0 : pos;
  }

  getBigBlindPos() {
    const pos = this.dealer + 2;
    return pos >= this.players.length ? (pos - this.players.length) : (this.dealer + 2);
  }

  getCurrentPlayer() {
    return this.players[this.current];
  }

  reset() {
    this.players = [];
    this.winners = [];
    this.losers = [];
    this.board.reset();
    this.deck.reset();
    this.deck.shuffle();
  }

  action(type, user, ...args) {
    const player = this.getCurrentPlayer();
    player[type].apply(player, args);
    this.emit('action', user, type, args);
  }

  progress() {
    this.emit('progress');

    if (true === this.isEndOfRound()) {
      // 將下注金額移去底池
      this.board.pushBetsToPot();

      switch(this.roundState) {
        case ROUND_STATE_DEAL:
          this.roundState = ROUND_STATE_FLOP;
          this.deck.pop();
          // 出三張公牌
          this.board.push(this.deck.pop());
          this.board.push(this.deck.pop());
          this.board.push(this.deck.pop());
          this.board.bets.clear();
          this.players.forEach((player) => player.setTalk(false));
          break;
        case ROUND_STATE_FLOP:
          this.roundState = ROUND_STATE_TURN;
          this.deck.pop();
          this.board.push(this.deck.pop());
          this.board.bets.clear();
          this.players.forEach((player) => player.setTalk(false));
          break;

        case ROUND_STATE_TURN:
          this.roundState = ROUND_STATE_RIVER;
          this.deck.pop();
          this.board.push(this.deck.pop());
          this.board.bets.clear();
          this.players.forEach((player) => player.setTalk(false));
          break;

        case ROUND_STATE_RIVER:
          this.board.bets.clear();
          this.players.forEach((player) => player.showHandCards());
          this.checkForWinner();
          //this.checkForBankrupt();
          //this.initNewRound();
          break;
      }

      this.emit('turn');

    }
  }


  isEndOfRound() {
    let endOfRound = true;

    let candidate = [];

    this.players.forEach((player, idx) => {
      if (player.isFolded() === false) {
        if (player.isTalked() === false || this.board.bets.get(player) !== this.board.getMaxBet()) {
          if (player.isAllIn() === false) {
            candidate.push(idx);
            endOfRound = false;
          }
        }
      }
    });

    let next = this.current;

    if (candidate.length > 0) {
      while (candidate.indexOf(next) < 0) {
        next++;
        if (next >= this.players.length) next = 0;
      }
      this.current = next;
      //console.log('xxx', next);
    } else {
      while (true) {
        next++;
        if (next >= this.players.length) next = 0;

        if (!this.players[next].isFolded()) {
          break;
        }
      }
      this.current = next;
      //console.log('ooo', next);
    }

    return endOfRound;
  }

  getWinners() {
    return this.winners;
  }

  getLosers() {
    return this.losers;
  }

  initNewRound() {
    //this.dealer += 1;
    //if (this.dealer >= this.players.length) {
    //  this.dealer = 0;
    //}
    //this.players = [];
    //this.game.reset();
    //this.newRound();
  }


  removePlayer(user) {
    //var bool = false;
    //
    //each(this.players, (player) => {
    //  if (player.socketId == user.socketId) {
    //    bool = true;
    //    player.fold();
    //  }
    //});
    //
    //each(this.playersOnSeat, (player, num) => {
    //  if (player.socketId == user.socketId) {
    //    bool = true;
    //    delete this.playersOnSeat[num];
    //  }
    //});
    //
    //if (bool) {
    //  this.emit('removePlayer');
    //}
  }


  checkForWinner() {
    let winners = [];
    let maxRank = 0.000;

    this.players.forEach((player, idx) => {
      if (player.isFolded()) return;

      const rank = player.getHandRank();

      if (rank === maxRank)  winners.push(idx);

      if (rank > maxRank) {
        maxRank = rank;
        winners = [idx];
      }
    });

    // 計算金額
    let part = 0;
    let prize = 0;
    let minBets = 0;

    let allInPlayer = this.checkForAllInPlayer(winners);

    if (allInPlayer.length > 0) {
      minBets = this.board.roundBets.get(this.players[winners[0]]);

      allInPlayer.forEach((idx) => {
        const player = this.players[idx];
        const allInBets = this.board.roundBets.get(player);
        if (allInBets !== 0 && this.board.roundBets.get(player) < minBets) {
          minBets = allInBets;
        }
      });
      part = parseInt(minBets, 10);
    } else {
      part = parseInt(this.board.roundBets.get(this.players[winners[0]]), 10);
    }

    //for (let i = 0; i < this.game.roundBets.length; i += 1) {
    //  if (this.game.roundBets[i] > part) {
    //    prize += part;
    //    this.game.roundBets[i] -= part;
    //  } else {
    //    prize += this.game.roundBets[i];
    //    this.game.roundBets[i] = 0;
    //  }
    //}


    //each(winners, (idx) => {
    //  const winnerPrize = prize / winners.length;
    //  const winningPlayer = this.getPlayerByIndex(idx);
    //  winningPlayer.chips += winnerPrize;
    //  if (this.game.roundBets[idx] === 0) {
    //    winningPlayer.folded = true;
    //    this.winners.push({
    //      name: winningPlayer.name,
    //      amount: winnerPrize,
    //      hand: winningPlayer.hand,
    //      chips: winningPlayer.chips
    //    });
    //  }
    //  console.log('player ' + winningPlayer.name + ' wins !!');
    //});
    //
    //let roundEnd = true;
    //
    //each(this.game.roundBets, (roundBet) => {
    //  if (roundBet !== 0) {
    //    roundEnd = false;
    //  }
    //});
    //
    //if (roundEnd === false) {
    //  this.checkForWinner();
    //}
  }

  checkForAllInPlayer(winners) {
    return winners.filter((idx) => {
      return this.players[idx].isAllIn()
    });
  }

  checkForBankrupt() {
    //each(this.players, (player, idx) => {
    //  if (player.chips === 0) {
    //    this.losers.push(player);
    //    console.log('player ' + player.name + ' is going bankrupt');
    //    this.players.splice(idx, 1);
    //  }
    //});
  }

  x

}
