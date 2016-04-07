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

    this.winners = [];
  }

  /**
   * 加入玩家
   *
   * @param { string | number } seatNumber - 座位代碼
   * @param { string } name - 玩家名稱
   * @param { number } chips - 籌碼
   * @returns {*}
   */
  addPlayer(seatId, name, chips) {
    if (!/^(10|[1-9])$/.test(seatId)) {
      return { result: false, msg: '座位編號錯誤' };
    }

    if (!/.+/.test(name)) {
      return { result: false, msg: '姓名不能為空值' };
    }

    if (!/^[0-9]*$/.test(chips)) {
      return { result: false, msg: '籌碼只能輸入數字' };
    }

    if (chips > this.maxBuyIn) {
      return { result: false, msg: '攜入籌碼大於最大買入限制' };
    }

    if (chips < this.minBuyIn) {
      return { result: false, msg: '攜入籌碼小於最小買入限制' };
    }

    if (this.playersToAdd.has(seatId)) {
      return { result: false, msg: '座位已被占用' };
    }

    this.playersToAdd.set(seatId, new Player(this, name, chips, seatId));

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
    this.game.board = [];

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
      // 將下注移入底池
      for (let i = 0; i < this.game.bets.length; i += 1) {
        let bets = parseInt(this.game.bets[i], 10);
        this.game.pot += bets;

        if (!this.game.roundBets[i]) {
          this.game.roundBets[i] = bets;
        } else {
          this.game.roundBets[i] += bets;
        }

        this.game.bets[i] = 0;
      }


      switch (this.roundState) {
        case ROUND_STATE_DEAL:
          this.roundState = ROUND_STATE_FLOP;
          this.deck.pop();
          for (let i = 0; i < 3; i += 1) {
            this.game.board.push(this.deck.pop());
          }
          this.players.forEach((player) => {
            player.talked = false;
          });
          break;

        case ROUND_STATE_FLOP:
          this.roundState = ROUND_STATE_TURN;
          this.deck.pop();
          this.game.board.push(this.deck.pop());
          this.players.forEach((player) => {
            player.talked = false;
          });
          break;

        case ROUND_STATE_TURN:
          this.roundState = ROUND_STATE_RIVER;
          this.deck.pop();
          this.game.board.push(this.deck.pop());
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
          this.checkNewRound();
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

    console.log(this.game.roundBets)

    this.players.forEach((player) => {
      console.log(player.name, player.chips);
    });


    let winners, maxRank;
    winners = [];
    maxRank = 0.000;

    // 找出贏家指標
    this.players.forEach((player) => {
      if (player.hand.rank === maxRank && player.folded === false) {
        winners.push(player.index);
      }

      if (player.hand.rank > maxRank && player.folded === false) {
        maxRank = player.hand.rank;
        winners = [player.index];
      }
    });

    // 找出全下玩家
    const allInPlayer = winners.filter((idx) => this.players[idx].allIn);

    //  彩池分配計算方式：
    //  1.   有玩家把籌碼全押時，形成主池（main pot）和邊池（side pot）。
    //  主池：全押注的最小金額*人數。
    //  邊池：超過前一位押注金額的其他金額。
    //  2.   全押玩家無勝出時，邊池（side pot）和主池（main pot）皆由牌面最佳獲勝的玩家贏得。
    //  3.   全押玩家有勝出時，主池歸該玩家，而邊池由擁有第二大牌面的玩家贏得。
    //  4.   在幾個玩家全押形成多個邊池時，依全押的順序分配給最佳牌面的玩家，有最大牌面的玩家贏得該玩家全押前所累積的邊池。
    //  5.   若全押之後還有形成其他彩池，該全押玩家無法取得此部份彩池。
    //  6.   無人跟注的邊池（僅有一位玩家下注，其他玩家都蓋牌）將會直接贏得該邊池。

    // 底池彩金運算
    let prize, part, minBets;

    prize = 0;
    part = 0;

    // 記算主池
    if (allInPlayer.length > 0) {
      minBets = this.game.roundBets[winners[0]];
      allInPlayer.forEach((idx) => {
        if (this.game.roundBets[idx] !== 0 && this.game.roundBets[idx] < minBets) {
          minBets = this.game.roundBets[idx];
        }
      });
      part = parseInt(minBets, 10);
    } else {
      console.log(this.game.roundBets);
      part = parseInt(this.game.roundBets[winners[0]], 10);
    }

    for (let l = 0; l < this.game.roundBets.length; l += 1) {
      if (this.game.roundBets[l] > part) {
        prize += part;
        this.game.roundBets[l] -= part;
      } else {
        prize += this.game.roundBets[l];
        this.game.roundBets[l] = 0;
      }
    }

    const winnerPrize = prize / winners.length;

    winners.forEach((idx) => {
      const player = this.players[idx];
      player.chips += winnerPrize;
      if (this.game.roundBets[idx] === 0) {
        player.folded = true;
        this.winners.push({
          playerName: player.name,
          amount: winnerPrize,
          hand: player.hand,
          chips: player.chips
        });
      }
      console.log('player ' + this.players[idx].name + ' wins !!');
    });

    let roundEnd;

    roundEnd = true;

    for (let l = 0; l < this.game.roundBets.length; l += 1) {
      if (this.game.roundBets[l] !== 0) {
        roundEnd = false;
      }
    }

    if (roundEnd === false) {
      this.checkForWinner();
    }
  }

  checkForBankrupt() {
    this.players.forEach((player) => {
      if (player.chips === 0) {
        console.log('player ' + player.name + ' is going bankrupt');
        this.playersToAdd.delete(player.seatId);
      }
    });
  }

  checkNewRound() {
    this.playersToAdd.forEach((player) => player.reset());

    if (this.playersToAdd.size >= this.minPlayers) {
      this.dealer += 1;
      if (this.dealer >= this.players.size) {
        this.dealer = 0;
      }
      this.newRound();
    } else {
      this.dealer = 0;
    }
  }

}