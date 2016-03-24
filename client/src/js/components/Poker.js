import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Game } from 'phaser-shim';

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.game = null;

    pomelo.init({
      host: 'pomelo',
      port: 3010,
      log: true
    }, () => {
      pomelo.request('connector.entryHandler.enter', {
        username: 'Leo',
        rid: '001'
      }, (data) => {
        if (data.error) {
          console.log('error', data);
          return;
        }
        console.log('success')
      });
    });
  }

  test() {
    pomelo.request('poker.pokerHandler.send', { username: 'Leo', rid: '000' }, (data) => {
      console.log('success');
    }, () => {
      console.log('error')
    });
  }

  componentDidMount() {
    this.game = new Game(800, 600, Phaser.AUTO, this.refs.canvas, {
      preload: this.preload.bind(this),
      create: this.create.bind(this)
    });
  }

  preload() {
    const game = this.game;
  }

  create() {
    const game = this.game;
  }

  render() {
    return (
      <div>
        <h1>Poker</h1>
        <button onClick={ this.test.bind(this) }>TT</button>
        <div ref="canvas"></div>
      </div>
    )
  }
}
