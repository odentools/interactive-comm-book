/**
 * Main Script of Frontend Application for Admin
 */

'use strict';

angular.module('AdminApp', ['ngRoute', 'ngWebSocket'])

.config(['$routeProvider', function($routeProvider) {

	// ルートプロバイダの設定

}])


// 管理者用 WebSocket API との通信用ファクトリー
.factory('WsAdminAPI', function($websocket, $window, $rootScope, $timeout, $log) {

	var wsDataStream = null, userName = null, status = {};

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
				$log.info('Reconnecting...');
				$timeout(function() {
					self.connect();
				}, 500);
				return;
			}

			// イベントハンドラの設定

			wsDataStream.onClose(function () { // 切断時
				// 再接続
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

// ----

;
