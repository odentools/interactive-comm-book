/**
 * Main Script of Frontend Application for User
 */

'use strict';

angular.module('MyApp', ['ngRoute', 'ngWebSocket', 'PageTurner'])

.config(['$routeProvider', function($routeProvider) {

	// ルートプロバイダの設定
	$routeProvider
		.when('/', {
			controller: 'CoverPageCtrl',
			templateUrl: '/pages-user/cover.html'
		})
		.when('/book/:userName', {
			controller: 'ContentPageCtrl',
			templateUrl: '/pages-user/content.html'
		})
		.when('/test/:pageId', {
			controller: 'TestCtrl',
			templateUrl: '/pages-user/test.html'
		})
		.otherwise({
			redirectTo: '/'
		})
	;

}])


// ユーザ用 WebSocket API との通信用ファクトリー
.factory('WsUserAPI', function($websocket, $window, $rootScope, $timeout, $log) {

	var wsDataStream = null, userId = null, status = {};

	var methods = {


		/**
		 * サーバへ接続
		 * @param  {String} user_id ユーザID (サーバ上ではdeviceIdとなる)
		 */
		connect: function(user_id) {

			var self = this;

			if (wsDataStream != null) {
				return wsDataStream;
			}

			userId = user_id;

			// URLスキーマの設定
			var ws_host = new String();
			if ($window.location.port == 443) {
				ws_host = 'wss://' + ws_host;
			} else {
				ws_host = 'ws://' + ws_host;
			}

			// WebSocketサーバへ接続
			try {
				wsDataStream = $websocket(ws_host + $window.location.host + '/ws/user/' + user_id);
			} catch (e) {
				$log.error(e);
				// 再接続
				$timeout(function() {
					wsDataStream = null;
					self.connect(userId);
				}, 500);
				return;
			}

			// イベントハンドラの設定

			wsDataStream.onClose(function () { // 切断時
				// 再接続
				$timeout(function() {
					wsDataStream = null;
					self.connect(userId);
				}, 500);
			});

			wsDataStream.onMessage(function (msg) { // メッセージ受信時

				var data = {};
				try {
					data = JSON.parse(msg.data);
				} catch (e) {
					$log.debug('onMessage', msg.data);
					return;
				}

				if (data.cmd == 'status') { // 開催されたイベントのステータス

					// ステータスを保存
					status.devices = data.devices;
					status.event = data.event;
					status.users = data.users;

					// ブロードキャスト
					$rootScope.$broadcast('STATUS_UPDATED', status);

				}

			}, {
				autoApply: false
			});

		},


		/**
		 * コマンドの送信
		 * @param  {String} opt_device_type   目的のデバイス種別 (e.g. "rccar")
		 * @param  {String} opt_device_id     目的のデバイスID
		 * @param  {String} cmd_name          コマンド名 (e.g. "playVoice")
		 * @param  {Object} options           コマンドオプションの連想配列
		 */
		sendCommand: function (opt_device_type, opt_device_id, cmd_name, options) {

			if (!wsDataStream) return;

			options.cmd = cmd_name;
			options.deviceType = opt_device_type || '*';
			options.deviceId = opt_device_id || null;

			wsDataStream.send(JSON.stringify(options));
			$log.debug('sendCommand', options);

		},


		/**
		 * 取得済みのステータスを返す
		 * @return {Object} ステータス
		 */
		getStatus: function() {
			return status || {};
		}

	};

	return methods;

})


// 表紙ページ用コントローラ
.controller('CoverPageCtrl', ['$scope', '$location', '$window', '$interval', '$rootScope', 'PageTurner', 'WsUserAPI',
function($scope, $location, $window, $interval, $rootScope, PageTurner, WsUserAPI) {

	// ユーザ名 (学籍番号など)
	$scope.userName = 'mt15a000';

	// ユーザ名のエラー
	$scope.userNameError = null;

	// イベントのステータス
	$scope.eventStatus = {};


	/**
	 * コンテンツの開始
	 * @param  {String} user_name User name (e.g. student number)
	 */
	$scope.startContent = function (user_name) {

		if (user_name == null || !user_name.match(/^[a-z]{2,2}[0-9]{2,2}[a-z][0-9]{3,3}$/)) {
			$scope.userNameError = '半角であなたの学籍番号を入力してください';
			return;
		}
		$scope.userNameError = null;

		// ようこそページへ遷移 (本を開く)
		PageTurner.openPage(1);

		// 未接続ならばサーバへ接続
		WsUserAPI.connect(user_name);

		// イベント開始まで待機
		var promise = $interval(function () {

			if ($scope.eventStatus.isStarted) {
				$interval.cancel(promise);

				// スモールライフへ遷移
				$location.path('/book/' + user_name);

			}

		}, 500);

	};


	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('STATUS_UPDATED', function (event, status) {

		$scope.eventStatus = status.event;

	});

}])


// コンテンツページ用コントローラ
.controller('ContentPageCtrl', ['$scope', '$location', '$routeParams', 'WsUserAPI',
function($scope, $location, $routeParams, WsUserAPI) {

	// ユーザ名 (学籍番号など)
	$scope.userName = $routeParams.userName;
	if ($scope.userName == null) {
		$location.href('/');
		return;
	}

	// WebSocket接続
	WsUserAPI.connect($scope.userName);

	// ページ生成


}])


// チャット用コントローラ
.controller('ChatCtrl', ['$scope', '$timeout', '$interval', function($scope, $timeout, $interval) {

	// チャットデータ
	$scope.chatMessages = [
		{
			userName: '001',
			message: 'うおおおおおおおおおおおおおおおおおおおおおおおおおおおおおお',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '002',
			message: 'こんばんは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '001',
			message: 'こんにちは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '001',
			message: 'うおおおおおおおおおおおおおおおおおおおおおおおおおおおおおお',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '002',
			message: 'こんばんは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '001',
			message: 'こんにちは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '001',
			message: 'うおおおおおおおおおおおおおおおおおおおおおおおおおおおおおお',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '002',
			message: 'こんばんは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		},
		{
			userName: '001',
			message: 'こんにちは',
			createdAt: new Date(2016, 4, 17, 0, 0, 0)
		}
	];

}])


// スモールライフ用コントローラ
.controller('SmallLifeCtrl', ['$scope', '$timeout', '$interval', 'WsUserAPI',
function($scope, $timeout, $interval, WsUserAPI) {

	// ユーザデータ
	$scope.userName = '001';

	// 全ユーザデータ
	$scope.users = {
		'001': {
			name: '001',
			avatarColor: 'red',
			avatarX: 100,
			avatarVelocity: 0,
			avatarAvatarClass: 'fa-male',
			isControllUser: false,
			isJump: false,
			isWalkLeft: false,
			isWalkRight: false,
			message: 'こんにちは！'
		},
		'002': {
			name: '002',
			avatarColor: 'blue',
			avatarX: 300,
			avatarVelocity: 0,
			avatarAvatarClass: 'fa-male',
			isControllUser: false,
			isJump: false,
			isWalkLeft: false,
			isWalkRight: false,
			message: 'こんちくわ！'
		},
		'003': {
			name: '003',
			avatarColor: 'green',
			avatarX: 400,
			avatarVelocity: 0,
			avatarAvatarClass: 'fa-female',
			isControllUser: false,
			isJump: false,
			isWalkLeft: false,
			isWalkRight: false,
			message: 'こんちきちきん'
		}
	};

	// ----


	/**
	 * アバタの移動
	 * @param  {String} direction 方向 - "right", "left"
	 */
	$scope.moveAvatar = function(direction) {
		if (direction == 'left') {
			if (1 <= $scope.users[$scope.userName].avatarVelocity) {
				$scope.users[$scope.userName].avatarVelocity = 0;
			} else {
				$scope.users[$scope.userName].avatarVelocity += -10;
			}
		} else if (direction == 'right') {
			if ($scope.users[$scope.userName].avatarVelocity <= -1) {
				$scope.users[$scope.userName].avatarVelocity = 0;
			} else {
				$scope.users[$scope.userName].avatarVelocity += 10;
			}
		} else if (direction == 'top') {
			$scope.users[$scope.userName].isJump = true;
			$timeout(function () {
				$scope.users[$scope.userName].isJump = false;
			}, 300);
		}
	};


	/**
	 * アバタの停止
	 */
	$scope.stopAvatar = function() {
		$scope.users[$scope.userName].avatarVelocity = 0;
	};


	/**
	 * アバタの描画
	 */
	$scope.drawAvatars = function() {

		for (var user_name in $scope.users) {

			var user = $scope.users[user_name];

			if (user_name == $scope.userName) {
				// アバターの更新
				//WsUserAPI.updateUserAvatar(user);
			}

			if (1 <= user.avatarVelocity) { // 右へ歩行中
				// アニメーション
				if (15 <= user.avatarVelocity) {
					user.isWalkRight = !user.isWalkRight;
				} else { // 低速ならアニメーションしない
					user.isWalkRight = false;
				}
				user.isWalkLeft = false;
				// 速度を変更
				user.avatarVelocity -= user.avatarVelocity / 5;
				// 位置を変更
				user.avatarX += user.avatarVelocity;
				if (user.avatarVelocity < 0) {
					user.avatarVelocity = 0;
				}
			} else if (user.avatarVelocity <= -1) { // 左へ歩行中
				// アニメーション
				if (user.avatarVelocity <= -15) {
					user.isWalkLeft = !user.isWalkLeft;
				} else { // 低速ならアニメーションしない
					user.isWalkLeft = false;
				}
				user.isWalkRight = false;
				// 速度を変更
				user.avatarVelocity += user.avatarVelocity * -1 / 5;
				// 位置を変更
				user.avatarX -= user.avatarVelocity * -1;
				if (user.avatarVelocity > 0) {
					user.avatarVelocity = 0;
				}
			} else { // 移動していないとき
				user.isWalkRight = false;
				user.isWalkLeft = false;
			}

		}

	};


	/**
	 * キーを離した時の処理 (ng-keyup 用)
	 * @param  {Event} e イベント
	 */
	$scope.onKeyUp = function(e) {
		if (e.which == 37 || e.which == 65 || e.which == 39 || e.which == 68) {
			/*$timeout(function() {
				$scope.stopAvatar();
			}, 200);*/
		}
	};


	/**
	 * キーを押した時の処理 (ng-keydown 用)
	 * @param  {Event} e イベント
	 */
	$scope.onKeyDown = function(e) {
		if (e.which == 37 || e.which == 65) { // カーソル左 or Aキー
			$scope.moveAvatar('left');
		} else if (e.which == 39 || e.which == 68) { // カーソル右 or Dキー
			$scope.moveAvatar('right');
		} else if (e.which == 38 || e.which == 87) { // カーソル上 or Wキー
			$scope.moveAvatar('top');
		}
	};


	// ----

	var t = $interval(function() {
		$scope.drawAvatars();
	}, 50);

	// 未接続ならばサーバへ接続
	WsUserAPI.connect();

}])


// ----

;
