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

    self.displayDeviceNameForm = function() {
      self.selectedDeviceName = self.selectedDevice.name;
      self.selectedDevice.displayInputName = !self.selectedDevice.displayInputName;
    };

    /**
     * Update device name and send event to device
     *
     * @param name
     */
    self.updateName = function(name) {
      var model = (self.selectedDevice.devices) ? 'groups' : 'devices';

      entityService.updateEntity(model, manageName, self.selectedDevice.id, {name: name}).then(function() {
        self.selectedDevice.name = name;
        manageService.updateDevice(self.selectedDevice);
        self.selectedDevice.displayInputName = !self.selectedDevice.displayInputName;

        // Send event to save the new name (not for groups)
        if (!self.selectedDevice.devices) {
          $scope.socket.emit('update.name', {id: self.selectedDevice.id, name: name});
        }
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.UPDATE_NAME_SUCCESS'), 4000);
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.UPDATE_NAME_ERROR'), 4000);
      });
    };

    // Listen event to load the selected device details and ask for presets
    $scope.$on('device.details', function(event) {
      self.selectedDevice = deviceService.getSelectedDevice();
      if (!self.selectedDevice.devices) {
        $scope.socket.emit('settings.presets', [self.selectedDevice.id]);
      }
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