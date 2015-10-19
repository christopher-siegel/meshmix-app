angular.module('starter.services', [])

/**
 * Responsive Voice API (http://responsivevoice.org/api/)
 */
.factory('TextToSpeechService', function(){
  var isSameAudio = false;

  function isVoiceSupported(){
    if(responsiveVoice.voiceSupport()) {
      return true;
    } else {
      console.log('Voice is not supported');
      return false;
    }
  }

  function speakText( text, voice, volume, pitch, rate, startCallback, endCallback ){
    if (!isVoiceSupported) return;

    voice = voice || 'UK English Female';
    volume = volume || 0.75;  // range 0 to 1
    pitch = pitch || 1; // range 0 to 2
    rate = rate || 1;  // range 0 to 1.5
    startCallback = startCallback || function(){};  // range 0 to 1.5
    endCallback = endCallback || function(){};  // range 0 to 1.5

    isSameAudio = true;
    responsiveVoice.speak(
      text,
      voice,
      {
        volume: volume,
        pitch: pitch,
        rate: rate,
        onstart: startCallback,
        onend: endCallback
      }
    );
  }

  function cancel(){
    if (!isVoiceSupported) return;

    isSameAudio = false;
    responsiveVoice.cancel();
  }

  function pause(){
    if (!isVoiceSupported) return;

    isSameAudio = true;
    responsiveVoice.pause();
  }

  function resume(){
    if (!isVoiceSupported) return;

    isSameAudio = true;
    responsiveVoice.resume();
  }

  function resumeOrSpeakNewText( text, voice, volume, pitch, rate, startCallback, endCallback ) {
    if (isSameAudio) {
      resume();
    } else {
      speakText( text, voice, volume, pitch, rate, startCallback, endCallback );
    }
  }

  return {
    speakText: speakText,
    cancel: cancel,
    pause: pause,
    resume: resume,
    resumeOrSpeakNewText: resumeOrSpeakNewText
  };
})


/**
 * Functions to make the app more secure
 */
.factory('MakeAppSecure', function($rootScope, $localstorage){
  function isLoggedIn() {
    var user = $localstorage.getObject('user');

    if (Object.keys(user).length > 0) {
      $rootScope.user = user;
    } else {
      $rootScope.logout();
    }
  }

  return {
    isLoggedIn: isLoggedIn
  };
})

/**
 * Interact with our API
 * Exemplary usage: MeshAPI.sendHttpPost('fb-callback', data);
 */
.factory('MeshAPI', function($http){
  function sendHttpPost(path, pdata) {
    $http({
      method: 'POST',
      url: 'http://newsic.app/' + path,
      headers: {
        'Content-Type' : 'multipart/form-data'
        'Authorization' : $localstorage.get('access_token');
      },
      data: pdata
    }).then(function successCallback(response) {
      //
    }, function errorCallback(response) {
      //
    });
  }

  return {
    sendHttpPost: sendHttpPost
  };
})

/**
 * Use AngularJS Service for local storage
 * http://learn.ionicframework.com/formulas/localstorage/
 */
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    },
    clear: function() {
      $window.localStorage.clear();
    }
  }
}]);