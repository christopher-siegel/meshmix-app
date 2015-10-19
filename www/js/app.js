// Newsic App
// It's gona be awesome!

angular.module('starter', [
  'ionic',
  'ionic.service.core',
  'ionic.service.analytics',
  'starter.controllers',
  'starter.services',
  'ngCordova',
  'spotify',
  'ngOpenFB'
])

.run(function($ionicPlatform, $ionicAnalytics, $rootScope, ngFB) {
  ngFB.init({appId: '451140448408517'});

  $ionicPlatform.ready(function() {
    $ionicAnalytics.register();

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

  });
})

.config(function($stateProvider, $urlRouterProvider) {
  // $ionicConfigProvider.views.transition('none');
  // $httpProvider.defaults.withCredentials = true; // allow cross origin cookies


  $stateProvider

  .state('lists', {
    url: '/lists',
    templateUrl: 'templates/lists.html',
    controller: 'ListsCtrl'
  })

  .state('playlist', {
    url: '/playlist/:listid/:userid/:listname',
    templateUrl: 'templates/playlist.html',
    controller: 'PlaylistCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  // .state('signup', {
  //   url: '/signup',
  //   templateUrl: 'templates/signup.html',
  //   controller: 'SignUpCtrl'
  // })

  // .state('feedback', {
  //   url: '/feedback',
  //   templateUrl: 'templates/feedback.html',
  //   controller: 'FeedbackCtrl'
  // })

  .state('player', {
    url: '/player',
    templateUrl: 'templates/player.html',
    controller: 'PlayerCtrl'
    // ,
    // resolve: {
    //   loggedin: checkLoggedin
    // }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/player');

});
