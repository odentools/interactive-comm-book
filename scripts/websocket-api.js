var url = require('url'), helper = require(__dirname + '/helper');

// WebSocket接続を管理するための配列
var wsConnections = [];

// ステータス - イベント
var statusEvent = {

	// イベントの開催状態
	isStarted: false,

	// プレゼンテーション
	isSlideForcedPageChange: true,	// 強制的にページ変更するか否か
	slidePageId: 0,					// スライドのページ番号
	slideUrl: null					// スライドPDFのURL

};

// ステータス - ユーザ
var statusUsers = {};

// ----

module.exports = {


	/**
	 * 一定間隔によるPing送信の開始
	 */
	startIntervalForPingToAllClients: function () {

		var self = module.exports;

		// Send to user devices
		setInterval(function () {

			self.sendPingToUserDevices();

		}, 1000);

		// Send to admin devices
		setInterval(function () {

			self.sendPingToAdminDevices();

		}, 500);

	},


	/**
	 * WebSocketでクライアントから新規接続されたときに呼び出されるメソッド
	 */
	onWsConnection: function (ws) {

		var self = module.exports;

		var location = url.parse(ws.upgradeReq.url, true).href;

		// IPアドレスの取得
		console.log(ws.upgradeReq);
		ws.ipAddress = helper.getClientIPAddress(ws.upgradeReq);

		// WebSocket接続時のURLによる接続元端末の識別
		if (location.match(/\/ws\/([a-zA-Z_\-]+)\/(.+)/)) {
			ws.deviceType = RegExp.$1;
			ws.deviceId = RegExp.$2;
			if (ws.deviceId == null || ws.deviceId == 'null') {
				ws.deviceId = ws.ipAddress;
			}
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

		// ユーザデータの初期化
		if (ws.deviceType == 'user') {
			statusUsers[ws.deviceId] = {
				statusText: null,
				flags: {
					rcCarDeviceId: -1,
					rcCarControllStartedAt: -1
				}
			};
		}

		// WebSocket接続の配列へ接続を保存
		wsConnections.push(ws);

		// 接続受け入れ完了
		self.logInfo('WsAPI', 'WebSocket client connected: ' + ws.deviceType + ' (ID: ' + ws.deviceId + ')');

		// 切断時
		ws.on('error', function () {
			self.logInfo('WsAPI', 'WebSocket client disconnected by error: ' + ws.deviceType + ' (ID: ' + ws.deviceId + ')');
			wsConnections = wsConnections.filter(function (conn, i) {
				return (conn === ws) ? false : true;
			});
		});
		ws.on('close', function () {
			self.logInfo('WsAPI', 'WebSocket client disconnected: ' + ws.deviceType + ' (ID: ' + ws.deviceId + ')');
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
				data.sender = ws.deviceType + '/' + ws.deviceId;
				self.sendLogData(data);
				return;
			}

			// コマンドを処理
			if (ws.deviceType == 'rccar') {
				self.onReceiveCommandByRCCar(data, ws);
			} else if (ws.deviceType == 'user') {
				self.onReceiveCommandByUser(data, ws);
			} else if (ws.deviceType == 'admin') {
				self.onReceiveCommandByAdmin(data, ws);
			}

		});

	},


	/**
	 * コマンド受信時に呼び出されるメソッド - ユーザ
	 * @param  {Object} data 受信したデータ
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByUser: function (data, ws) {

		var self = module.exports;

		if (data.cmd == 'updateUserAvatar') {
			// ユーザアバターの更新
			var user_avatar = data.userAvatar;
			var device_id = data.deviceId; // ユーザID
			statusUsers[device_id].avatar = user_avatar;
			return;
		}

		ws.send('Your command is not allowed.');

	},


	/**
	 * コマンド受信時に呼び出されるメソッド - 管理者
	 * @param  {Object} data 受信したデータ
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByAdmin: function (data, ws) {

		var self = module.exports;

		if (data.cmd == 'getDevices') { // デバイスリストの取得

			var mes = new String('Devices:\n');
			wsConnections.forEach(function (con, i) {
				mes += '* ' + i + ' - ' + con.deviceType + '/' + con.deviceId + '\n';
			});
			ws.send(mes);
			return;

		} else if (data.cmd == 'startEvent') { // イベントの開始

			statusEvent.isStarted = true;
			self.logInfo('WsAPI', 'Event has been started');
			return;

		} else if (data.cmd == 'finishEvent') { // イベントの終了

			statusEvent.isStarted = false;
			self.logInfo('WsAPI', 'Event has been finished');
			return;

		} else if (data.cmd == 'spinRoulette') { // ルーレットの開始

			var user_id = self.spinRoulette();
			self.logInfo('WsAPI', 'Roulette has started and chosen user is ' + user_id);
			return;

		} else if (data.cmd == 'setSlideUrl') { // スライドのURL設定

			statusEvent.slidePageId = 1; // ページをリセット
			statusEvent.slideUrl = data.url;

			if (data.url == null || data.url.length == 0) {
				statusEvent.slideUrl = null;
				self.logInfo('WsAPI', 'Set the blank to the slide');
			} else {
				self.logInfo('WsAPI', 'Set an url of the slide to ' + data.url);
			}
			return;

		} else if (data.cmd == 'setSlidePageId') { // スライドのページ設定

			statusEvent.slidePageId = data.pageId;
			self.logInfo('WsAPI', 'Set an id of the slide page to ' + data.pageId);
			return;

		}

		// デバイス向けコマンド
		if (data.cmdDeviceType == '*' || data.cmdDeviceType == 'rccar') {
			var num_of_sent = self.sendCommandToRCCar(data, null);
			ws.send('Sent an command: ' + data.cmd + ' to rccar (' + num_of_sent + ' devices)');
			return;
		}

		ws.send('Could not sent an command to any devices: ' + data.cmd);

	},


	/**
	 * コマンド受信時に呼び出されるメソッド - ラジコンカー
	 * @param  {Object} data 受信したデータ
	 * @param  {WebSocket} ws WebSocket接続のインスタンス
	 */
	onReceiveCommandByRCCar: function (data, ws) {

		var self = module.exports;


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
	 * ルーレットの開始
	 * @return {Integer} ルーレットによって選択されたユーザのID
	 */
	spinRoulette: function() {

		var self = module.exports;

		var user_devices = self.getConnectionsByDeviceType('user');
		var num_of_user = user_devices.length;
		var user_id = null;
		try {
			user_id = user_devices[Math.floor(Math.random() * num_of_user)].deviceId;
		} catch (e) {
			return -1;
		}

		statusUsers[user_id].flags.rcCarDeviceId = 0; // TODO

		return user_id;

	},


	/**
	 * 全てのラジコンカーへコマンドを送信
	 * @param  {Object} data データ
	 * @param  {String} opt_client_id 対象ラジコンカーのクライアントID (任意)
	 * @return 送信先の数
	 */
	sendCommandToRCCar: function (data, opt_client_id) {

		var self = module.exports;

		var num_of_sent = 0;

		if (opt_client_id == null) { // 全てのラジコンカーへ送信
			var devices = self.getConnectionsByDeviceType('rccar');
			devices.forEach(function (con, i) {
				self.sendCommandToRCCar(data, con.deviceId);
				num_of_sent++;
			});
		} else {
			wsConnections.forEach(function (con, i) {
				if (con.deviceId == opt_client_id) {
					con.send(JSON.stringify(data));
					num_of_sent++;
				}
			});
		}

		return num_of_sent;

	},


	/**
	 * 全てのユーザデバイスへPING送信
	 */
	sendPingToUserDevices: function () {

		var self = module.exports;

		// ユーザデバイスへステータスを送信
		var user_devices = self.getConnectionsByDeviceType('user');
		user_devices.forEach(function (con, i) {

			con.send(JSON.stringify({
				cmd: 'status',
				event: statusEvent,
				devices: null, // 送信しない
				users: statusUsers
			}));

		});

	},


	/**
	 * 全ての管理者デバイスへPING送信
	 */
	sendPingToAdminDevices: function () {

		var self = module.exports;

		// 全デバイスの情報を取得
		var all_device_infos = [];
		wsConnections.forEach(function (con, i) {
			all_device_infos.push({
				deviceType: con.deviceType,
				deviceId: con.deviceId,
				ipAddress: con.ipAddress
			});
		});

		// デバイスIDの順にソート
		all_device_infos.sort(function (a,b) {
			return (a.deviceId > b.deviceId) ? 1 : ((b.deviceId > a.deviceId) ? -1 : 0);
		});

		// 管理者デバイスへステータスを送信
		var admin_devs = self.getConnectionsByDeviceType('admin');
		admin_devs.forEach(function (con, i) {

			con.send(JSON.stringify({
				cmd: 'status',
				event: statusEvent,
				devices: all_device_infos,
				users: statusUsers
			}));

		});

	},


	/**
	 * デバッグログを表示して送信
	 * @param  {String} tag_text タグのテキスト
	 * @param  {String} log_text ログのテキスト
	 */
	logDebug: function(tag_text, log_text) {

		var self = module.exports;

		console.log('[DEBUG] System/' + tag_text + ' > ' + log_text);

		self.sendLogData({
			sender: 'System',
			logType: 'debug',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		});

	},


	/**
	 * 情報ログを表示して送信
	 * @param  {String} tag_text タグのテキスト
	 * @param  {String} log_text ログのテキスト
	 */
	logInfo: function(tag_text, log_text) {

		var self = module.exports;

		console.log('[INFO] System/' + tag_text + ' > ' + log_text);

		self.sendLogData({
			sender: 'System',
			logType: 'info',
			logText: log_text,
			logTag: tag_text,
			createdAt: new Date().getTime()
		});

	},


	/**
	 * WebSocketメッセージによるログを各デバイスへ配信
	 * @param  {Object} log_data ログデータ (WebSocketメッセージをJSONパースしたもの)
	 */
	sendLogData: function(log_data) {

		var self = module.exports;

		var created_at = new Date(log_data.createdAt) || new Date();

		var text = '[' + log_data.sender + '/' + log_data.logTag + '] ' + log_data.logText
			+ ' (' + created_at.getHours() + ':' + created_at.getMinutes() + ':' + created_at.getSeconds() + ')';

		var con_admins = self.getConnectionsByDeviceType('admin');
		con_admins.forEach(function(con_a, i) {
			try {
				con_a.send(text);
			} catch (e) {
				console.warn('sendLogData - Could not send to ' + con_a.deviceId);
			}
		});

	}

};
