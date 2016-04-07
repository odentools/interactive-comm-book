var url = require('url');

var wsConnections = [];

module.exports = {


	/**
	 * WebSocketで接続されたときに呼び出されるメソッド
	 */
	onWsConnection: function (ws) {

		var self = this;

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

		if ((ws.deviceType != 'rccar' && ws.deviceType != 'user') || ws.deviceId == null) {
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
			if (message.cmd == null) {
				ws.send('Invalid command');
				return;
			}
			if (ws.deviceType == 'rccar') {
				self.onReceiveCommandByRCCar(message.cmd);
			}
			wsConnections.forEach(function (con, i) {
				con.send(JSON.stringify({
					message: message
				}));
			});
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
	 * 全てのラジコンカーへコマンドを送信
	 * @param  {String} cmd コマンド文字列
	 * @param  {String} opt_client_id 対象ラジコンカーのクライアントID (任意)
	 */
	sendCommandToRCCar: function (cmd, opt_client_id) {

		var self = this;

		if (opt_client_id == null) { // 全てのラジコンカーへ送信
			var devices = self.getConnectionsByDeviceType('rccar');
			devices.forEach(function (con, i) {
				self.sendCommandToRCCar(con.clientId);
			});
		} else {
			devices.forEach(function (con, i) {
				if (con.clientId == opt_client_id) {
					self.sendCommandToRCCar(con.clientId);
				}
			});
		}

	},


	/**
	 * ラジコンカーからのコマンド受信時に呼び出されるメソッド
	 * @param  {String} cmd コマンド文字列
	 */
	onReceiveCommandByRCCar: function (cmd) {



	}

};