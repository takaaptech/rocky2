import Table from './table';

const table = new Table(50, 100, 4, 10, 200, 10000);

window.test = {};
test.table = table;

table.on('startGame', () => {
  console.log('牌局開始');
});

table.on('addPlayer', (player) => {
  console.log(`玩家 "${player.name}" 加入牌桌`);
});

table.on('removePlayer', () => {
  console.log(`玩家離開牌桌`);
});

table.on('newRound', () => {
  console.log('開始新的回合');
});

table.on('action', (user, type, args) => {
  console.log(`${user.name} 執行 ${type}`, args);
});

table.on('progress', () => {
  console.log('progress', table.roundState);
});

table.on('turn', () => {
  console.log('turn', table.roundState);
});


table.on('gameOver', () => {
  console.log('牌局結束');
});

// 遊戲流程測試
// NOTE: 籌碼未來的接資料庫該如何接？
var user_1 = { uid: 'a', name: '高進', chips: 1000 };
var user_2 = { uid: 'b', name: '陳小刀', chips: 1000 };
var user_3 = { uid: 'c', name: '仇笑癡', chips: 1000 };
var user_4 = { uid: 'd', name: '陳金城', chips: 1000 };

var player = null;

// 座位編號、攜入籌碼與籌碼檢查
table.addPlayer('3', user_3, 500);
table.addPlayer('1', user_1, 500);
table.addPlayer('4', user_4, 500);
table.addPlayer('2', user_2, 500);

table.players.forEach((player, idx) => {
  console.log(`玩家順序 ${idx + 1} : ${player.name}`);
});

player = table.getCurrentPlayer();
console.log(`${player.name} 準備下注`);

if (player.user.uid == user_4.uid) {
  table.action('call', user_4);
}

player = table.getCurrentPlayer();
console.log(`${player.name} 準備下注`);

if (player.user.uid == user_1.uid) {
  table.action('fold', user_1);
}

player = table.getCurrentPlayer();
console.log(`${player.name} 準備下注`);

if (player.user.uid == user_2.uid) {
  table.action('fold', user_2);
}

player = table.getCurrentPlayer();
console.log(`${player.name} 準備下注`);

if (player.user.uid == user_3.uid) {
  table.action('fold', user_3);
}

player = table.getCurrentPlayer();
console.log(`${player.name} 準備下注`);

if (player.user.uid == user_4.uid) {
  table.action('check', user_4);
}

if (player.user.uid == user_4.uid) {
  table.action('check', user_4);
}
