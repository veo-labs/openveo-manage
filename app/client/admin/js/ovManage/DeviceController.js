'use strict';

(function(app) {

  /**
   * Defines the device controller for displaying details
   */
  function DeviceController($scope, deviceService) {
    var self = this,
      activePage = 0;

    /**
     * Define the active page index
     *
     * @param index
     */
    self.setActivePage = function(index) {
      activePage = index;
    };

    /**
     * Determine if the passed index is the active page index
     *
     * @param index
     * @returns {boolean}
     */
    self.isActivePage = function(index) {
      return activePage === index;
    };

  }

  app.controller('DeviceController', DeviceController);
  DeviceController.$inject = ['$scope', 'deviceService'];

})(angular.module('ov.manage'));
