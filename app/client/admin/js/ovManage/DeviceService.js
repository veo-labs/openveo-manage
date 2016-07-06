'use strict';

(function(app) {

  /**
   * Defines a device service.
   *
   * @module ov.manage
   * @class DeviceService
   */
  function DeviceService($http, $q, manageService, entityService, manageName) {

    return {
    };

  }

  app.factory('deviceService', DeviceService);
  DeviceService.$inject = ['$http', '$q', 'manageService', 'entityService', 'manageName'];

})(angular.module('ov.manage'));
