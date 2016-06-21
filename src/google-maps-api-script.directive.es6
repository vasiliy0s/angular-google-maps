let $injected = false;

// @ngInject
export default function googleMapsApiScriptDirective(GoogleMapsConfig, $timeout, $rootScope, $window) {
  return {
    restrict: 'E',
    link
  };
  
  function link(scope, element) {
    if (true === $injected) {
      return;
    }
    
    let SRC = `https://maps.googleapis.com/maps/api/js?key=${GoogleMapsConfig.key}&libraries=${GoogleMapsConfig.libraries.join(',')}`;
    
    let $script = angular
      .element('<script></script>')
      .attr('type', 'text/javascript');
    
    element
      .append($script);
    
    $script[0].onload = () => $rootScope.$broadcast('google-maps:loaded', $window.google.maps);
    $script[0].onerror = (err) => $rootScope.$broadcast('google-maps:loadError', err);
    
    $script.attr('src', SRC);
    
    $timeout(() => element.remove());
    
    $injected = true;
  }
}
