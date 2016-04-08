/**
 * interactive-comm-book - Device RCCar
 * https://github.com/odentools/interactive-comm-book
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

var WebSocket = require('ws'),
	simplayer = require('simplayer'),
	serialport = require('serialport'),
	helper = require(__dirname + '/../../scripts/helper');

// TODO なんか落ちるからなんとかする


// 環境変数の確認 - コントロールサーバ
if (process.env.CONTROL_SERVER_HOST == null) {
	throw new Error('CONTROL_SERVER_HOST was not defined as Environment Variable.');
}
var controlServerHost = process.env.CONTROL_SERVER_HOST;

// 環境変数の確認 - Arduinoのシリアルポート
if (process.env.ARDUINO_SERIAL_PORT == null) {
	throw new Error('ARDUINO_SERIAL_PORT was not defined as Environment Variable.');
}

// MACアドレスを取得しデバイスIDとして設定
var deviceId = helper.getMACAddress();
if (deviceId == null) deviceId = 'UNKNOWN-' + new Date().getTime();

// Arduinoへ接続
var serialPort = new serialport.SerialPort(process.env.ARDUINO_SERIAL_PORT, {
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: false,
	parser: serialport.parsers.readline('\n')
});

// サーバへ接続
var ws = new WebSocket(controlServerHost + '/ws/rccar/' + deviceId);
ws.on('open', function () {
	console.log('Connected to ' + controlServerHost);
});

ws.on('close', function() {
	console.log('Connection was closed');
});

ws.on('message', function (data, flags) {

	var cmd = data.cmd || null;
	if (cmd == null) return;

	// 値の変換
	var value = null;
	if (data.value != null) {
		if (helper.isType('Number', data.value)) {
			value = data.value.toString();
		} else if (helper.isType('Boolean', data.value)) {
			if (data.value) {
				value = 'true';
			} else {
				value = 'false';
			}
		} else {
			value = data.value;
		}
	}

	// コマンド別の処理
	if (cmd == 'turnOffPower') {
		// デバイスのシャットダウン
		var execSync = require('child_process').execSync;
		var res = execSync('sudo halt').toString();
		self.sendResponseToServer(cmd, res);
	} else if (cmd == 'playSound') {
		// 音楽ファイルの再生
		var file_name = value.replace(/^[a-zA-Z_\-]/, '');
		simplayer(__dirname + '/sounds/' + file_name + '.mp3');
	} else if (cmd == 'setMotorPower') {
		// モータパワーの設定
		sendToArduino(cmd, data.valuePowerLeft, data.valuePowerLight);
	} else if (cmd == 'setHeadLight') {
		// ヘッドライトの設定
		sendToArduino(cmd, value);
	} else if (cmd == 'setRearLight') {
		// リアライトの設定
		sendToArduino(cmd, value);
	} else if (cmd == 'setBlinker') {
		// 方向指示器の設定
		sendToArduino(cmd, data.valueLeft, data.valueRight);
	}

});

return;


// ----


/**
 * コマンドに対するレスポンスをサーバへ送信
 * @param  {String} cmd_str サーバから送信されたコマンド文字列
 * @param  {Object} data    データ
 */
function sendResponseToServer(cmd_str, data) {
	/*ws.send(JSON.stringify({
		cmd: 'cmdResponse',
		data: data
	}));*/
}


/**
 * Arduinoへシリアルポート経由によりコマンド送信
 * @param  {Arguments} 可変長引数 (0番目の要素: コマンド名, それ以降の要素: 値文字列)
 */
function sendToArduino() {

	if (arguments.length <= 0) return;

	var args = (arguments.length === 1?[arguments[0]]:Array.apply(null, arguments));
	var cmd_str = args.join(':');

	/*serialPort.write(cmd_str, function(err, results) {

	});*/

}
