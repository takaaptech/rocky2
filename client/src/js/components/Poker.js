import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Game } from 'phaser-shim';

import Mock from 'mockjs';

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

function test() {
  return new Promise((resolve, reject) => {
    const route = 'poker.pokerHandler.send';
    pomelo.request(route, null, (data) => {
      console.log('success', data);
    }, () => {
      console.log('error')
    });
  });
}

async function login() {
  try {
    await initSocketService();
    await authLogin({ username: Mock.Random.first() });
  } catch (err) {
    console.error(err);
  }
}

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.game = null;
    login();
  }

  componentDidMount() {
    this.game = new Game(800, 600, Phaser.AUTO, this.refs.canvas, {
      preload: this.preload.bind(this),
      create: this.create.bind(this)
    });
  }

  preload() {
    const game = this.game;
    game.load.image('desktop', 'img/desktop.jpg');
    game.load.atlas('poker', 'img/poker.png', 'sprites/poker.json');
  }

  create() {
    const game = this.game;

    game.add.image(0, 0, 'desktop');

    const deck = game.add.sprite(350, 150, 'poker', 'PP.png');
    deck.inputEnabled = true;

    deck.events.onInputDown.add(this.onDeckClick, this);
  }

  onDeckClick() {
    const game = this.game;

    if (! this.p1) {
      this.p1 = game.add.sprite(100, 150, 'poker', `${this.deck.pop()}.png`);
    }

    this.p1.frameName = `${this.deck.pop()}.png`
  }

  render() {
    return (
      <div style={{ cursor: 'pointer' }}>
        <div ref="canvas"></div>
      </div>
    )
  }
}
