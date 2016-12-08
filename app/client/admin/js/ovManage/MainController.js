'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function MainController(
    $q,
    $scope,
    $window,
    $location,
    $filter,
    $route,
    $rootScope,
    $timeout,
    devices,
    groups,
    ManageFactory,
    GroupFactory,
    DeviceFactory,
    SocketService,
    entityService,
    MANAGE_NAME,
    DEVICE_STATES,
    DEVICE_STATUS,
    MANAGEABLE_TYPES) {

    var devicesIds = [],
      activePage = 0,
      group = GroupFactory.getGroup($route.current.params.id);

    // Add devices to groups
    GroupFactory.addDevices(devices[DEVICE_STATES.ACCEPTED]);

    // Initialize data
    if (group) {
      $scope.group = group;
      $scope.acceptedDevices = group.devices;
    } else {
      $scope.acceptedDevices = devices[DEVICE_STATES.ACCEPTED];
    }

    $scope.DEVICE_STATES = DEVICE_STATES;
    $scope.DEVICE_STATUS = DEVICE_STATUS;
    $scope.MANAGEABLE_TYPES = MANAGEABLE_TYPES;
    $scope.groups = groups;
    $scope.refusedDevices = devices[DEVICE_STATES.REFUSED];
    $scope.pendingDevices = devices[DEVICE_STATES.PENDING];
    $scope.manage = {
      resize: 'normal', // Permits to resize the devices tiles (normal/medium/small)
      openedItem: null, // Contain the id of the selected device
      showDetail: false, // Used to add a class to the selected device
      absUrl: $location.absUrl() // The URL of the current page
    };

    $scope.incomingDevices = DeviceFactory.getDevicesByState(DEVICE_STATES.INCOMING); // The new incoming devices

    // Initialize socket.io connection
    if (!$scope.socket) {
      $scope.socket = SocketService.initSocket();

      // Listen for the server informing about a new connected device with :
      //   - **Object** device The new connected device information
      $scope.socket.on('device.connect', function(device) {
        if (device) {
          DeviceFactory.addDevice(device, DEVICE_STATES.PENDING);
          $scope.$apply();
        }
      });

      // Listen for the server requesting a manageable to be removed with :
      //   - **Object** date Data from server with :
      //     - **String** id The manageable id
      //     - **String** type The manageable type
      $scope.socket.on('remove', function(data) {
        if (data.type === MANAGEABLE_TYPES.DEVICE) {
          var device = DeviceFactory.getDevice(data.id);

          // Remove device from its group
          if (device && device.group) {
            var group = GroupFactory.getGroup(device.group);
            GroupFactory.removeDeviceFromGroup(device, device.group);

            if (!group.devices.length)
              GroupFactory.removeGroup(device.group);
          }

          DeviceFactory.remove(data.id);
          $scope.$broadcast('manageable.closeDetails');
        } else if (data.type === MANAGEABLE_TYPES.GROUP) {
          GroupFactory.removeGroup(data.id);

          // Navigate back if we are in a group page
          if ($route.current.params.id)
            $scope.$broadcast('back');
          else
            $scope.$broadcast('manageable.closeDetails');
        }
      });

      // Listen for server requesting a modification on a manageable :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **String** key The property to update
      //     - **Mixed** value The property value
      //     - **String** type The manageable type
      $scope.socket.on('update', function(data) {
        if (data.type === MANAGEABLE_TYPES.DEVICE) {
          var device = DeviceFactory.getDevice(data.id);
          DeviceFactory.setProperty(data.id, data.key, data.value);
          GroupFactory.updateStatus(device.group);
        } else
          GroupFactory.setProperty(data.id, data.key, data.value);

        $scope.$apply();
      });

      // Listen for server requesting an historic to be added to the history of a manageable with :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **Object** historic The historic to add to history
      //     - **String** type The manageable type
      $scope.socket.on('addHistoric', function(data) {
        var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
        factory.addHistoric(data.id, data.historic);
        $scope.$apply();
      });

      // Listen for server requesting an historic to be removed from the history of a manageable with :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **Object** historicId The historic id
      //     - **String** type The manageable type
      $scope.socket.on('removeHistoric', function(data) {
        var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
        factory.removeHistoric(data.id, data.historicId);
        $scope.$apply();
      });

      // Listen for server requesting a manageable's history to be removed with :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **String** type The manageable type
      $scope.socket.on('removeHistory', function(data) {
        var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
        factory.removeHistory(data.id);
        $scope.$apply();
      });

      // Listen for server requesting a schedule to be added to a manageable with :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **Object** schedule The schedule
      //     - **String** type The manageable type
      $scope.socket.on('addSchedule', function(data) {
        var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
        factory.addSchedule(data.id, data.schedule);
        $scope.$apply();
      });

      // Listen for server requesting a schedule to be removed from a manageable with :
      //   - **Object** data Data from server with :
      //     - **String** id The manageable id
      //     - **Object** scheduleId The schedule id
      //     - **String** type The manageable type
      $scope.socket.on('removeSchedule', function(data) {
        var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
        factory.removeSchedule(data.id, data.scheduleId);
        $scope.$apply();
      });

      // Listen for server requesting state modification on a device :
      //   - **Object** data Data from server with :
      //     - **String** id The device id
      //     - **String** state The device new state
      $scope.socket.on('device.updateState', function(data) {
        DeviceFactory.updateDeviceState(data.id, data.state);
        $scope.$apply();
      });

      // Listen for server requesting a group to be created :
      //   - **Object** data Data from server with :
      //     - **Object** group The group to add
      $scope.socket.on('group.create', function(data) {
        if (data.group)
          GroupFactory.addGroup(data.group);
      });

      // Listen for server requesting a device to be added to a group :
      //   - **Object** data Data from server with :
      //     - **String** deviceId The device id
      //     - **String** groupId The group id
      $scope.socket.on('group.addDevice', function(data) {
        if (data.deviceId && data.groupId) {
          GroupFactory.addDeviceToGroup(DeviceFactory.getDevice(data.deviceId), data.groupId);

          // Send an event to close the device detail window
          $timeout(function() {
            $rootScope.$broadcast('manageable.closeDetails');
          }, 250);

        }
      });

      // Listen for server requesting a device to be removed from a group :
      //   - **Object** data Data from server with :
      //     - **String** id The device id
      $scope.socket.on('group.removeDevice', function(data) {
        var device = DeviceFactory.getDevice(data.id);

        if (device) {
          var group = GroupFactory.getGroup(device.group);

          if (group) {

            GroupFactory.removeDeviceFromGroup(device, device.group);

            // Send an event to close the device detail window
            $rootScope.$broadcast('manageable.closeDetails');

          }

        }

      });
    }

    /**
     * Defines the active page index.
     *
     * @param index The tab index
     */
    $scope.setActivePage = function(index) {
      activePage = index;
    };

    /**
     * Determines if the passed index is the active page index.
     *
     * @param index The tab index
     * @return {Boolean} true if the given index is the selected tab index
     */
    $scope.isActivePage = function(index) {
      return activePage === index;
    };

    /**
     * Permits to organize the view when the details is opened/closed.
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
     * Navigates to the previous page in browser's history.
     */
    $scope.back = function() {

      // Remove an eventually selected device or group
      $scope.acceptedDevices.forEach(function(device) {
        $rootScope.$broadcast('manageable.load', device.id, false);
      });
      $scope.groups.forEach(function(group) {
        $rootScope.$broadcast('manageable.load', group.id, true);
      });
      $scope.manage.showDetail = false;
      $scope.manage.openedItem = null;
      $scope.organizeLayout(false);
      $location.path('manage');
      $scope.manage.absUrl = $location.absUrl();
    };

    /**
     * Removes a group.
     *
     * @param {String} id The id of the group to remove
     */
    $scope.removeGroup = function(id) {
      ManageFactory.remove(id, MANAGEABLE_TYPES.GROUP).catch(function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.GROUP.REMOVE_ERROR', null, {
          code: error.code
        }), 4000);
      });
    };

    /**
     * Removes a device from its group.
     *
     * @param {String} id The id of the device to remove
     */
    $scope.removeFromGroup = function(id) {
      var device = DeviceFactory.getDevice(id);
      var group = GroupFactory.getGroup(device.group);

      // If there is only 2 devices the group is removed
      if (group.devices.length == 2) {

        // Remove group
        $scope.removeGroup(group.id);

      } else {
        ManageFactory.removeDeviceFromGroup(device.id).then(function() {
          GroupFactory.removeDeviceFromGroup(device.id, device.group);
        }, function(error) {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.GROUP.REMOVE_DEVICE_ERROR', null, {
            code: error.code,
            name: $filter('translate')(device.name)
          }), 4000);
        });
      }
    };

    // Asks for devices settings only once
    if (!devicesIds.length) {
      $scope.acceptedDevices.forEach(function(device) {
        devicesIds.push(device.id);
      });

      if (devicesIds.length)
        ManageFactory.askForDevicesSettings(devicesIds);
    }
  }

  app.controller('ManageMainController', MainController);
  MainController.$inject = [
    '$q',
    '$scope',
    '$window',
    '$location',
    '$filter',
    '$route',
    '$rootScope',
    '$timeout',
    'manageDevices',
    'manageGroups',
    'ManageFactory',
    'ManageGroupFactory',
    'ManageDeviceFactory',
    'ManageSocketService',
    'entityService',
    'MANAGE_NAME',
    'MANAGE_DEVICE_STATES',
    'MANAGE_DEVICE_STATUS',
    'MANAGE_MANAGEABLE_TYPES'
  ];

})(angular.module('ov.manage'));
