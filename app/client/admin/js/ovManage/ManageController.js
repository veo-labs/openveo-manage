'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function ManageController(
    $scope,
    $window,
    $location,
    $filter,
    devices,
    groups,
    group,
    manageService,
    entityService,
    manageName) {

    var devicesIds = [];

    // Initialize data
    if (group) {
      $scope.group = group; // Information of the group on detail page
      $scope.acceptedDevices = group.devices;
    } else {
      $scope.acceptedDevices = devices.acceptedDevices;
    }

    $scope.groups = groups;
    $scope.refusedDevices = devices.refusedDevices;
    $scope.pendingDevices = devices.pendingDevices;
    $scope.manage = {
      resize: 'normal', // Permits to resize the devices tiles (normal/medium/small)
      openedDevice: null, // Contain the id of the selected device
      showDetail: false, // Used to add a class to the selected device
      absUrl: $location.absUrl() // The URL of the current page
    };

    $scope.devicesConnexion = manageService.getDevicesConnected(); // The new pending connexions

    /**
     * Permits to organize the view when the details is opened/closed
     *
     * @param opening
     */
    $scope.organizeLayout = function(opening) {

      var screenWidth = $window.innerWidth,
        containerWidth = parseInt(document.getElementsByClassName('manage-container')[0].offsetWidth + 30),
        leftSpace = parseInt(screenWidth - containerWidth) / 2;

      if (opening && leftSpace <= 300) {
        if (containerWidth <= 750) {
          $scope.manage.resize = 'small';
        } else {
          $scope.manage.resize = 'medium';
        }
      } else {
        $scope.manage.resize = 'normal';
      }
    };

    /**
     * Go to the previous page
     */
    $scope.back = function() {
      $scope.acceptedDevices.map(function(device) {
        manageService.manageSelectedDevice(device.id);
      });
      $scope.manage.showDetail = false;
      $scope.manage.openedDevice = null;
      $scope.organizeLayout(false);
      $location.path('manage');
      $scope.manage.absUrl = $location.absUrl();
    };

    /**
     * Remove a device from a group
     *
     * @param {String} deviceId The id of the device to remove from the group
     * @param {String} groupId The id of the group from the device will be removed
     */
    $scope.removeFromGroup = function(deviceId, groupId) {
      var group = null,
        device,
        devices;

      if (!$scope.group) {
        group = manageService.getGroup(groupId);
      } else {
        group = $scope.group;
      }

      // If there is only 2 devices the group is removed
      if (group.devices.length == 2) {
        devices = angular.copy(group.devices);

        entityService.removeEntity('groups', manageName, groupId).then(function() {
          $scope.socket.emit('remove.group', {id: groupId});

          devices.map(function(device) {
            entityService.updateEntity('devices', manageName, device.id, {group: null}).then(function() {

              // Save to history
              manageService.addToHistory(device.id, 'devices', 'REMOVE_DEVICE_FROM_GROUP', device.history, group.name);
            });
          });

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_ERROR'), 4000);
        });
      } else {
        device = manageService.getDevice(deviceId);

        entityService.updateEntity('devices', manageName, deviceId, {group: null}).then(function() {
          $scope.socket.emit('group.removeDevice', {deviceId: deviceId, groupId: groupId});
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_DEVICE_GROUP_SUCCESS', '',
            {name: $filter('translate')(group.name)}), 4000);

          // Save to history
          manageService.addToHistory(deviceId, 'devices', 'REMOVE_DEVICE_FROM_GROUP', device.history, group.name);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_DEVICE_GROUP_ERROR', '',
            {name: $filter('translate')(group.name)}), 4000);
        });
      }
    };

    // Asks for devices settings only once
    if (devicesIds.length === 0) {
      $scope.acceptedDevices.map(function(device) {
        devicesIds.push(device.id);
      });
      $scope.socket.emit('settings', devicesIds);
    }
  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = [
    '$scope',
    '$window',
    '$location',
    '$filter',
    'devices',
    'groups',
    'group',
    'manageService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
