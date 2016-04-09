/**
 * interactive-comm-book - Developer Tool
 * https://github.com/odentools/interactive-comm-book
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

var WebSocket = require('ws'), helper = require(__dirname + '/scripts/helper');

// 必須パラメータの読み取り
var host = process.argv[2] || null;
var cmdName = process.argv[3] || null;
if (host == null || cmdName == null) {
	showHelp();
	return;
}

// オプションパラメータの読み取り
var options = {};
for (var i = 4, l = process.argv.length; i < l; i++) {
	if (process.argv[i].match(/^([a-zA-Z0-9-_]+)=(.+)$/)) {
		options[RegExp.$1] = RegExp.$2;
	} else if (process.argv[i].match(/^([a-zA-Z0-9-_]+)$/)) {
		options[RegExp.$1] = true;
	}
}

// モード
if (options.help) {
	showHelp();
}

// サーバへ接続
var webSocket = null;
if (!host.match(/^(ws|wss):\/\//)) {
	host = 'ws://' + host;
}
console.log('Connecting to server... ' + host);
try {
	webSocket = new WebSocket(host + '/ws/admin/' + helper.getMACAddress());
} catch (e) {
	throw new Error('Could not connect to server.');
}

// リスナを設定
webSocket.on('open', function () { // 接続成功時

	console.log('Connected :)\n');

	// コマンドデータを生成
	var data = {
		cmd: cmdName
	};
	for (var opt_name in options) {
		var v = options[opt_name];
		if (v == 'true') {
			data[opt_name] = true;
		} else if (v == 'false') {
			data[opt_name] = false;
		} else if (v.match(/^[0-9]+$/)) {
			data[opt_name] = parseInt(v);
		} else {
			data[opt_name] = v;
		}
	}

	// コマンドを送信
	var json = JSON.stringify(data);
	console.log('Sending command - ' + json);
	webSocket.send(json);
	console.log('Okay; Your command has been sent :)\n');

	// メッセージが返るかもしれないので待機
	setTimeout(function() {
		webSocket.close();
	}, 5000);

});

webSocket.on('close', function() { // 切断時

	console.log('Disconnected from server.');
	process.exit(0);

});

webSocket.on('message', function (message, flags) { // メッセージ受信時

	console.log('Received - ', message + '\n');

});

// ----

function showHelp() {

	var program_name = process.argv[0] + ' util.js';
	console.log(program_name + ' SERVER_HOST COMMAND_NAME [OPTION_NAME=OPTION_VALUE ...]\n\n\
SERVER_HOST:\n\
	Schema and host name of the control server.\n\
	e.g. example.com\n\
	e.g. wss://example.com\n\
\n\
COMMAND_NAME:\n\
	Name of command\n\
	e.g. setHeadLight\n\
\n\
OPTION_NAME:\n\
	Name of option\n\
	e.g. red\n\
OPTION_VALUE:\n\
	Value of option\n\
	e.g. 255\n\
\n');

}
