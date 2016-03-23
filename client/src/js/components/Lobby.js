import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Game } from 'phaser-shim';

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.game = null;
    this.text = null;
    this.counter = 0;
  }

  test() {
    pomelo.request('connector.entryHandler.entry', (data) => {
      console.log(data);
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
    game.load.image('dog', 'img/dog.png');
  }

  create() {
    const game = this.game;
    var image = game.add.sprite(game.world.centerX, game.world.centerY, 'dog');
    image.anchor.set(0.5);
    image.inputEnabled = true;

    image.events.onInputDown.add(this.onImgClick, this);


    this.text = game.add.text(250, 16, '', { fill: '#ffffff' });
  }

  onImgClick() {
    this.counter++;
    this.text.text = "You clicked " + this.counter + " times!";
  }

  render() {
    return (
      <div>
        <h1>Lobby</h1>
        <div ref="canvas"></div>
        <button onClick={ this.test.bind(this) }>Test connect</button>
      </div>
    )
  }
}
