var url = require('url');

var wsConnections = [];

module.exports = {


	/**
	 * WebSocketで接続されたときに呼び出されるメソッド
	 */
	onWsConnection: function (ws) {

		var self = module.exports;

		var location = url.parse(ws.upgradeReq.url, true).href;

		// WebSocket接続時のURLによる接続元端末の識別
		if (location.match(/\/ws\/([a-zA-Z_\-]+)\/(.+)/)) {
			ws.deviceType = RegExp.$1;
			ws.deviceId = RegExp.$2;
		} else {
			console.warn('WebSocket client connected and blocked: Could not detected the device type');
			ws.close();
			return;
		}

		if ((ws.deviceType != 'rccar' && ws.deviceType != 'user' && ws.deviceType != 'admin') || ws.deviceId == null) {
			console.warn('WebSocket client connected and blocked: %s (ID: %s)', ws.deviceType, ws.deviceId);
			ws.close();
			return;
		}

		console.info('WebSocket client connected: %s (ID: %s)', ws.deviceType, ws.deviceId);

		// 配列へ接続を保存
		wsConnections.push(ws);

		// 切断時
		ws.on('close', function () {
			wsConnections = wsConnections.filter(function (conn, i) {
				return (conn === ws) ? false : true;
			});
		});

		// メッセージ受信時
		ws.on('message', function (message) {

			console.log('Received message:', message, 'from', ws.deviceType);

			var data = {};
			try {
				data = JSON.parse(message);
			} catch (e) {
				return;
			}

			if (data.cmd == null) {
				ws.send('Invalid message');
				return;
			}

			if (data.cmd == 'log') {
				// ログ送信
				self.sendLogData(data);
				return;
			}

			// コマンドを処理
			if (ws.deviceType == 'rccar') {
				self.onReceiveCommandByRCCar(data.cmd, ws);
			} else if (ws.deviceType == 'user') {
				self.onReceiveCommandByUser(data.cmd, ws);
			} else if (ws.deviceType == 'admin') {
				self.onReceiveCommandByAdmin(data.cmd, ws);
			}

		});

	},


	/**
	 * 指定したデバイスタイプの接続を取得
	 * @param  {String} device_type デバイスタイプ
	 * @return {Array}             WebSocket接続の配列
	 */
	getConnectionsByDeviceType: function (device_type) {

		var items = [];

		wsConnections.forEach(function (con, i) {
			if (con.deviceType == device_type) {
				items.push(con);
			}
		});

		return items;

	},


	/**
	 * ユーザからのコマンド受信時に呼び出されるメソッド
	 * @param  {String} cmd コマンド文字列
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByUser: function (cmd, ws) {

		var self = module.exports;

		ws.send('Your command is not allowed.');

	},


	/**
	 * 管理者からのコマンド受信時に呼び出されるメソッド
	 * @param  {String} cmd コマンド文字列
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByAdmin: function (cmd, ws) {

		var self = module.exports;

		var num_of_sent = self.sendCommandToRCCar(cmd, null);

		ws.send('Sent an command: ' + cmd + ' to ' + num_of_sent + ' devices');

	},


	/**
	 * 全てのラジコンカーへコマンドを送信
	 * @param  {String} cmd コマンド文字列
	 * @param  {String} opt_client_id 対象ラジコンカーのクライアントID (任意)
	 * @return 送信先の数
	 */
	sendCommandToRCCar: function (cmd, opt_client_id) {

		var self = module.exports;

		var num_of_sent = 0;

		if (opt_client_id == null) { // 全てのラジコンカーへ送信
			var devices = self.getConnectionsByDeviceType('rccar');
			devices.forEach(function (con, i) {
				self.sendCommandToRCCar(cmd, con.deviceId);
				num_of_sent++;
			});
		} else {
			wsConnections.forEach(function (con, i) {
				if (con.deviceId == opt_client_id) {
					con.send(JSON.stringify({
						cmd: cmd
					}));
					num_of_sent++;
				}
			});
		}

		return num_of_sent;

	},


	/**
	 * 全ての管理者へログを送信
	 * @param  {String} log_text ログ文字列
	 * @param  {String} opt_client_id 対象のクライアントID (任意)
	 * @return 送信先の数
	 */
	sendLogToAdmin: function (log_text, opt_client_id) {

		var self = module.exports;

		var num_of_sent = 0;
		var now = new Date().getTime();

		if (opt_client_id == null) {
			var devices = self.getConnectionsByDeviceType('admin');
			devices.forEach(function (con, i) {
				self.sendLogToAdmin(log_text, con.deviceId);
				num_of_sent++;
			});
		} else {
			wsConnections.forEach(function (con, i) {
				if (con.deviceId == opt_client_id) {
					con.send(JSON.stringify({
						logText: log_text,
						createdAt: now
					}));
					num_of_sent++;
				}
			});
		}

		return num_of_sent;

	},


	/**
	 * ラジコンカーからのコマンド受信時に呼び出されるメソッド
	 * @param  {String} cmd コマンド文字列
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByRCCar: function (cmd, ws) {

		var self = module.exports;


	},


	/**
	 * WebSocketメッセージによるログを各デバイスへ配信
	 * @param  {Object} ws_data ログデータのWebSocketメッセージをJSONパースしたもの
	 */
	sendLogData: function(ws_data) {

		var self = module.exports;

		var con_users = self.getConnectionsByDeviceType('user');
		con_users.forEach(function(con_u, i) {
			try {
				console.log('sendLogData - Send to ' + con_u.deviceId);
				con_u.send('Log: [' + ws_data.logType + '/' + ws_data.logTag + '] ' + ws_data.logText);
			} catch (e) {
				console.log('sendLogData - Could not send to ' + con_u.deviceId);
			}
		});
		var con_admins = self.getConnectionsByDeviceType('admin');
		con_admins.forEach(function(con_a, i) {
			try {
				console.log('sendLogData - Send to ' + con_a.deviceId);
				con_a.send('Log: [' + ws_data.logType + '/' + ws_data.logTag + '] ' + ws_data.logText);
			} catch (e) {
				console.log('sendLogData - Could not send to ' + con_a.deviceId);
			}
		});

	}

};
