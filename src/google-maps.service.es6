import _filter from 'lodash.filter';

const GEOLOCATE_URL = 'https://www.googleapis.com/geolocation/v1/geolocate';

export default class GoogleMaps {
  // @ngInject
  constructor($window, $http, $rootScope, GoogleMapsConfig) {
    angular.extend(this, {
      $window,
      $http,
      $rootScope,
      GoogleMapsConfig
    });
  }
  
  /**
   * Locate current user
   * @param  {Object} options postiong options
   * @param  {Object} params  request params
   * @return {Promise}         
   */
  geolocate(options, params) {
    params = params || {};
    
    params.key = this.GoogleMapsConfig.key;
    
    return this.$http
      .post(GEOLOCATE_URL, options || {}, { params })
      .then(res => res.data);
  }
  
  
  /**
   * Locate address coordinates
   * @param  {Mixed} address query string or object with latitude/longitude properties
   * @return {Promise}         
   */
  geocode(address) {
    return this._getGeocoder()
      // Parse params.
      .then(Geocoder => {
        let params;
        
        if (angular.isString(address)) {
          params = { address };
        }
        
        else if (angular.isObject(address)) {
          return this._getLatLng(address.latitude || address.lat, address.longitude || address.lng)
            .then(location => {
              params = { location };
              return { Geocoder, params };
            });
        }
        
        else {
          throw 'unsupported_params_type';
        }
        
        return { Geocoder, params };
      })
      // Make request.
      .then(req => new Promise(resolve => {
        req.Geocoder.geocode(req.params, (res, status) => resolve({ res, status }));
      }))
      .then(data => {
        return this._getStatus('OK')
          .then(ok => {
            if (data.status !== ok) {
              throw data.res;
            }
            
            data.items = data.res.map(item => {
              let parsed = item;
              
              let components = item.address_components;
              let coordinates = item.geometry.location;
              
              return angular.extend(item, {
                longitude: coordinates.lng(),
                latitude : coordinates.lat(),
                country  : this._getAddressComponent(components, 'country'),
                area     : this._getAddressComponent(components, 'administrative_area_level_1') ||
                           this._getAddressComponent(components, 'administrative_area_level_2') || 
                           this._getAddressComponent(components, 'administrative_area_level_3'),
                city     : this._getAddressComponent(components, 'locality', 'long_name'),
                street   : this._getAddressComponent(components, 'route') || this._getAddressComponent(components, 'intersection'),
                house    : this._getAddressComponent(components, 'street_number'),
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
  _getAddressComponent(components, type, name_type) {
    return this._$eval(
      name_type || 'short_name', 
      _filter(components, cmpnt => cmpnt.types.indexOf(type) >= 0)[0]
    );
  }
  
  
  /**
   * Find directions
   * @param  {String} fromPoint from point description
   * @param  {String} toPoint   destination point description
   * @param  {Object} options   request options
   * @return {Promise}           
   */
  directions(fromPoint, toPoint, options) {
    return Promise.resolve(angular.extend({}, options))
      .then(params => {
        return this._getTravelMode(params.mode || 'DRIVING')
          .then(mode => {
            params.travelMode = mode;
            delete params.mode;
            return params;
          });
      })
      .then(params => {
        return this._getLatLng(fromPoint.latitude || fromPoint.lat, fromPoint.longitude || fromPoint.lng)
          .then(fromLatLng => {
            params.origin = fromLatLng;
            return params;
          });
      })
      .then(params => {
        return this._getLatLng(toPoint.latitude || toPoint.lat, toPoint.longitude || toPoint.lng)
          .then(toLatLng => {
            params.destination = toLatLng;
            return params;
          });
      })
      .then(params => {
        return this._getDirectionsService()
          .then(directionsService => new Promise(resolve => {
            directionsService.route(params, (res, status) => {
              resolve({ res, status });
            });
          }));
      })
      .then(data => {
        return this._getStatus('OK')
          .then(ok => {
            if (data.status !== ok) {
              throw data.res;
            }
            
            data.res.route = {
              distance: this._$eval('routes[0].legs[0].distance.value', data.res),
              duration: this._$eval('routes[0].legs[0].duration.value', data.res),
            };
            
            return data.res;
          });
      });
  }
  
  /**
   * Get google.maps API if available
   * @return {Promise} 
   */
  getApi() {
    let $window = this.$window;
    let $rootScope = this.$rootScope;
    
    return Promise
      .resolve()
      .then(() => {
        let gmaps = $window.google && $window.google.maps;
        
        if (!gmaps) {
          throw 'google.maps not loaded yet';
        }
        
        return gmaps;
      })
      .catch(err => {
        return new Promise((resolve, reject) => {
          let $unwatchLoaded = $rootScope.$on('google-maps:loaded', (event, gmaps) => {
            $unwatchLoaded();
            $unwatchError();
            resolve(gmaps);
          });
          
          let $unwatchError = $rootScope.$on('google-maps:loadError', () => {
            $unwatchLoaded();
            $unwatchError();
            reject(err);
          });
        })
      });
  }
  
  _$eval(exp, locals) {
    return this.$rootScope.$eval(exp, locals);
  }
  
  _getGeocoder() {
    return this.getApi()
      .then(gmaps => new gmaps.Geocoder());
  }
  
  _getDirectionsService() {
    return this.getApi()
      .then(gmaps => new gmaps.DirectionsService());
  }
  
  _getTravelMode(mode) {
    return this.getApi()
      .then(gmaps => gmaps.TravelMode[mode]);
  }
  
  _getStatus(name) {
    return this.getApi()
      .then(gmaps => gmaps.DirectionsStatus[name]);
  }
  
  _getLatLng(lat, lng) {
    return this.getApi()
      .then(gmaps => new gmaps.LatLng(lat, lng));
  }
}
