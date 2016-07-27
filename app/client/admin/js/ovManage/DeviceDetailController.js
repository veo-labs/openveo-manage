'use strict';

(function(app) {

  /**
   * Defines the device detail controller
   */
  function DeviceDetailController(
    $scope,
    $filter,
    $uibModal,
    deviceService,
    manageService,
    entityService,
    manageName
  ) {

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
      deviceService.clearSelectedDevice();
      $scope.organizeLayout(false);
    };

    /**
     * Remove a device
     *
     * @param id
     */
    self.removeDevice = function(id) {
      if ($scope.group && $scope.group.devices.length == 2) {
        entityService.removeEntity('devices', manageName, id).then(function() {
          entityService.removeEntity('groups', manageName, $scope.group.id).then(function() {
            manageService.removeDevice(id);
            manageService.removeGroup($scope.group.id);
            self.closeDetail();
            $scope.back();
            $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_SUCCESS'), 4000);
          });
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_ERROR'), 4000);
        });
      } else {
        entityService.removeEntity('devices', manageName, id).then(function() {
          manageService.removeDevice(id);
          self.closeDetail();
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_ERROR'), 4000);
        });
      }
    };

    /**
     * Open a modal, apply callback on OK promise and remove device
     *
     * @param id
     */
    self.openRemoveModal = function(id) {
      var modalInstance = $uibModal.open({
        templateUrl: 'removeModal.html',
        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
          $scope.ok = function() {
            $uibModalInstance.close(true);
          };

          $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
          };
        }]
      });

      modalInstance.result.then(function() {
        self.removeDevice(id);
      }, function() {
        // Do nothing
      });
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

    // Listen event to close device details window
    $scope.$on('close.window', function(event) {
      self.closeDetail();
    });

  }

  app.controller('DeviceDetailController', DeviceDetailController);
  DeviceDetailController.$inject = [
    '$scope',
    '$filter',
    '$uibModal',
    'deviceService',
    'manageService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
