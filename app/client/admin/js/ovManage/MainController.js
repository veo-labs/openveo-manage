'use strict';

(function(app) {

  /**
   * Defines the manage controller.
   *
   * @class ManageMainController
   * @memberof module:ov.manage
   * @inner
   * @ignore
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
    SocketFactory,
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
    $scope.socket = SocketFactory.initSocket();

    /**
     * Handles messages from the server informing about a new connected device.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} device The new connected device information
     */
    function handleDeviceConnected(device) {
      if (device) {
        DeviceFactory.addDevice(device, DEVICE_STATES.INCOMING);
        $scope.$apply();
      }
    }

    /**
     * Handles messages from the server requesting a manageable to be removed.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {String} data.type The manageable type
     */
    function handleRemoved(data) {
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
    }

    /**
     * Handles messages from the server requesting a modification on a manageable.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {String} data.key The property to update
     * @param {*} data.value The property value
     * @param {String} data.type The manageable type
     */
    function handleUpdated(data) {
      if (data.type === MANAGEABLE_TYPES.DEVICE) {
        var device = DeviceFactory.getDevice(data.id);
        DeviceFactory.setProperty(data.id, data.key, data.value);
        GroupFactory.updateStatus(device.group);
      } else
        GroupFactory.setProperty(data.id, data.key, data.value);

      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting an historic to be added to the history of a manageable.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {Object} data.historic The historic to add to history
     * @param {String} data.type The manageable type
     */
    function handleNewHistoric(data) {
      var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
      factory.addHistoric(data.id, data.historic);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting an historic to be removed from the history of a manageable.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {Object} data.historicId The historic id
     * @param {String} data.type The manageable type
     */
    function handleRemovedHistoric(data) {
      var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
      factory.removeHistoric(data.id, data.historicId);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting a manageable's history to be removed.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {String} data.type The manageable type
     */
    function handleRemovedHistory(data) {
      var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
      factory.removeHistory(data.id);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting a schedule to be added to a manageable.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {Object} data.schedule The schedule
     * @param {String} data.type The manageable type
     */
    function handleNewSchedule(data) {
      var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
      factory.addSchedule(data.id, data.schedule);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting a schedule to be removed from a manageable.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The manageable id
     * @param {Object} data.scheduleId The schedule id
     * @param {String} data.type The manageable type
     */
    function handleRemovedSchedule(data) {
      var factory = (data.type === MANAGEABLE_TYPES.DEVICE) ? DeviceFactory : GroupFactory;
      factory.removeSchedule(data.id, data.scheduleId);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting state modification on a device.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The device id
     * @param {String} data.state The device new state
     */
    function handleDeviceUpdatedState(data) {
      DeviceFactory.updateDeviceState(data.id, data.state);
      $scope.$apply();
    }

    /**
     * Handles messages from the server requesting a group to be created.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {Object} data.group The group to add
     */
    function handleGroupCreated(data) {
      if (data.group)
        GroupFactory.addGroup(data.group);
    }

    /**
     * Handles messages from the server requesting a device to be added to a group.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.deviceId The device id
     * @param {String} data.groupId The group id
     */
    function handleGroupNewDevice(data) {
      if (data.deviceId && data.groupId) {
        GroupFactory.addDeviceToGroup(DeviceFactory.getDevice(data.deviceId), data.groupId);

        // Send an event to close the device detail window
        $timeout(function() {
          $rootScope.$broadcast('manageable.closeDetails');
        }, 250);

      }
    }

    /**
     * Handles messages from the server requesting a device to be removed from a group.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @private
     * @param {Object} data Data from server
     * @param {String} data.id The device id
     */
    function handleGroupRemovedDevice(data) {
      var device = DeviceFactory.getDevice(data.id);

      if (device) {
        var group = GroupFactory.getGroup(device.group);

        if (group) {

          GroupFactory.removeDeviceFromGroup(device, device.group);

          // Send an event to close the device detail window
          $rootScope.$broadcast('manageable.closeDetails');

        }

      }

    }

    $scope.socket.on('device.connected', handleDeviceConnected);
    $scope.socket.on('removed', handleRemoved);
    $scope.socket.on('updated', handleUpdated);
    $scope.socket.on('newHistoric', handleNewHistoric);
    $scope.socket.on('removedHistoric', handleRemovedHistoric);
    $scope.socket.on('removedHistory', handleRemovedHistory);
    $scope.socket.on('newSchedule', handleNewSchedule);
    $scope.socket.on('removedSchedule', handleRemovedSchedule);
    $scope.socket.on('device.updatedState', handleDeviceUpdatedState);
    $scope.socket.on('group.created', handleGroupCreated);
    $scope.socket.on('group.newDevice', handleGroupNewDevice);
    $scope.socket.on('group.removedDevice', handleGroupRemovedDevice);

    /**
     * Defines the active page index.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @param index The tab index
     */
    $scope.setActivePage = function(index) {
      activePage = index;
    };

    /**
     * Determines if the passed index is the active page index.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @param index The tab index
     * @return {Boolean} true if the given index is the selected tab index
     */
    $scope.isActivePage = function(index) {
      return activePage === index;
    };

    /**
     * Permits to organize the view when the details is opened/closed.
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @param {Boolean} opening ????
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
     *
     * @memberof module:ov.manage~ManageMainController
     * @instance
     */
    $scope.back = function() {
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
     * @memberof module:ov.manage~ManageMainController
     * @instance
     * @param {String} id The id of the device to remove
     */
    $scope.removeFromGroup = function(id) {
      var device = DeviceFactory.getDevice(id);
      var group = GroupFactory.getGroup(device.group);

      // If there is only 2 devices the group is removed
      if (group.devices.length == 2) {

        // Remove group
        $scope.removeGroup(group.id);
        $rootScope.$broadcast('manageable.closeDetails');

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

    $scope.$on('$destroy', function() {
      $scope.socket.off('device.connected', handleDeviceConnected);
      $scope.socket.off('removed', handleRemoved);
      $scope.socket.off('updated', handleUpdated);
      $scope.socket.off('newHistoric', handleNewHistoric);
      $scope.socket.off('removedHistoric', handleRemovedHistoric);
      $scope.socket.off('removedHistory', handleRemovedHistory);
      $scope.socket.off('newSchedule', handleNewSchedule);
      $scope.socket.off('removedSchedule', handleRemovedSchedule);
      $scope.socket.off('device.updatedState', handleDeviceUpdatedState);
      $scope.socket.off('group.created', handleGroupCreated);
      $scope.socket.off('group.newDevice', handleGroupNewDevice);
      $scope.socket.off('group.removedDevice', handleGroupRemovedDevice);
    });
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
    'SocketFactory',
    'entityService',
    'MANAGE_NAME',
    'MANAGE_DEVICE_STATES',
    'MANAGE_DEVICE_STATUS',
    'MANAGE_MANAGEABLE_TYPES'
  ];

})(angular.module('ov.manage'));
