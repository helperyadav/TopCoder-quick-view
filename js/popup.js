var TOPCODERAPP = angular.module('TOPCODERAPP', []);



TOPCODERAPP.controller('TCCtrl', function ($scope, $http, $sce) {
	/* 
		Get/Set the User Settings.
		Get the cached challenges.
		Get latest challenges.
	 */
	$scope.init = function () {
		$scope.challenges = [];
		loadUserSettings();
		initChallenges();
	}
	$scope.init();
	
	function initChallenges  () {
		if( typeof(Storage) !== "undefined"  ){
			data = JSON.parse( localStorage.getItem("challenges") );
			if(data != null )
				onChallengeLoad(data);
		}
		$http.get('https://api.topcoder.com/v2/challenges').success(function(data) {
			onChallengeLoad(data);
			if( typeof(Storage) !== "undefined") {
				localStorage.setItem("challenges", JSON.stringify( data ) );
			}
		});
			
	}
	
	function onChallengeLoad (tc){
		$scope.challenges = [];
		for(var key in tc.data){
			var item = tc.data[key];
			if( item.currentStatus == 'Active' ){
				$scope.challenges.push(item);
				var timeDiff = Math.abs(new Date(item.submissionEndDate.substring(0,10)).getTime() - new Date().getTime());
				item.remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
				
				var elapsedtimeDiff = Math.abs(new Date(item.postingDate.substring(0,10)).getTime() - new Date().getTime());
				item.elapsed = Math.ceil(elapsedtimeDiff / (1000 * 3600 * 24));
				item.isNew = item.elapsed <= 2;
				item.totalTime = item.elapsed + item.remainingDays;
			}
		}


	}
	
	function loadUserSettings () {
		if(typeof(Storage) !== "undefined") {
			$scope.Settings = JSON.parse( localStorage.getItem("Settings") );
			console.log( $scope.Settings);
			if($scope.Settings == null){
				$scope.Settings = {
					FilterTypes : [
									{'type' : 'Code', 'show': true}, 
									{'type' : 'First2Finish', 'show' : false},
									{'type' : 'Web Design', 'show' : false}
								]
				};
				localStorage.setItem("Settings", JSON.stringify( $scope.Settings));
			}
		} else {
			// Sorry! No Web Storage support..
		}
	}

	$scope.setUserSettings = function() {
		localStorage.setItem("Settings", JSON.stringify($scope.Settings) );
	}

	$scope.loadChallengeDetail = function (ch) {
		if( ch.isDetail == undefined )
			ch.isDetail = false;

		if(ch.detailedRequirements != null || ch.detailedRequirements != undefined){
			ch.isDetail = !ch.isDetail;
		}else{
			$http.get('https://api.topcoder.com/v2/challenges/' + ch.challengeId ).success(function(data) {
				if(data.introduction){
					ch.detailedRequirements = $sce.trustAsHtml(data.introduction);
					ch.isDetail = true;
				}else if( data.detailedRequirements ){
					ch.detailedRequirements = $sce.trustAsHtml( data.detailedRequirements);
					ch.isDetail = true;
				}
				console.log( data );
			});
		}
	}

}).filter('challengeType', function() {
  return function(challenges, Settings){
    var filtered = [];
    for(var i = 0; i < challenges.length; i++){
    	var challenge = challenges[i];
		for(var j =0; j < Settings.FilterTypes.length; j++){
			var  setting = Settings.FilterTypes[j];
	 		if( challenge.challengeType == setting.type && setting.show == true ){
	  			filtered.push( challenge );
	  		}
    	}
    }

    return filtered;
  }
});