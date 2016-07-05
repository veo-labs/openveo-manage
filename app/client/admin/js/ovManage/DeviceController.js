'use strict';

(function(app) {

  /**
   * Defines the device controller for displaying details
   */
  function DeviceController($scope, $filter, manageService, socketService, entityService, manageName) {
    var self = this,
      socket,
      activePage = 0;

    // Available state for device
    self.STATE_ACCEPTED = 'accepted';
    self.STATE_PENDING = 'pending';
    self.STATE_REFUSED = 'refused';

    $scope.devicesConnexion = [];

    // Get socket and define hello listener
    socket = socketService.getConnexion();
    socket.on('hello', function(data) {
      $scope.devicesConnexion.push(data);
      $scope.$apply();
    });

    /**
     * Add pending/refused device to the accepted list of devices
     *
     * @param device
     * @param state
     */
    self.addToAcceptedDevices = function(device, state) {
      var deviceToSave = {state: self.STATE_ACCEPTED};

      entityService.updateEntity('devices', manageName, device.id, deviceToSave).then(function() {
        manageService.updateDevicesList(device, state, true).then(function() {
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        });
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
      });
    };

    /**
     * Add the new device to the refused list of devices
     *
     * @param device
     * @param state
     */
    self.addToRefusedDevices = function(device, state) {
      device.state = self.STATE_REFUSED;

      entityService.updateEntity('devices', manageName, device.id, device).then(function() {
        manageService.updateDevicesList(device, state, false).then(function() {
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        });
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
      });
    };

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
  DeviceController.$inject = ['$scope', '$filter', 'manageService', 'socketService', 'entityService', 'manageName'];

})(angular.module('ov.manage'));
