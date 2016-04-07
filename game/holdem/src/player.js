import { indexOf } from 'lodash';

export default class Player {
  constructor(table, name, chips) {
    this.table = table;

    this.game = table.game;

    // 玩家名稱
    this.name = name;

    // 遊戲籌碼
    this.chips = chips;

    // 回合制指標
    this.index = null;

    // 卡牌
    this.cards = [];

    // 說話
    this.talked = false;

    // 全下
    this.allIn = false;

    // 蓋牌
    this.folded = false;
  }

  /**
   *
   */
  check() {
    console.log('check', this.name);
  }

  /**
   * 下注
   */
  bet() {
    console.log('bet', this.name);

  }

  /**
   * 蓋牌
   */
  fold() {
    console.log('fold', this.name);

  }

  /**
   * 跟注
   */
  call() {
    console.log('call', this.name);
    const maxBets = this.game.getMaxBets();

    if (this.chips > maxBets) {
      this.chips -= maxBets;
      this.game.bets[this.index] = maxBets;
      this.talked = true;
    } else {
      this.all();
    }
  }

  /**
   * 加注
   */
  raise() {
    console.log('raise', this.name);
  }

  /**
   * 全下
   */
  all() {
    console.log('all', this.name);
  }
}
