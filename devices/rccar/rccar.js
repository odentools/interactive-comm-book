/**
 * interactive-comm-book - Device RCCar
 * https://github.com/odentools/interactive-comm-book
 * (C) 2016 - OdenTools; Released under MIT License.
 */

'use strict';

// コネクション切断時の再接続までのミリ秒数
var RECONNECT_DELAY_TIME_MSEC = 3000;

// ----

var WebSocket = require('ws'),
	simplayer = require('simplayer'),
	serialport = require('serialport'),
	execSync = require('child_process').execSync,
	temp = require('temp'),
	helper = require(__dirname + '/../../scripts/helper');

// 環境変数の確認 - コントロールサーバ
if (process.env.CONTROL_SERVER_HOST == null) {
	throw new Error('CONTROL_SERVER_HOST was not defined as Environment Variable.');
}
var controlServerHost = process.env.CONTROL_SERVER_HOST;

// 環境変数の確認 - Arduinoのシリアルポート
if (process.env.ARDUINO_SERIAL_PORT == null) {
	throw new Error('ARDUINO_SERIAL_PORT was not defined as Environment Variable.');
}

// エラー処理
process.on('uncaughtException', function (err) {
	logError('uncaughtException', err.toString());
	restartDaemon();
});

// MACアドレスを取得しデバイスIDとして設定
var deviceId = helper.getMACAddress();
if (deviceId == null) deviceId = 'UNKNOWN-' + new Date().getTime();

// Arduinoへ接続
var serialPort = null;
connectToArduino();

// サーバへ接続
var webSocket = null;
connectToControlServer();

return;


// ----


/**
 * Arduinoのシリアルポートへ接続
 */
function connectToArduino() {

	serialPort = null;

	serialPort = new serialport.SerialPort(process.env.ARDUINO_SERIAL_PORT, {
		baudRate: 9600,
		dataBits: 8,
		parity: 'none',
		stopBits: 1,
		flowControl: false,
		parser: serialport.parsers.readline('\n')
	}, false); // false = ただちに接続しない

	// シリアルポートへ接続
	logDebug('Connecting to Arduino...');
	serialPort.open(function (error) { // 接続失敗時

		if (!error) {
			logDebug('Connected to Arduino :)');
			return;
		}

		// 再接続の実行
		logDebug('Could not connect to Arduino; Reconnecting...');
		setTimeout(connectToArduino, RECONNECT_DELAY_TIME_MSEC);

	});

	// リスナを設定
	serialPort.on('data', function(data) { // シリアルポートからのデータ受信時

		logDebug('onSerialReceive', data);

	});

}


/**
 * コントロールサーバへWebSocketで接続
 * @return {WebSocket} WebSocketのインスタンス
 */
function connectToControlServer() {

	webSocket = null;

	// サーバへ接続
	console.log('Connecting to server...');
	try {
		webSocket = new WebSocket(controlServerHost + '/ws/rccar/' + deviceId);
	} catch (e) {
		console.log('Could not connect to server; Reconnecting...');
		setTimeout(connectToControlServer, RECONNECT_DELAY_TIME_MSEC);

	}

	// リスナを設定
	webSocket.on('open', function () { // 接続成功時

		console.log('Connected to ' + controlServerHost + ' :)');

	});

	webSocket.on('close', function() { // 切断時

		// 再接続の実行
		console.log('Disconnected from server; Reconnecting...');
		setTimeout(connectToControlServer, RECONNECT_DELAY_TIME_MSEC);

	});

	webSocket.on('message', function (message, flags) { // メッセージ受信時

		var data = {};
		try {
			data = JSON.parse(message);
		} catch (e) {
			logWarn('onWsMessage', 'Could not parse message');
			return;
		}
		if (data != null) {
			logDebug('onWsMessage', 'Data = ' + data.toString());
		}

		var cmd = data.cmd || null;
		if (cmd == null) {
			logWarn('onWsMessage', 'Invalid message');
			return;
		}

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
			logDebug('onWsMessage', 'Value = ' + value);
		}

		// コマンド別の処理
		var result = null;
		if (cmd == 'playVoice') {
			// 音声の再生
			setSoundVolume(100);
			result = playVoice(value);
		} else if (cmd == 'playSound') {
			// 音楽ファイルの再生
			setSoundVolume(100);
			var file_name = value.replace(/^[a-zA-Z_\-]/, '');
			simplayer(__dirname + '/sounds/' + file_name + '.mp3');
		} else if (cmd == 'shutdown') {
			// デバイスのシャットダウン
			shutdownDevice();
		} else if (cmd == 'restart') {
			// デーモンのリスタート
			restartDaemon();
		} else if (cmd == 'setMotorPower') {
			// モータパワーの設定
			sendToArduino(cmd, data.left, data.right);
		} else if (cmd == 'setHeadLight') {
			// ヘッドライトの設定
			sendToArduino(cmd, value);
		} else if (cmd == 'setRearLight') {
			// リアライトの設定 (0-255, 0-255, 0-255)
			sendToArduino(cmd, data.red, data.green, data.blue);
		} else if (cmd == 'setBlinker') {
			// 方向指示器の設定
			sendToArduino(cmd, data.left, data.right);
		} else if (cmd == 'setLCD') {
			// 方向指示器の設定
			value = value.replace(/;/, '');
			sendToArduino(cmd, value);
		}

		// サーバへ実行結果を送信
		if (result != null) {
			logDebug('onWsMessage', 'Command executed - ' + cmd + ' - ' + result);
		} else {
			logDebug('onWsMessage', 'Command executed - ' + cmd);
		}

	});

}


/**
 * 合成音声の再生
 * @param  {String} speech_text 再生させる文字列
 * @return {String} コマンド実行結果
 */
function playVoice(speech_text) {

	// 音声を生成
	var tmp_txt_file = temp.path({suffix: '.txt'});
	require('fs').writeFileSync(tmp_txt_file, speech_text, {
		flag: 'w'
	});
	var tmp_wav_file = temp.path({suffix: '.wav'});
	var cmd = 'open_jtalk \
	-x /var/lib/mecab/dic/open-jtalk/naist-jdic \
	-m /usr/share/hts-voice/nitech-jp-atr503-m001/nitech_jp_atr503_m001.htsvoice \
	-ow ' + tmp_wav_file + ' ' + tmp_txt_file;

	var res = null;
	try {
		res = execSync(cmd).toString();
	} catch (e) {
		return e.toString();
	}

	// 再生
	var musicProcess = simplayer(tmp_wav_file, function (error) {
		if (error) {
			logError('playVoice', 'Error: ' + error.toString());
		}
		logDebug('playVoice', 'Completed');
	});

	return res;
}


/**
 * デバイスのシャットダウン
 * @return {String} コマンド実行結果
 */
function shutdownDevice() {

	return execSync('sudo halt').toString();

}


/**
 * サウンド音量の設定
 * amixerコマンドによりサウンドコントロールの音量を設定するメソッド
 * @param volume 音量 (0-100の整数)
 */
function setSoundVolume(volume) {

	if (volume < 0) {
		volume = 0;
	} else if (100 < volume) {
		volume = 100;
	}

	var SOUND_CONTROLS = ['Master', 'Speaker', 'PCM'];
	SOUND_CONTROLS.forEach(function (control_str, i) {
		try {
			execSync('amixer -c 0 sset \'' + control_str + '\' ' + volume + '%');
		} catch (e) {
			logWarn('playVoice', 'Could not change the sound volume for ' + control_str);
		}
	});

}


/**
 * デーモンの再起動
 */
function restartDaemon() {

	helper.restart();

}


/**
 * Arduinoへシリアルポート経由によりコマンド送信
 * @param  {Arguments} 可変長引数 (0番目の要素: コマンド名, それ以降の要素: 値文字列)
 */
function sendToArduino() {

	if (arguments.length <= 0) return;

	var cmd_str = new String();
	for (var i = 0; i < arguments.length; i++) {
		if (0 < cmd_str.length) {
			cmd_str += ':';
		}
		cmd_str += arguments[i] + '';
	}
	cmd_str += ';\n';

	serialPort.write(cmd_str, function(err, results) {

		if (err) {
			logError('sendToArduino', 'Could not sent an command - ' + cmd_str);
		} else {
			logDebug('sendToArduino', 'Sent an command - ' + cmd_str);
		}

	});

}


/**
 * デバッグログを表示してサーバへ送信
 * @param  {String} tag_text タグのテキスト
 * @param  {String} log_text ログのテキスト
 */
function logDebug(tag_text, log_text) {

	console.log('[DEBUG] ' + tag_text + ' / ' + log_text);

	try {
		webSocket.send(JSON.stringify({
			cmd: 'log',
			logType: 'debug',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		}));
	} catch (e) {
		return;
	}

}


/**
 * 情報ログを表示してサーバへ送信
 * @param  {String} tag_text タグのテキスト
 * @param  {String} log_text ログのテキスト
 */
function logInfo(tag_text, log_text) {

	console.log('[INFO] ' + tag_text + ' / ' + log_text);

	try {
		webSocket.send(JSON.stringify({
			cmd: 'log',
			logType: 'info',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		}));
	} catch (e) {
		return;
	}

}


/**
 * 警告ログを表示してサーバへ送信
 * @param  {String} tag_text タグのテキスト
 * @param  {String} log_text ログのテキスト
 */
function logWarn(tag_text, log_text) {

	console.warn('[WARN] ' + tag_text + ' / ' + log_text);

	try {
		webSocket.send(JSON.stringify({
			cmd: 'log',
			logType: 'error',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		}));
	} catch (e) {
		return;
	}

}


/**
 * エラーログを表示してサーバへ送信
 * @param  {String} tag_text タグのテキスト
 * @param  {String} log_text ログのテキスト
 */
function logError(tag_text, log_text) {

	console.error('[ERROR] ' + tag_text + ' / ' + log_text);

	try {
		webSocket.send(JSON.stringify({
			cmd: 'log',
			logType: 'error',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		}));
	} catch (e) {
		return;
	}

}
