/**
 * Main Script for Frontend Application
 */

'use strict';

angular.module('MyApp', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {

	// ルートプロバイダの設定
	$routeProvider
		.when('/', {
			templateUrl: '/pages/cover.html'
		})
		.when('/book/:userName', {
			templateUrl: '/pages/content.html'
		})
		.otherwise({
			redirectTo: '/'
		})
	;

}])


// 表紙ページ用コントローラ
.controller('CoverPageCtrl', ['$scope', '$location', '$window',
function($scope, $location, $window) {

	// ユーザ名 (学籍番号など)
	$scope.userName = 'mt15a000';


	/**
	 * コンテンツの開始
	 * @param  {String} user_name User name (e.g. student number)
	 */
	$scope.startContent = function (user_name) {

		if (user_name == null) {
			$window.alert('ユーザ名を入力してください');
			return;
		}

		$location.path('/book/' + user_name);

	};

}])


// コンテンツページ用コントローラ
.controller('ContentPageCtrl', ['$scope', '$location', function($scope, $location) {



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
.controller('SmallLifeCtrl', ['$scope', '$timeout', '$interval', function($scope, $timeout, $interval) {

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

}])


// ----

;
