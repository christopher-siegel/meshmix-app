var app = angular.module('starter.controllers', ['starter.services', 'ngOpenFB']);

app.controller('LoginCtrl', function(
  $scope,
  $state,
  $rootScope,
  ngFB,
  $localstorage,
  $ionicHistory,
  $http,
  MeshAPI
){
  // Facebook login
  $scope.fbLogin = function () {
    ngFB.login({scope: 'email'}).then(  // for later: scope: 'email, user_likes' (that must be reviewed by Facebook first)
      function (response) {
        if (response.status === 'connected') {
          console.log('Facebook login succeeded');

          $localstorage.set('access_token', response.authResponse.accessToken);

          $scope.accessToken = response.authResponse.accessToken;
          $scope.expiresIn = response.authResponse.expiresIn;
          setupUser();
        } else {
          alert('Facebook login failed');
        }
      }
    );
  };

  function login(){
    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });
    $state.go("player");
  };

  function setupUser() {
    // Helpful tool: https://developers.facebook.com/tools/explorer
    // API reference: https://developers.facebook.com/docs/graph-api/reference/user
    ngFB.api({
      path: '/me',
      params: {fields: 'id,name,first_name,middle_name,last_name,email'}
    }).then(
      function (user) {
        $rootScope.user = user;
        $localstorage.setObject('user', user);
        console.log($scope.expiresIn);
          var data = {
            access_token: $scope.accessToken,
            expires_in: $scope.expiresIn,
            name : user.name,
            email : user.email
          };
          MeshAPI.sendHttpPost('fb-callback', data);

        login();  // Important: Only execute login() when user is stored in database already
      },
      function (error) {
        $rootScope.logout();
        alert('Facebook error: ' + error.error_description);
      }
    );
  }
});

// app.controller('SignUpCtrl', function($scope, $ionicHistory){
//   // Sign Up
//   $scope.goBack = function() {
//     $ionicHistory.goBack();
//   };

//   $scope.signUp = function(){
//     console.log('User should be signed up!');
//   }
// });

app.controller('PlayerCtrl', function(
  $scope,
  $rootScope,
  $http,
  $location,
  $cordovaDialogs,
  $interval,
  $timeout,
  $cordovaMedia,
  $ionicModal,
  $cordovaFileTransfer,
  $ionicPlatform,
  $cordovaNativeAudio,
  TextToSpeechService,
  $location,
  $state,
  ngFB,
  MakeAppSecure,
  MeshAPI,
  $localstorage,
  $ionicHistory
) {

  $scope.$on('$ionicView.beforeEnter', function() {
     MakeAppSecure.isLoggedIn();
  })

  $scope.rvjs = TextToSpeechService;

  $scope.isPlaying = false;
  $scope.currentSound = "";
  $scope.currentTitle = 'Venice Beach';
  $scope.currentSubtitle = 'Topher Mohr and Alex Elena (Extended Radio Mix)';
  $scope.currentStream = 'middle';  // 'middle' == 'mixed'; alternatives: 'left', 'right'

  $scope.changeColor = function(color){
    $scope.currentStream = color;
  };

  // Settings Modal
  $ionicModal.fromTemplateUrl('templates/settings.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeSettings = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.settings = function() {
    $scope.modal.show();
  };

  // Feedback Modal

  /*
  $ionicModal.fromTemplateUrl('templates/feedback.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  */

  $rootScope.logout = function() {
    $rootScope.user = 0;
    $localstorage.setObject('user', {});

    ngFB.logout().then(
      function () {
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
        });
        // @TODO Bug: http://forum.ionicframework.com/t/openfb-logout-opens-facebook/13408/7
        $state.go('login');
      });
  };




  // // Triggered in the login modal to close it
  // $scope.closeFeedback = function() {
  //   $scope.modal.hide();
  // };

  // // Open the login modal
  // $scope.feedback = function() {
  //   $scope.modal.show();
  // };


  var defaultCategorySettings = [
    { id: 001, checked: true },
    { id: 002, checked: false },
    { id: 003, checked: false },
    { id: 004, checked: false },
    { id: 005, checked: false },
    { id: 006, checked: false },
    { id: 007, checked: false },
    { id: 008, checked: false },
    { id: 009, checked: false },
    { id: 010, checked: false },
    { id: 011, checked: false },
    { id: 012, checked: false }
  ];

  $scope.categoryStyling = [
    { id: 001, name: "General News", img: 'news.jpg' },
    { id: 002, name: "Digital", img: 'digital.jpg' },
    { id: 003, name: "Design", img: 'design.jpg' },
    { id: 004, name: "Economy", img: 'economy.jpg' },
    { id: 005, name: "Sports", img: 'sports.jpg' },
    { id: 006, name: "Politics", img: 'politics.jpg' },
    { id: 007, name: "Music", img: 'music.jpg' },
    { id: 008, name: "Film", img: 'film.jpg' },
    { id: 009, name: "Gaming", img: 'gaming.jpg' },
    { id: 010, name: "Cars", img: 'cars.jpg' },
    { id: 011, name: "Science", img: 'science.jpg' },
    { id: 012, name: "Celebrity", img: 'celebrity.jpg' }
  ];

  // Setup categories
  $scope.categories = getCategories();


  function getCategories() {
    var localCategories = $localstorage.getObject('categories');
    var storedCategories = 0; // @TODO: Request/use data from database

    if (Object.keys(storedCategories).length > 0) {
      console.log('CATEGORY SETUP: Stored category data loaded');
      return storedCategories;
    } else if (Object.keys(localCategories).length > 0) {
      console.log('CATEGORY SETUP: Local category data loaded');
      return localCategories;
    } else {
      console.log('CATEGORY SETUP: Default categories loaded');
      return defaultCategorySettings;
    }
  }

  function setCategory(id, status) {
    setCategories();

    var data = {
      id: id,
      status: status
    };
    // Send updated category to database
    MeshAPI.sendHttpPost('category', data);
  }

  function setCategories() {
    // Update categories locally
    $localstorage.setObject('categories', $scope.categories);
  }

  $scope.updateCategoryStatus = function( element ) {
    element.checked = element.checked ? false : true;
    setCategory(element.id, element.checked);
  }

  // Source: http://stackoverflow.com/questions/21644493/how-to-split-the-ng-repeat-data-with-three-columns-using-bootstrap
  function chunk(arr, size) {
    var newArr = [];
    for (var i=0; i<arr.length; i+=size) {
      newArr.push(arr.slice(i, i+size));
    }
    return newArr;
  }

  $scope.chunkedCategories = chunk($scope.categories, 2);

  $scope.sounds = [{
    id: 1,
    key: 'locations',
    title: "Newsic Places",
    track: 'audio/locations.mp3',
    genre: "What happens around you"
  }, {
    id: 2,
    key: 'news',
    title: "Newsic News",
    track: 'audio/news.mp3',
    genre: "Your personalized newsfeed"
  }, {
    id: 3,
    key: 'venice',
    title: "Venice Beach",
    track: 'audio/Venice_Beach.mp3',
    genre: "Topher Mohr and Alex Elena (Extended Radio Mix)"
  }];


  $scope.audioTracks = Array.prototype.slice.call($scope.sounds, 0);

  $scope.player = {
    key: '' // Holds a last active track
  }

	if (window.cordova) {
		// listen on "document" (according to official SQLite Plugin API doc)
		document.addEventListener("deviceready", useAudioPlugin, false);
	} else {
		// listen on ionic
		$ionicPlatform.ready(useAudioPlugin);
	}

	function useAudioPlugin() {
		var audioPlugin;
		try {
			audioPlugin = window.plugins.NativeAudio;
		} catch(err) {
		    audioPlugin = $cordovaNativeAudio;
		}

      $scope.playTrack = function(track, key) {
        $scope.isPlaying = true;
        $scope.currentSound = key;
        for (tr in $scope.audioTracks) {
          if ($scope.audioTracks[tr].key == key) {
            $scope.currentTitle = $scope.audioTracks[tr].title;
            $scope.currentSubtitle = $scope.audioTracks[tr].genre;
          }
        }
        // Preload an audio track before we play it
        audioPlugin.preloadComplex(key, track, 1, 1, 0, function(msg) {
          // If this is not a first playback stop and unload previous audio track
          if ($scope.player.key.length > 0) {
            audioPlugin.stop($scope.player.key); // Stop audio track
            audioPlugin.unload($scope.player.key); // Unload audio track
          }

          audioPlugin.play(key); // Play audio track
          $scope.player.key = key; // Set a current audio track so we can close it if needed
        }, function(msg) {
          console.log('error: ' + msg); // Loading error
        });
      };

      $scope.stopTrack = function() {
        $scope.isPlaying = false;
          // If this is not a first playback stop and unload previous audio track
          if ($scope.player.key.length > 0) {
            audioPlugin.stop($scope.player.key); // Stop audio track
            audioPlugin.unload($scope.player.key); // Unload audio track
            $scope.player.key = ''; // Remove a current track on unload, it will break an app if we try to unload it again in playTrack function
          }
      };
	}

  /**
   * Animate text when it overflows
   */
  // var elementsThatMightOverflow = document.getElementsByClassName("animate-overflow");
  // elementsThatMightOverflow = angular.element(elementsThatMightOverflow);
  // for (var i = 0, z = elementsThatMightOverflow.length; i < z; i++) {
  //   animateOverflow(elementsThatMightOverflow[i]);
  // };

  // function animateOverflow( element ) {
  //   var text = element.firstChild;
  //   var textWidth = text.offsetWidth;
  //   var elementWidth = element.offsetWidth;

  //   var overflow = textWidth - elementWidth;
  //   if (overflow > 0) {
  //     swayElement(element, text, overflow);
  //   }
  // }

  // function swayElement( element, child, xachses ) {
  //   var position = element.scrollLeft;
  //   var rewind = false;
  //   var delayHack = false;

  //     $interval(function() {
  //       $timeout(function() {

  //         if (Math.abs(position) < xachses+1 && rewind === false && delayHack === false) {
  //           position -= 1;
  //           child.style.left = position+'px';
  //         } else if (position < 1) {
  //           rewind = true;
  //           delayHack = true;
  //           child.style.left = position+'px';
  //           position += 1;
  //           if (position >= 1) {
  //             $timeout(function() {
  //               delayHack = false;
  //             }, 3500);
  //             rewind = false;
  //           }
  //         }

  //       }, 3500);
  //     }, 20);
  // }

// /**
//    * Merge two JSON objects
//    * Source: Source: http://stackoverflow.com/a/24261258
//    */
//   function mergeJSON(source1,source2){
//     /*
//      * Properties from the Souce1 object will be copied to Source2 Object.
//      * Note: This method will return a new merged object, Source1 and Source2 original values will not be replaced.
//      * */
//     var mergedJSON = Object.create(source2);// Copying Source2 to a new Object

//     for (var attrname in source1) {
//         if(mergedJSON.hasOwnProperty(attrname)) {
//           if ( source1[attrname]!=null && source1[attrname].constructor==Object ) {
//               /*
//                * Recursive call if the property is an object,
//                * Iterate the object and set all properties of the inner object.
//               */
//               mergedJSON[attrname] = mergeJSON(source1[attrname], mergedJSON[attrname]);
//           }

//         } else {//else copy the property from source1
//             mergedJSON[attrname] = source1[attrname];

//         }
//       }
//       return mergedJSON;
//   }

});

app.controller('PlaylistCtrl', function($scope, $stateParams, Spotify) {
  var listid = $stateParams.listid;
  var userid = $stateParams.userid;
  $scope.listname = $stateParams.listname;

  $scope.audio = new Audio();

  $scope.tracks = [];

  Spotify.getPlaylist(userid, listid).then(function (data) {
    $scope.tracks = data.tracks.items;
  });

  $scope.playTrack = function(trackInfo) {
    $scope.audio.src = trackInfo.track.preview_url;
    $scope.audio.play();
  };

  $scope.openSpotify = function(link) {
    window.open(link, '_blank', 'location=yes');
  };

  $scope.stop = function() {
    if ($scope.audio.src) {
      $scope.audio.pause();
    }
  };

  $scope.play = function() {
    if ($scope.audio.src) {
      $scope.audio.play();
    }
  };
});

app.controller('ListsCtrl', function($scope, $ionicPlatform, $cordovaOauth, Spotify) {
  var clientId = '2ae7acb645a742a181f58cc02d6faca4';
  $scope.playlists = [];

    $scope.performLogin = function() {
      $cordovaOauth.spotify(clientId, ['user-read-private', 'playlist-read-private']).then(function(result) {
        window.localStorage.setItem('spotify-token', result.access_token);
        Spotify.setAuthToken(result.access_token);
        $scope.updateInfo();
      }, function(error) {
          console.log("Error -> " + error);
      });
    };

    $scope.updateInfo = function() {
      Spotify.getCurrentUser().then(function (data) {
        $scope.getUserPlaylists(data.id);
      }, function(error) {
        $scope.performLogin();
      });
    };

    $ionicPlatform.ready(function() {
      var storedToken = window.localStorage.getItem('spotify-token');
      if (storedToken !== null) {
        Spotify.setAuthToken(storedToken);
        $scope.updateInfo();
      } else {
        $scope.performLogin();
      }
    });

    $scope.getUserPlaylists = function(userid) {
      Spotify.getUserPlaylists(userid).then(function (data) {
        $scope.playlists = data.items;
      });
    };
});
