'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function ManageController($scope, $window, $location, results, group, socketService) {
    var self = this,
      devicesId = [];

    $scope.groups = results.groups;
    $scope.acceptedDevices = results.acceptedDevices;
    $scope.refusedDevices = results.refusedDevices;
    $scope.pendingDevices = results.pendingDevices;
    $scope.manage = {
      resize: 'normal',
      deviceSelected: false,
      absUrl: $location.absUrl()
    };

    $scope.socket = socketService.getConnexion();
    $scope.devicesConnexion = [];

    // Initialize group detail
    if (group) {
      $scope.groupDetails = {
        group: group.group,
        devices: group.devices
      };
    }

    // Define hello listener
    $scope.socket.on('hello', function(data) {
      $scope.devicesConnexion.push(data);
      $scope.$apply();
    });


    /**
     * Remove an ui-state from all devices
     * @param uiState
     */
    $scope.clearUiState = function(uiState) {
      var index,
        devices = ($scope.groupDetails) ? $scope.groupDetails.devices : $scope.acceptedDevices;

      $scope.groups.map(function(group) {
        if (group['ui-state']) {
          index = group['ui-state'].indexOf(uiState);
          if (index > -1) {
            group['ui-state'].splice(index, 1);
          }
        }
      });
      devices.map(function(device) {
        if (device['ui-state']) {
          index = device['ui-state'].indexOf(uiState);
          if (index > -1) {
            device['ui-state'].splice(index, 1);
          }
        }
      });
    };

    /**
     * Go to the previous page
     */
    self.back = function() {
      $scope.manage.deviceSelected = false;
      $scope.clearUiState('selected');
      $window.history.back();
      $scope.manage.absUrl = $location.absUrl();
    };

    // Ask for devices storage
    $scope.acceptedDevices.map(function(device) {
      devicesId.push(device.id);
    });
    $scope.socket.emit('storage', devicesId);

  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = [
    '$scope',
    '$window',
    '$location',
    'results',
    'group',
    'socketService'
  ];

})(angular.module('ov.manage'));
