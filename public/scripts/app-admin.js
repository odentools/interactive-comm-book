/**
 * Main Script of Frontend Application for Admin
 */

'use strict';

angular.module('AdminApp', ['ngRoute', 'ngWebSocket', 'pdf'])

.config(['$routeProvider', function($routeProvider) {

	// ルートプロバイダの設定
	$routeProvider
		.when('/', {
			controller: 'DashboardPageCtrl',
			templateUrl: '/pages-admin/dashboard.html'
		})
		.when('/presentation', {
			controller: 'PresentationPageCtrl',
			templateUrl: '/pages-admin/presentation.html'
		})
		.otherwise({
			redirectTo: '/'
		})
	;

}])


// 管理者用 WebSocket API との通信用ファクトリー
.factory('WsAdminAPI', function($websocket, $window, $rootScope, $timeout, $log) {

	var wsDataStream = null, userName = null;
	var status = {
		devices: {},
		event: {},
		users: {}
	};

	var methods = {


		/**
		 * サーバへ接続
		 * @param  {String} device_id デバイスID
		 */
		connect: function(device_id) {

			var self = this;

			if (wsDataStream != null) {
				return wsDataStream;
			}

			// URLスキーマの設定
			var ws_host = new String();
			if ($window.location.port == 443) {
				ws_host = 'wss://' + ws_host;
			} else {
				ws_host = 'ws://' + ws_host;
			}

			// WebSocketサーバへ接続
			try {
				wsDataStream = $websocket(ws_host + $window.location.host + '/ws/admin/' + device_id);
			} catch (e) {
				$log.error(e);
				// 再接続
				wsDataStream = null;
				$log.info('Reconnecting...');
				$timeout(function() {
					self.connect();
				}, 500);
				return;
			}

			// イベントハンドラの設定

			wsDataStream.onClose(function () { // 切断時
				// 再接続
				wsDataStream = null;
				$log.info('Connection has been closed; Reconnecting...');
				$timeout(function() {
					self.connect();
				}, 500);
			});

			wsDataStream.onMessage(function (msg) { // メッセージ受信時

				var data = {};
				try {
					data = JSON.parse(msg.data);
				} catch (e) {
					$log.debug('onMessage', msg.data);
					// ブロードキャスト
					$rootScope.$broadcast('LOG_RECEIVED', msg.data);
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


/**
 * ダッシュボードページ用コントローラ
 */
.controller('DashboardPageCtrl', function ($scope, $routeParams) {

})


/**
 * プレゼンテーションページ用コントローラ
 */
.controller('PresentationPageCtrl', function ($scope, $routeParams, WsAdminAPI) {

	// 未接続ならばサーバへ接続
	WsAdminAPI.connect();

})


/**
 * 概要情報用コントローラ
 */

.controller('OverviewCtrl', function ($scope, $rootScope, $interval, WsAdminAPI) {

	$scope.statusText = null;
	$scope.updatedAt = null;
	$scope.numOfUsers = 0;

	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('STATUS_UPDATED', function (event, status) {

		$scope.updatedAt = new Date();
		$scope.numOfUsers = Object.keys(status.users).length;

	});

	// 異常を監視
	$interval(function () {

		if ($scope.updatedAt != null && $scope.updatedAt.getTime() < new Date().getTime() - 15000) {
			$scope.statusText = '更新が停止しています';
		} else {
			$scope.statusText = null;
		}

	}, 1000);

})


/**
 * イベント制御用コントローラ
 */
.controller('EventCtrl', function($scope, $window, $rootScope, WsAdminAPI) {

	// 開催中のイベントのステータス
	$scope.eventStatus = {};

	// ----


	/**
	 * イベントの開始
	 */
	$scope.startEvent = function() {

		$scope.eventStatus.isStarted = true;
		WsAdminAPI.sendCommand(null, null, 'startEvent', {});

	};


	/**
	 * イベントの終了
	 */
	$scope.finishEvent = function() {

		if (!$window.confirm('本当にイベントを終了しますか？')) {
			return;
		}

		$scope.eventStatus.isStarted = false;
		WsAdminAPI.sendCommand(null, null, 'finishEvent', {});

	};


	/**
	 * ルーレットの実行
	 */
	$scope.spinRoulette = function() {

		WsAdminAPI.sendCommand(null, null, 'spinRoulette', {});

	};


	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('STATUS_UPDATED', function (event, status) {

		$scope.eventStatus = status.event;

	});

	// 未接続ならばサーバへ接続
	WsAdminAPI.connect();


})


/**
 * プレゼンスライド用コントローラ
 */
.controller('SlideCtrl', function($scope, $rootScope, $window, WsAdminAPI) {

	$scope.pdfUrl = WsAdminAPI.getStatus().event.slideUrl || null;
	$scope.slidePdfUrl = WsAdminAPI.getStatus().event.slideUrl || null;
	$scope.isFollowPageToServer = $scope.isFollowPageToServer || false;

	// ----


	/**
	 * スライドPDFのURLを設定
	 * @param {String} url URL
	 */
	$scope.setSlidePdfUrl = function (url) {

		$scope.pdfUrl = url;

		WsAdminAPI.sendCommand(null, null, 'setSlideUrl', {
			url: url
		});

	};


	/**
	 * スライドを次のページへ変更
	 */
	$scope.openNextPage = function () {

		$scope.goNext();

		WsAdminAPI.sendCommand(null, null, 'setSlidePageId', {
			pageId: $scope.pageNum
		});

	};


	/**
	 * スライドを前のページへ変更
	 */
	$scope.openPrevPage = function () {

		$scope.goPrevious();

		WsAdminAPI.sendCommand(null, null, 'setSlidePageId', {
			pageId: $scope.pageNum
		});

	};


	/**
	 * プレゼンテーション用ウィンドウの表示 (スライド単独表示)
	 */
	$scope.openPresentationWindow = function() {

		console.log($window.location);

		$window.open($window.location.protocol + '//' + $window.location.host + $window.location.pathname + '#/presentation');

	};


	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('STATUS_UPDATED', function (event, status) {

		if ($scope.isFollowPageToServer && status.event.slidePageId != $scope.pageNum && status.event.slidePageId != -1) {
			$scope.$apply(function() {
				$scope.pageNum = status.event.slidePageId;
			});
		}

		if (status.event.slideUrl != $scope.pdfUrl) {
			$scope.$apply(function() {
				$scope.slidePdfUrl = status.event.slideUrl;
				$scope.pdfUrl = status.event.slideUrl;
			});
		}

	});

	// 未接続ならばサーバへ接続
	WsAdminAPI.connect();


})


/**
 * デバイスリスト用コントローラ
 */
.controller('DevicesCtrl', function($scope, $window, $rootScope, WsAdminAPI) {

	// ステータス
	$scope.devicesStatus = [];


	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('STATUS_UPDATED', function (event, status) {

		$scope.devicesStatus = status.devices;

	});

	// 未接続ならばサーバへ接続
	WsAdminAPI.connect();


})


/**
 * ログ用コントローラ
 */
.controller('LogsCtrl', function($scope, $window, $rootScope, WsAdminAPI) {

	var MAX_NUM_OF_LOGS = 50;

	// ログ
	$scope.logs = [];


	// ----

	// ステータスの変更を監視
	var watcher = $rootScope.$on('LOG_RECEIVED', function (event, log_item) {

		while (MAX_NUM_OF_LOGS <= $scope.logs.length) {
			$scope.logs.pop();
		}
		$scope.logs.unshift(log_item);

	});

	// 未接続ならばサーバへ接続
	WsAdminAPI.connect();


})

// ----

;
