import { indexOf } from 'lodash';

export default class Player {
  constructor(table, name, chips) {
    this.table = table;
    this.name = name;
    this.chips = chips;

    this.cards = [];

    this.talked = false;
    this.allIn = false;
    this.folded = false;
  }

  check() {
    console.log('check', this.name);
  }

  bet() {
    console.log('bet', this.name);

  }

  fold() {
    console.log('fold', this.name);

  }

  call() {
    console.log('call', this.name);
    const table = this.table;
    const maxBets = table.game.getMaxBets();
    const idx = table.players.indexOf(this);

    if (this.chips > maxBets) {
      this.chips -= maxBets;
      table.game.bets[idx] = maxBets;
      this.talked = true;
    } else {
      this.all();
    }
  }

  raise() {
    console.log('raise', this.name);

  }

  all() {
    console.log('all', this.name);

  }
}
