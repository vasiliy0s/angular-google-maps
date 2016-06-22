'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = googleMapsApiScriptDirective;
var $injected = false;

// @ngInject
function googleMapsApiScriptDirective(GoogleMapsConfig, $timeout, $rootScope, $window) {
  return {
    restrict: 'E',
    link: link
  };

  function link(scope, element) {
    if (true === $injected) {
      return;
    }

    var SRC = 'https://maps.googleapis.com/maps/api/js?key=' + GoogleMapsConfig.key + '&libraries=' + GoogleMapsConfig.libraries.join(',');

    var $script = angular.element('<script></script>').attr('type', 'text/javascript');

    element.append($script);

    $script[0].onload = function () {
      return $rootScope.$broadcast('google-maps:loaded', $window.google.maps);
    };
    $script[0].onerror = function (err) {
      return $rootScope.$broadcast('google-maps:loadError', err);
    };

    $script.attr('src', SRC);

    $timeout(function () {
      return element.remove();
    });

    $injected = true;
  }
}