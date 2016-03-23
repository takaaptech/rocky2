import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Game } from 'phaser-shim';

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.game = null;
    pomelo.init({ host: 'pomelo', port: 3010, log: true });
  }

  //test() {
  //  pomelo.request('connector.entryHandler.entry', (data) => {
  //    console.log(data);
  //  });
  //}

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
        <div ref="canvas"></div>
      </div>
    )
  }
}
