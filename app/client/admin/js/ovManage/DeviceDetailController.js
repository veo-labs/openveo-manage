'use strict';

(function(app) {

  /**
   * Defines the device detail controller
   */
  function DeviceDetailController($scope, manageService) {

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

  app.controller('DeviceDetailController', DeviceDetailController);
  DeviceDetailController.$inject = [
    '$scope',
    'manageService'
  ];

})(angular.module('ov.manage'));
