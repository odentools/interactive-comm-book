/**
 * interactive-comm-book - Developer Tool
 * https://github.com/odentools/interactive-comm-book
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

var WebSocket = require('ws'), helper = require(__dirname + '/scripts/helper');

// 必須パラメータの読み取り
var host = process.argv[2] || null;
if (host == null) {
	showHelp();
	return;
}

// オプションパラメータの読み取り
var cmdName = process.argv[3] || null; // cmdNameが未指定ならばコンソールモード
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

options._isInteractiveMode = (cmdName == null); // インタラクティブモード
options._previousCmdData = null; // インタラクティブモードの前回送信コマンド

// サーバへ接続
var webSocket = null;
if (!host.match(/^(ws|wss):\/\//)) {
	host = 'ws://' + host;
}

init();
return;


// ----


/**
 * 初期化
 */
function init() {

	console.log('[INFO] Connecting to server... ' + host);
	webSocket = null;
	try {
		webSocket = new WebSocket(host + '/ws/admin/' + helper.getMACAddress());
	} catch (e) {
		throw new Error('[ERROR] Could not connect to server.');
	}

	// リスナを設定
	webSocket.on('open', function () { // 接続成功時

		console.log('[INFO] Connected :)\n');

		if (options._isInteractiveMode) { // インタラクティブモードならば

			var buffer = new String();

			console.log('----------  Plese type commands  ----------\n\n\
Basical Usage:\n\
* Format: [DEVICE_TYPE] COMMAND_NAME [OPTION_NAME=OPTION_VALUE ...]\n\
* Example: rccar playVoice value="Test"\n\n\
Special Features:\n\
* To quit the console, please type just "exit".\n\
* To retry the previous command, please type just "re".\n\n\
------------------------------------------------------------\n\n');

			process.stdin.resume();
			process.stdin.setEncoding('utf8');

			process.stdin.on('data', function (chunk) {
				onInputInteractiveConsole(chunk);
			});

			process.stdin.on('end', function () {

			});

		} else {

			// コマンドを送信
			sendCommand('*', null, cmdName, options);

			// メッセージが返るかもしれないので待機
			setTimeout(function() {
				webSocket.close();
			}, 5000);

		}

	});

	webSocket.on('close', function() { // 切断時

		if (options._isInteractiveMode) {
			console.log('[INFO] Disconnected from server; Re connecting...\n');
			init();
			return;
		}

		console.log('[INFO] Disconnected from server.');
		process.exit(0);

	});

	webSocket.on('message', function (message, flags) { // メッセージ受信時

		console.log('[INFO] Received - ', message + '\n');

	});

}


/**
 * コマンドの送信
 * @param  {String} opt_device_type   目的のデバイス種別 (e.g. "rccar")
 * @param  {String} opt_device_id     目的のデバイスID
 * @param  {String} cmd_name          コマンド名 (e.g. "playVoice")
 * @param  {Object} options           コマンドオプションの連想配列
 * @return {Object} 送信されたコマンドデータ
 */
function sendCommand(opt_device_type, opt_device_id, cmd_name, options) {

	// コマンドデータを生成
	var data = {
		cmd: cmd_name,
		cmdDeviceType: opt_device_type || '*',
		cmdDeviceId: opt_device_id || null
	};
	for (var opt_name in options) {
		if (opt_name.match(/^_.*/)) continue;
		var v = options[opt_name];
		if (v == 'true') {
			data[opt_name] = true;
		} else if (v == 'false') {
			data[opt_name] = false;
		} else {
			data[opt_name] = v;
		}
	}

	// コマンドを送信
	var json = JSON.stringify(data);
	console.log('[INFO] Sending command - ' + json);
	webSocket.send(json);
	console.log('[INFO] Okay; Your command has been sent :)\n\n');

	return data;

}


/**
 * インタラクティブモードのコンソールでコマンドが入力されたときに呼び出されるメソッド
 * @param  {String} chunk 文字列
 */
function onInputInteractiveConsole(chunk) {
	if (chunk.match(/^exit(\n|\n\r|)$/)) {

		// インタラクティブモードの終了
		options._isInteractiveMode = false;
		console.log('Connection closing...');
		webSocket.close();
		process.exit();

	} else if (chunk.match(/^re(\n|\n\r|)$/)) {

		if (options._previousCmdData == null) {
			console.warn('[WARN] Previous command is not exists.');
			return;
		}

		// コマンドを再送信
		sendCommand(options._previousCmdData.deviceType, options._previousCmdData.deviceId, options._previousCmdData.cmd, options._previousCmdData);


	} else if (chunk.match(/^([\*a-zA-Z0-9]+ |)([a-zA-Z0-9]+) ([\s\S]*)$/)) {

		// 入力されたコマンドをパース
		var device_type = RegExp.$1 || null;
		var cmd_options_arr = RegExp.$3;
		var cmd_name = RegExp.$2;
		if (device_type != null) {
			device_type = device_type.replace(/^\ /, '');
			device_type = device_type.replace(/\ $/, '');
		}
		cmd_options_arr = cmd_options_arr.split(/ /);
		var cmd_options = {};
		for (var i = 0, l = cmd_options_arr.length; i < l; i++) {
			var d = cmd_options_arr[i].split(/=/);
			var key = d[0], value = d[1];
			if (value == null) {
				value = true;
			} else {
				value = value.replace(/[\"\n]+$/, '');
				value = value.replace(/^\"/, '');
			}
			cmd_options[key] = value;
		}

		// コマンドを送信
		options._previousCmdData = sendCommand(device_type, null, cmd_name, cmd_options);

	} else {

		chunk = chunk.replace(/\n$/, '');
		console.warn('[WARN] Invalid input: << ' + chunk + ' >>\n');

	}
}


/**
 * ヘルプの表示
 */
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
