'use strict';

(function(app) {

  /**
   * Defines a device service.
   *
   * @module ov.manage
   * @class DeviceService
   */
  function DeviceService($http, $q) {


    return {
    };

  }

  app.factory('deviceService', DeviceService);
  DeviceService.$inject = ['$http', '$q'];

})(angular.module('ov.manage'));
