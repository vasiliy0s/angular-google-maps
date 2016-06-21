import angular from 'angular';

import { GoogleMapsConfig } from './google-maps.config';
import GoogleMaps from './google-maps.service';
import googleMapsApiScriptDirective from './google-maps-api-script.directive';

export default angular
  .module('google-maps', [
    // 
  ])
  .constant('GoogleMapsConfig', GoogleMapsConfig) // used 'constant' for availability in 'config' blocks.
  .directive('googleMapsApiScript', googleMapsApiScriptDirective)
  .service('GoogleMaps', GoogleMaps)
  .name;
