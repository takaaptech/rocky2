import Table from 'table';

const table = new Table(100, 200, 4, 10, 500, 1000);

//table.on('addPlayer', (player) => console.log(player));
table.on('newRound', (data) => console.log('newRound', data));

table.addPlayer('1', '高進', 1000)
table.addPlayer('2', '陳小刀', 1000)
table.addPlayer('3', '左頌星', 1000)
table.addPlayer('4', '今晚打老虎', 1000)

window.test = { table };

table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
table.action('call');
//table.action('call');

