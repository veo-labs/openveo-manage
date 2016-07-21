'use strict';

(function(app) {

  /**
   * Defines the device detail controller
   */
  function DeviceDetailController($scope, deviceService) {

    var self = this,
      activePage = 0;

    // The stored selected device
    self.selectedDevice = null;

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

    /**
     * Close the device detail window
     */
    self.closeDetail = function() {
      $scope.clearUiState('selected');
      $scope.manage.showDetail = false;
      $scope.manage.openedDevice = null;
      self.selectedDevice = null;
      $scope.organizeLayout(false);
    };

    // Listen event to load the selected device details
    $scope.$on('device.details', function(event) {
      self.selectedDevice = deviceService.getSelectedDevice();
      $scope.socket.emit('device.details', [self.selectedDevice.id]);
    });

    // Listen event to remove the selected device
    $scope.$on('closeDeviceDetails', function(event) {
      self.selectedDevice = null;
    });

  }

  app.controller('DeviceDetailController', DeviceDetailController);
  DeviceDetailController.$inject = [
    '$scope',
    'deviceService'
  ];

})(angular.module('ov.manage'));
