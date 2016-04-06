import { EventEmitter } from 'events';
import Player from './player';
import Game from './game';
import Deck from './deck';
import * as Hand from './hand';

const ROUND_STATE_DEAL = 'ROUND_STATE_DEAL';
const ROUND_STATE_FLOP = 'ROUND_STATE_FLOP';
const ROUND_STATE_TURN = 'ROUND_STATE_TURN';
const ROUND_STATE_RIVER = 'ROUND_STATE_RIVER';
const ROUND_STATE_OVER = 'ROUND_STATE_OVER';

export default class Table extends EventEmitter {
  constructor(smallBlind, bigBlind, minPlayers, maxPlayers, minBuyIn, maxBuyIn) {
    super();
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.minPlayers = minPlayers;
    this.maxPlayers = maxPlayers;
    this.minBuyIn = minBuyIn;
    this.maxBuyIn = maxBuyIn;

    this.playersToAdd = new Map();
    this.players = [];

    this.game = new Game(this);

    this.deck = new Deck();

    this.dealer = 0;

    this.currentPlayer = 0;
  }

  addPlayer(seatNumber, name, chips) {
    const seatId = `_SEAT:${seatNumber}_`;

    if (!/^(10|[1-9])$/.test(seatNumber)) {
      return { result: false, msg: '座位編號錯誤' }
    }

    if (!/.+/.test(name)) {
      return { result: false, msg: '姓名不能為空值' }
    }

    if (!/^[0-9]*$/.test(chips)) {
      return { result: false, msg: '籌碼只能輸入數字' }
    }

    if (this.playersToAdd.has(seatId)) {
      return { result: false, msg: '座位已被占用' }
    }

    if (chips > this.maxBuyIn) {
      return { result: false, msg: '攜入籌碼大於最大買入限制' }
    }

    if (chips < this.minBuyIn) {
      return { result: false, msg: '攜入籌碼小於最小買入限制' }
    }

    this.playersToAdd.set(seatId, new Player(this, name, chips))

    this.emit('addPlayer', this.playersToAdd.get(seatId));

    if (this.players.length === 0 && this.playersToAdd.size >= this.minPlayers) {
      this.newRound();
    }

    return { result: true };
  }

  newRound() {
    this.reset();

    // 加入玩家
    this.playersToAdd.forEach((player) => {
      this.players.push(player)
    });

    // 派二張手牌
    this.players.forEach((player) => {
      player.cards.push(this.deck.pop());
      player.cards.push(this.deck.pop());
    });

    // 大小盲注位置
    let smallBlind = this.dealer + 1;

    if (smallBlind >= this.players.length) {
      smallBlind = 0;
    }

    let bigBlind = this.dealer + 2;

    if (bigBlind >= this.players.length) {
      bigBlind = bigBlind - this.players.length;
    }

    // 小盲注
    this.players[smallBlind].chips -= this.smallBlind;
    this.game.bets[smallBlind] = this.smallBlind;

    // 大盲注
    this.players[bigBlind].chips -= this.bigBlind;
    this.game.bets[bigBlind] = this.bigBlind;

    let currentPlayer = bigBlind + 1;

    if (currentPlayer >= this.players.length) {
      currentPlayer = 0
    }

    this.currentPlayer = currentPlayer;

    this.emit('newRound', { dealer: this.dealer, smallBlind, bigBlind });
  }

  // 過牌： check
  // 下注： bet
  // 蓋牌： fold
  // 跟注： call
  // 加注： raise
  // 全下： all
  action(type, ...args) {
    const player = this.players[this.currentPlayer];
    const fn = player[type];
    fn.apply(player, args);

    this.progress();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  reset() {
    // 重設玩家
    this.players = [];
    this.roundState = ROUND_STATE_DEAL;

    // 重新洗牌
    this.deck.reset().shuffle();

    //
    this.game.pot = 0;
    this.game.bets = [];
    this.game.roundBets = [];
  }

  progress() {
    console.log('process');

    if (this.isEndOfRound()) {
      let i;

      for (i = 0; i < this.game.bets.length; i += 1) {
        this.game.pot += parseInt(this.game.bets[i], 10);
        this.game.roundBets[i] += parseInt(this.game.bets[i], 10);
      }

      console.log(this.roundState);

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

          //checkForWinner(table);
          //checkForBankrupt(table);
          break;
      }
    }

    this.emit('process');
  }

  isEndOfRound() {
    const maxBets = this.game.getMaxBets();
    const candicate = [];

    let bool = true;

    this.players.forEach((player, idx) => {
      if (player.folded === false) {
        if (player.talked === false || this.game.bets[idx] !== maxBets) {
          if (player.allIn === false) {
            candicate.push(idx);
            bool = false;
          }
        }
      }
    });

    const pl = this.players.length;

    let next = this.currentPlayer;
    let n = 0;

    if (candicate.length > 0) {
      do {
        next++;
        if (next >= pl) next = 0;

        if (candicate.indexOf(next) >= 0) {
          break;
        }
      } while (++n < pl)
    } else {
      do {
        next++;
        if (next >= pl) next = 0;

        if (this.players[next].folded === false) {
          break;
        }
      } while (++n < pl)
    }

    this.currentPlayer = next;

    return bool;
  }


}