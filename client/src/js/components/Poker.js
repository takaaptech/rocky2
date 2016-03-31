import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Game } from 'phaser-shim';

import Mock from 'mockjs';

// ---------------------
import { Table } from 'lib/node-poker';

window.test = {};

var table = window.test.table = new Table(50, 100, 4, 10, 100, 1000);

table.AddPlayer('bob', 1000);
table.AddPlayer('jane', 1000);
table.AddPlayer('dylan', 1000);
table.AddPlayer('john', 1000);

table.StartGame();

//table.players[1].Call();
//table.players[2].Call();
//table.players[3].Call();
//table.players[0].Call();
//table.players[1].Call();
//table.players[2].Call();
//table.players[3].Call();
//table.players[0].Call();
//table.players[1].Bet(50);
//table.players[2].Bet(1);
//console.log(table.players[1]);
//console.log(table.players[2]);
//table.players[3].Call();
//table.players[0].Call();
//table.players[1].Call();
//table.players[2].Call();
//table.players[3].Call();
//table.players[0].Call();
//
//console.log(table.game);
//
//table.initNewRound();

// ---------------------

function initSocketService() {
  const params = {
    host: 'pomelo',
    port: 3010,
    log: true
  };

  return new Promise((resolve, reject) => {
    pomelo.init(params, (data) => {
      if (data.error) {
        reject(data.error);
      }
      resolve(data);
    });
  });
}

function authLogin(auth) {
  return new Promise((resolve, reject) => {
    const route = 'connector.authHandler.login';
    pomelo.request(route, auth, (data) => {
      if (data.error) {
        reject(data.error);
      }
      resolve(data);
    });
  });
}

//function test() {
//  return new Promise((resolve, reject) => {
//    const route = 'poker.pokerHandler.send';
//    pomelo.request(route, null, (data) => {
//      console.log('success', data);
//    }, () => {
//      console.log('error')
//    });
//  });
//}

async function login() {
  try {
    await initSocketService();
    await authLogin({username: Mock.Random.first()});
  } catch (err) {
    console.error(err);
  }
}

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.game = null;

    this.board = [];
    this.players = [];

    login();

    // for test

    window.test.app = this;
  }

  componentDidMount() {
    this.game = new Game(800, 600, Phaser.AUTO, this.refs.canvas, {
      preload: this.preload.bind(this),
      create: this.create.bind(this),
      update: this.update.bind(this)
    });

    // for test;
    window.test.game = this.game
  }

  preload() {
    const game = this.game;
    game.load.image('desktop', 'img/desktop.jpg');
    game.load.atlas('poker', 'img/poker.png', 'sprites/poker.json');
  }

  create() {
    const game = this.game;

    this.game.stage.disableVisibilityChange = true;

    game.add.image(0, 0, 'desktop');

    var style = {font: '20px Arial', fill: '#ff0044', align: 'center'};

    this.smallBlindText = game.add.text(0, 0, `小盲注：${table.smallBlind}`, style);
    this.bigBlindText = game.add.text(200, 0, `大盲注：${table.bigBlind}`, style);
    this.minBuyInText = game.add.text(400, 0, `最小買入：${table.minBuyIn}`, style);
    this.maxBuyInText = game.add.text(600, 0, `最大買入：${table.maxBuyIn}`, style);

    this.roundNameText = game.add.text(100, 50, `回合：${table.game.roundName}`, style);

    this.currentPlayerText = game.add.text(300, 50, `輪到：${table.getCurrentPlayer()}`, style);

    this.gameWinnerText = game.add.text(300, 100, '', style);

    for (let i = 0; i < 5; i++) {
      this.board.push(game.add.sprite(150 + (i * 100), 150, 'poker', 'PP.png'));
    }

    for (let i = 0; i < 4; i++) {
      this.players.push({
        playerNameText: game.add.text(50 + (i * 180), 280, 'playerName', style),
        chipsText: game.add.text(50 + (i * 180), 300, 'chips', style),
        isTalkedText: game.add.text(50 + (i * 180), 320, 'isTalked', style),
        isFoldText: game.add.text(50 + (i * 180), 320, 'isFold', style),
        handText: game.add.text(50 + (i * 180), 330, 'hande', style),
        hand_1: game.add.sprite(20 + (i * 180), 400, 'poker', 'PP.png'),
        hand_2: game.add.sprite(100 + (i * 180), 400, 'poker', 'PP.png'),
      });
    }


    //const deck = game.add.sprite(350, 150, 'poker', 'PP.png');
    //deck.inputEnabled = true;
    //
    //deck.events.onInputDown.add(this.onDeckClick, this);
  }

  update() {
    table.game.board.forEach((card, idx) => {
      this.board[idx].frameName = `${card}.png`;
    });

    this.roundNameText.text = `回合：${table.game.roundName}`;

    this.currentPlayerText.text = `輪到：${table.getCurrentPlayer()}`;

    table.players.forEach((player, idx) => {
      this.players[idx].playerNameText.text = player.playerName;
      this.players[idx].chipsText.text = player.chips;
      this.players[idx].isTalkedText.text = `isTalked: ${player.talked}`
      this.players[idx].isFoldText.text = `isTalked: ${player.folded}`
      this.players[idx].hand_1.frameName = `${player.cards[0]}.png`;
      this.players[idx].hand_2.frameName = `${player.cards[1]}.png`;
      this.players[idx].handText.text = (player.hand && player.hand.message) ? player.hand.message : '';
    });

    if(table.gameWinners && table.gameWinners.length > 0) {
      this.gameWinnerText.text = `此局贏家為： ${table.gameWinners.map((winner) => winner.playerName).join(' ')}`;
    }

  }

  onDeckClick() {
    //const game = this.game;
    //
    //if (! this.p1) {
    //  this.p1 = game.add.sprite(100, 150, 'poker');
    //}
    //
    //this.p1.frameName = 'AS.png';
  }

  render() {
    return (
      <div style={{ cursor: 'pointer' }}>
        <div ref="canvas"></div>
      </div>
    )
  }
}
