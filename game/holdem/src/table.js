import { EventEmitter } from 'events';
import Player from './player';
import Game from './game';
import Deck from './deck';
import * as Hand from './hand';
import { ROUND_STATE_DEAL, ROUND_STATE_FLOP, ROUND_STATE_TURN, ROUND_STATE_RIVER, ROUND_STATE_OVER } from './constant';

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

    // 最小買入限制
    this.minBuyIn = minBuyIn;

    // 最大買入限制
    this.maxBuyIn = maxBuyIn;

    // 遊戲中玩家
    this.players = [];

    // 按鈕（發牌）位置
    this.dealer = 0;

    // 當前玩家指標
    this.currentPlayer = 0;

    // 遊戲物件
    this.game = new Game(this);

    // 卡牌物件
    this.deck = new Deck();

    // 牌桌上玩家
    this.playersToAdd = new Map();
  }

  /**
   * 加入玩家
   *
   * @param { string | number } seatNumber - 座位代碼
   * @param { string } name - 玩家名稱
   * @param { number } chips - 籌碼
   * @returns {*}
   */
  addPlayer(seatNumber, name, chips) {
    const seatId = '' + seatNumber;

    if (!/^(10|[1-9])$/.test(seatId)) {
      return { result: false, msg: '座位編號錯誤' }
    }

    if (!/.+/.test(name)) {
      return { result: false, msg: '姓名不能為空值' }
    }

    if (!/^[0-9]*$/.test(chips)) {
      return { result: false, msg: '籌碼只能輸入數字' }
    }

    if (chips > this.maxBuyIn) {
      return { result: false, msg: '攜入籌碼大於最大買入限制' }
    }

    if (chips < this.minBuyIn) {
      return { result: false, msg: '攜入籌碼小於最小買入限制' }
    }

    if (this.playersToAdd.has(seatId)) {
      return { result: false, msg: '座位已被占用' }
    }

    this.playersToAdd.set(seatId, new Player(this, name, chips))

    this.emit('addPlayer', this.playersToAdd.get(seatId));

    if (this.players.length === 0 && this.playersToAdd.size >= this.minPlayers) {
      this.newRound();
    }

    return { result: true };
  }

  /**
   * 初始化牌局
   */
  newRound() {
    // 重設玩家
    this.players = [];
    this.roundState = ROUND_STATE_DEAL;

    // 重新洗牌
    // NOTE: 目前每次都新牌局重新洗牌，不符合實際狀況
    this.deck.reset().shuffle();

    // 初始化遊戲
    this.game.pot = 0;
    this.game.bets = [];
    this.game.roundBets = [];

    // 加入玩家
    this.playersToAdd.forEach((player) => {
      const l = this.players.push(player);
      player.index = l - 1;
    });

    // 派二張手牌
    this.players.forEach((player) => {
      player.cards.push(this.deck.pop());
      player.cards.push(this.deck.pop());
    });

    // 小盲注位置
    let smallBlind = this.dealer + 1;

    if (smallBlind >= this.players.length) {
      smallBlind = 0;
    }

    // 大盲注位置
    let bigBlind = this.dealer + 2;

    if (bigBlind >= this.players.length) {
      bigBlind = bigBlind - this.players.length;
    }

    // 小盲注下注
    this.players[smallBlind].chips -= this.smallBlind;
    this.game.bets[smallBlind] = this.smallBlind;

    // 大盲注下注
    this.players[bigBlind].chips -= this.bigBlind;
    this.game.bets[bigBlind] = this.bigBlind;

    // 當前玩家指標
    let currentPlayer = bigBlind + 1;

    if (currentPlayer >= this.players.length) {
      currentPlayer = 0
    }

    this.currentPlayer = currentPlayer;

    this.emit('newRound', { dealer: this.dealer, smallBlind, bigBlind });
  }

  /**
   * 代理當前玩家行為
   *
   * @param type
   * @param args
   */
  action(type, ...args) {
    const player = this.players[this.currentPlayer];
    const fn = player[type];
    fn.apply(player, args);
    this.progress();
  }

  /**
   * 取得當前玩家
   *
   * @returns {*}
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  /**
   * 遊戲狀態刷新
   */
  progress() {
    if (this.isEndOfRound()) {
      let i;

      for (i = 0; i < this.game.bets.length; i += 1) {
        this.game.pot += parseInt(this.game.bets[i], 10);
        this.game.roundBets[i] += parseInt(this.game.bets[i], 10);
      }

      switch (this.roundState) {
        case ROUND_STATE_DEAL:
          this.roundState = ROUND_STATE_FLOP;
          this.deck.pop();
          for (i = 0; i < 3; i += 1) {
            this.game.board.push(this.deck.pop());
          }
          for (i = 0; i < this.game.bets.length; i += 1) {
            this.game.bets[i] = 0;
          }
          this.players.forEach((player) => {
            player.talked = false;
          });
          break;

        case ROUND_STATE_FLOP:
          this.roundState = ROUND_STATE_TURN;
          this.deck.pop();
          this.game.board.push(this.deck.pop());
          for (i = 0; i < this.game.bets.length; i += 1) {
            this.game.bets[i] = 0;
          }
          this.players.forEach((player) => {
            player.talked = false;
          });
          break;

        case ROUND_STATE_TURN:
          this.roundState = ROUND_STATE_RIVER;
          this.deck.pop();
          this.game.board.push(this.deck.pop());
          for (i = 0; i < this.game.bets.length; i += 1) {
            this.game.bets[i] = 0;
          }
          this.players.forEach((player) => {
            player.talked = false;
          });
          break;

        case ROUND_STATE_RIVER:
          this.roundState = ROUND_STATE_OVER;
          this.game.bets = [];

          this.players.forEach((player) => {
            player.hand = Hand.rankHand(player.cards.concat(this.game.board));
          });

          this.checkForWinner();
          this.checkForBankrupt();
          break;
      }
    }
  }

  isEndOfRound() {
    const maxBets = this.game.getMaxBets();

    let bool, candidate;

    candidate = [];
    bool = true;

    this.players.forEach((player, idx) => {
      if (player.folded === false) {
        if (player.talked === false || this.game.bets[idx] !== maxBets) {
          if (player.allIn === false) {
            candidate.push(idx);
            bool = false;
          }
        }
      }
    });

    const pl = this.players.length;

    let next, n;

    next = this.currentPlayer;
    n = 0;

    if (candidate.length > 0) {
      do {
        next++;
        if (next >= pl) next = 0;
        if (candidate.indexOf(next) >= 0) break;
      } while (++n < pl)
    } else {
      do {
        next++;
        if (next >= pl) next = 0;
        if (this.players[next].folded === false) break;
      } while (++n < pl)
    }

    this.currentPlayer = next;

    return bool;
  }

  checkForWinner() {

  }

  checkForBankrupt() {

  }

}