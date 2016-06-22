'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _angular = require('angular');

var _angular2 = _interopRequireDefault(_angular);

var _googleMaps = require('./google-maps.config');

var _googleMaps2 = require('./google-maps.service');

var _googleMaps3 = _interopRequireDefault(_googleMaps2);

var _googleMapsApiScript = require('./google-maps-api-script.directive');

var _googleMapsApiScript2 = _interopRequireDefault(_googleMapsApiScript);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _angular2.default.module('google-maps', [
  //
]).constant('GoogleMapsConfig', _googleMaps.GoogleMapsConfig) // used 'constant' for availability in 'config' blocks.
.directive('googleMapsApiScript', _googleMapsApiScript2.default).service('GoogleMaps', _googleMaps3.default).name;