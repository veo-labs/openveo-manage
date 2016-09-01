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
    socketService,
    manageService,
    deviceService,
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

    $scope.socket = socketService.getConnexion();
    $scope.devicesConnexion = []; // Store all the new pending connexions

    /**
     * Remove a device from the device connexion object on user response
     *
     * @param {int} id The device id to remove
     */
    function removeDeviceConnected(id) {
      for (var i = 0; i < $scope.devicesConnexion.length; i++) {
        if ($scope.devicesConnexion[i].id == id) {
          $scope.devicesConnexion.splice(i, 1);
          break;
        }
      }
    }

    /**
     * Initialize all socket.io listeners
     */
    function initializeListeners() {

      // Hello listener
      $scope.socket.on('hello', function(device) {
        $scope.devicesConnexion.push(device);
        $scope.$apply();
      });

      // Device update listener
      $scope.socket.on('update', function(data) {
        manageService.updateDevice(data);
        $scope.$apply();
      });

      // Device remove listener
      $scope.socket.on('remove.device', function(data) {
        manageService.removeDevice(data.id);
        $scope.$apply();
      });

      // Device accept or refused listener after hello
      $scope.socket.on('update.state', function(data) {
        removeDeviceConnected(data.device.id);
        manageService.updateDeviceState(data.device, data.state, data.newState);
        $scope.$apply();
      });

      // Add device to group listener
      $scope.socket.on('group.addDevice', function(data) {
        manageService.addDevicesToGroup(data.firstId, data.secondId, data.group).then(function() {});
      });

      // Remove device from a group listener
      $scope.socket.on('group.removeDevice', function(data) {
        manageService.removeDeviceFromGroup(data.deviceId, data.groupId).then(function() {
          deviceService.toggleScheduledJobs(data.deviceId, data.groupId, 'removeDeviceFromGroup').then(function() {});
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_SUCCESS'), 4000);
        });
      });

      // Group delete listener
      $scope.socket.on('remove.group', function(data) {
        manageService.removeGroup(data.id);
      });
    }

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
      $window.history.back();
      $scope.manage.absUrl = $location.absUrl();
    };

    /**
     * Remove a device from a group
     *
     * @param {String} deviceId The id of the device to remove from the group
     * @param {String} groupId The id of the group from the device will be removed
     */
    $scope.removeFromGroup = function(deviceId, groupId) {
      var group = null;

      if (!$scope.group) {
        group = manageService.getGroup(groupId);
      } else {
        group = $scope.group;
      }

      // If there is only 2 devices the group is removed
      if (group.devices.length == 2) {
        entityService.removeEntity('groups', manageName, groupId).then(function() {
          $scope.socket.emit('remove.group', {id: groupId});

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_ERROR'), 4000);
        });
      } else {
        entityService.updateEntity('devices', manageName, deviceId, {group: null}).then(function() {
          $scope.socket.emit('group.removeDevice', {deviceId: deviceId, groupId: groupId});
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_GROUP_ERROR'), 4000);
        });
      }
    };


    // Initialize socket.io listeners
    initializeListeners();

    // Asks for devices settings
    $scope.acceptedDevices.map(function(device) {
      devicesIds.push(device.id);
    });
    $scope.socket.emit('settings', devicesIds);

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
    'socketService',
    'manageService',
    'deviceService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
