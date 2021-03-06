var url = require('url'), helper = require(__dirname + '/helper'), randomcolor = require('randomcolor');

// 定数 - ルーレットを回す回数
var ROULETTE_REMAIN_REACH_COUNT_DEFAULT = 5;

// 定数 - 部屋数
var NUM_OF_ROOMS = 10;

// WebSocket接続を管理するための配列
var wsConnections = [];

// ステータス - イベント
var statusEvent = {

	// イベントの開催状態
	isStarted: false,

	// ルーレットを回す残り回数
	roulettRemainReachCount: null,

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
	 * 一定間隔によるステータス更新＆送信の開始
	 */
	startIntervalForStatusesToAllClients: function () {

		var self = module.exports;

		// ユーザデバイス
		setInterval(function () {

			// ユーザのステータス更新
			self.updateUsersStatuses();
			// ユーザデバイスへステータス送信
			self.sendStatusesToUserDevices();

		}, 1000);

		// 管理者デバイス
		setInterval(function () {

			self.sendStatusesToAdminDevices();

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

			var room_id = 0;
			if (ws.deviceId.match(/[d]{3,3}/)) {
				room_id = Math.floor(parseInt(RegExp.$1) / NUM_OF_ROOMS);
			}

			statusUsers[ws.deviceId] = {
				flags: {
					rcCarDeviceId: -1,
					rcCarControllStartedAt: -1
				},
				name: ws.deviceId,
				avatarColor: randomcolor(),
				avatarX: Math.floor(Math.random() * 100),
				avatarRoomId: room_id,
				avatarVelocity: 0,
				avatarAvatarClass: 'fa-male',
				isControllUser: false,
				isJump: false,
				isWalkLeft: false,
				isWalkRight: false,
				statusText: 'こんにちは！'
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

		if (data.cmd == 'setAvatar') {
			// ユーザアバターの更新
			var user_data = data.user;
			var device_id = data.deviceId; // ユーザID

			var new_user_data = statusUsers[ws.deviceId];
			new_user_data.name = user_data.name;
			new_user_data.avatarX = user_data.avatarX;
			new_user_data.avatarVelocity = user_data.avatarVelocity;
			new_user_data.avatarAvatarClass = user_data.avatarAvatarClass;
			new_user_data.isControllUser = user_data.isControllUser;
			new_user_data.isJump = user_data.isJump;
			new_user_data.isWalkLeft = user_data.isWalkLeft;
			new_user_data.isWalkRight = user_data.isWalkRight;
			statusUsers[ws.deviceId] = new_user_data;
			return;

		} else if (data.cmd == 'setStatusText') {
			// ステータス文字列の更新
			statusUsers[ws.deviceId].statusText = data.statusText;
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

			statusEvent.roulettRemainReachCount = ROULETTE_REMAIN_REACH_COUNT_DEFAULT;
			self.logInfo('WsAPI', 'Roulette has started');
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
	 * 必要に応じてユーザのステータスを更新 (ルーレットなど)
	 */
	updateUsersStatuses: function () {

		var self = module.exports;

		// ユーザデバイスを取得
		var user_devices = self.getConnectionsByDeviceType('user');
		var num_of_devices = user_devices.length;

		// ルーレットのリーチユーザを抽選
		var roulett_reached_user_name = null;
		if (1 <= statusEvent.roulettRemainReachCount) {
			roulett_reached_user_name = user_devices[Math.floor(Math.random() * num_of_devices)].deviceId;
			statusEvent.roulettRemainReachCount--;
			self.logInfo('WsAPI/Roulette', 'Reached user: ' + roulett_reached_user_name + '; remaining: ' + statusEvent.roulettRemainReachCount);
		}

		// ユーザのステータスを更新
		user_devices.forEach(function (con, i) {

			var user_name = con.deviceId;

			// ユーザがルーレットのリーチユーザであるか
			var is_roullet_reached_user = (roulett_reached_user_name != null && user_name == roulett_reached_user_name);
			statusUsers[user_name].isRoulletReachedUser = is_roullet_reached_user;

			if (is_roullet_reached_user && statusEvent.roulettRemainReachCount == 0) {
				// 当該ユーザをルーレットの当選者とする
				statusUsers[user_name].isControllUser = true;
				self.logInfo('WsAPI/Roulette', 'Next user is got the controller: ' + user_name);
			} else {
				statusUsers[user_name].isControllUser = false;
			}

		});

	},


	/**
	 * 全てのユーザデバイスへPING送信
	 */
	sendStatusesToUserDevices: function () {

		var self = module.exports;

		// ユーザデバイスを取得
		var user_devices = self.getConnectionsByDeviceType('user');
		var num_of_devices = user_devices.length;

		// ユーザデバイスへステータスを送信
		user_devices.forEach(function (con, i) {

			var user_name = con.deviceId;

			// 送信
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
	sendStatusesToAdminDevices: function () {

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
