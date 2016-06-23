'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.filter');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GEOLOCATE_URL = 'https://www.googleapis.com/geolocation/v1/geolocate';

var GoogleMaps = function () {
  GoogleMaps.$inject = ['$window', '$http', '$rootScope', 'GoogleMapsConfig'];

  // @ngInject

  function GoogleMaps($window, $http, $rootScope, GoogleMapsConfig) {
    _classCallCheck(this, GoogleMaps);

    angular.extend(this, {
      $window: $window,
      $http: $http,
      $rootScope: $rootScope,
      GoogleMapsConfig: GoogleMapsConfig
    });
  }

  /**
   * Locate current user
   * @param  {Object} options postiong options
   * @param  {Object} params  request params
   * @return {Promise}         
   */


  _createClass(GoogleMaps, [{
    key: 'geolocate',
    value: function geolocate(options, params) {
      params = params || {};

      params.key = this.GoogleMapsConfig.key;

      return this.$http.post(GEOLOCATE_URL, options || {}, { params: params }).then(function (res) {
        return res.data;
      });
    }

    /**
     * Locate address coordinates
     * @param  {Mixed} address query string or object with latitude/longitude properties
     * @return {Promise}         
     */

  }, {
    key: 'geocode',
    value: function geocode(address) {
      var _this = this;

      return this._getGeocoder()
      // Parse params.
      .then(function (Geocoder) {
        var params = void 0;

        if (angular.isString(address)) {
          params = { address: address };
        } else if (angular.isObject(address)) {
          return _this._getLatLng(address.latitude || address.lat, address.longitude || address.lng).then(function (location) {
            params = { location: location };
            return { Geocoder: Geocoder, params: params };
          });
        } else {
          throw 'unsupported_params_type';
        }

        return { Geocoder: Geocoder, params: params };
      })
      // Make request.
      .then(function (req) {
        return new Promise(function (resolve) {
          req.Geocoder.geocode(req.params, function (res, status) {
            return resolve({ res: res, status: status });
          });
        });
      }).then(function (data) {
        return _this._getStatus('OK').then(function (ok) {
          if (data.status !== ok) {
            throw data.res;
          }

          data.items = data.res.map(function (item) {
            var parsed = item;

            var components = item.address_components;
            var coordinates = item.geometry.location;

            return angular.extend(item, {
              longitude: coordinates.lng(),
              latitude: coordinates.lat(),
              country: _this._getAddressComponent(components, 'country'),
              area: _this._getAddressComponent(components, 'administrative_area_level_1') || _this._getAddressComponent(components, 'administrative_area_level_2') || _this._getAddressComponent(components, 'administrative_area_level_3'),
              city: _this._getAddressComponent(components, 'locality', 'long_name'),
              street: _this._getAddressComponent(components, 'route') || _this._getAddressComponent(components, 'intersection'),
              house: _this._getAddressComponent(components, 'street_number')
            });
          });

          return data;
        });
      });
    }

    /**
     * Find address component in components
     * @param  {Array} components Google Address components (@see https://developers.google.com/maps/documentation/javascript/geocoding?hl=ru#GeocodingAddressTypes)
     * @param  {String} type       Finding component type
     * @param  {String} name_type  Output value type if need
     * @return {String}            Found compnent name
     */

  }, {
    key: '_getAddressComponent',
    value: function _getAddressComponent(components, type, name_type) {
      return this._$eval(name_type || 'short_name', (0, _lodash2.default)(components, function (cmpnt) {
        return cmpnt.types.indexOf(type) >= 0;
      })[0]);
    }

    /**
     * Find directions
     * @param  {String} fromPoint from point description
     * @param  {String} toPoint   destination point description
     * @param  {Object} options   request options
     * @return {Promise}           
     */

  }, {
    key: 'directions',
    value: function directions(fromPoint, toPoint, options) {
      var _this2 = this;

      return Promise.resolve(angular.extend({}, options)).then(function (params) {
        return _this2._getTravelMode(params.mode || 'DRIVING').then(function (mode) {
          params.travelMode = mode;
          delete params.mode;
          return params;
        });
      }).then(function (params) {
        return _this2._getLatLng(fromPoint.latitude || fromPoint.lat, fromPoint.longitude || fromPoint.lng).then(function (fromLatLng) {
          params.origin = fromLatLng;
          return params;
        });
      }).then(function (params) {
        return _this2._getLatLng(toPoint.latitude || toPoint.lat, toPoint.longitude || toPoint.lng).then(function (toLatLng) {
          params.destination = toLatLng;
          return params;
        });
      }).then(function (params) {
        return _this2._getDirectionsService().then(function (directionsService) {
          return new Promise(function (resolve) {
            directionsService.route(params, function (res, status) {
              resolve({ res: res, status: status });
            });
          });
        });
      }).then(function (data) {
        return _this2._getStatus('OK').then(function (ok) {
          if (data.status !== ok) {
            throw data.res;
          }

          data.res.route = {
            distance: _this2._$eval('routes[0].legs[0].distance.value', data.res),
            duration: _this2._$eval('routes[0].legs[0].duration.value', data.res)
          };

          return data.res;
        });
      });
    }

    /**
     * Get google.maps API if available
     * @return {Promise} 
     */

  }, {
    key: 'getApi',
    value: function getApi() {
      var $window = this.$window;
      var $rootScope = this.$rootScope;

      return Promise.resolve().then(function () {
        var gmaps = $window.google && $window.google.maps;

        if (!gmaps) {
          throw 'google.maps not loaded yet';
        }

        return gmaps;
      }).catch(function (err) {
        return new Promise(function (resolve, reject) {
          var $unwatchLoaded = $rootScope.$on('google-maps:loaded', function (event, gmaps) {
            $unwatchLoaded();
            $unwatchError();
            resolve(gmaps);
          });

          var $unwatchError = $rootScope.$on('google-maps:loadError', function () {
            $unwatchLoaded();
            $unwatchError();
            reject(err);
          });
        });
      });
    }
  }, {
    key: '_$eval',
    value: function _$eval(exp, locals) {
      return this.$rootScope.$eval(exp, locals);
    }
  }, {
    key: '_getGeocoder',
    value: function _getGeocoder() {
      return this.getApi().then(function (gmaps) {
        return new gmaps.Geocoder();
      });
    }
  }, {
    key: '_getDirectionsService',
    value: function _getDirectionsService() {
      return this.getApi().then(function (gmaps) {
        return new gmaps.DirectionsService();
      });
    }
  }, {
    key: '_getTravelMode',
    value: function _getTravelMode(mode) {
      return this.getApi().then(function (gmaps) {
        return gmaps.TravelMode[mode];
      });
    }
  }, {
    key: '_getStatus',
    value: function _getStatus(name) {
      return this.getApi().then(function (gmaps) {
        return gmaps.DirectionsStatus[name];
      });
    }
  }, {
    key: '_getLatLng',
    value: function _getLatLng(lat, lng) {
      return this.getApi().then(function (gmaps) {
        return new gmaps.LatLng(lat, lng);
      });
    }
  }]);

  return GoogleMaps;
}();

exports.default = GoogleMaps;