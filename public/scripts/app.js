/**
 * Main Script for Frontend Application
 */

'use strict';

angular.module('MyApp', [])

.config(function() {

})


// Controller for the book cover page
.controller('CoverPageCtrl', ['$scope', '$location', function($scope, $location) {

	/**
	 * Start the scenario for the user
	 * @param  {String} user_name User name (e.g. student number)
	 */
	$scope.startScenario = function (user_name) {
		$location.path('/book/' + user_name);
	};

}])


// Controller for the scanario pages
.controller('ScenarioPageCtrl', ['$scope', '$location', function($scope, $location) {

	/**
	 * Start the scenario for the user
	 * @param  {String} user_name User name (e.g. student number)
	 */
	$scope.startScenario = function (user_name) {
		$location.path('/book/' + user_name);
	};

}])


// ----

;
