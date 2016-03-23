import 'pomelo';
import { Game } from 'phaser-shim';

const game = new Game(800, 600);

var host = "pomelo";
var port = "3010";

pomelo.init({ host: host, port: port, log: true }, () => {
  pomelo.request("connector.entryHandler.entry", "hello pomelo", function(data) {
    alert(data.msg);
  });
});
