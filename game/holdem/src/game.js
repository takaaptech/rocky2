import { max } from 'lodash';

export default class Game {
  constructor(table) {
    this.table = table;
    this.pot = 0;
    this.board = [];
    this.bets = [];
    this.roundBets = [];
  }

  getMaxBets() {
    return max(this.bets);
  }
}
