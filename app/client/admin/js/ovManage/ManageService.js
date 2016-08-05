'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($q, $rootScope, $route, $timeout, entityService, manageName) {

    var groups = null;
    var devices = null;

    /**
     * Gets all groups devices from server
     *
     * @return {Promise} The promise used to retrieve groups from server
     * @method getGroups
     */
    function getGroups() {
      if (!groups) {
        return entityService.getAllEntities('groups', manageName).then(function(results) {
          groups = results.data.entities;

          return groups;
        });
      }

      return $q.when(groups);
    }

    /**
     * Gets devices from server for cache them
     *
     * @method getDevices
     */
    function getDevices() {
      if (!devices) {
        return entityService.getAllEntities('devices', manageName).then(function(results) {
          devices = results.data.entities;

          return devices;
        });
      }

      return $q.when(devices);
    }

    /**
     * Retrieve a group with its id
     *
     * @param {String} id The group id
     * @return group
     * @method getGroup
     */
    function getGroup(id) {
      if (!groups) {
        return getGroups().then(function() {
          return groups.find(function(group) {
            return group.id == id;
          });
        });
      }

      return groups.find(function(group) {
        return group.id === id;
      });
    }

    /**
     * Remove a group with its id and clear the devices
     *
     * @param id
     * @method removeGroup
     */
    function removeGroup(id) {
      var group = getGroup(id),
        groupIndex = groups.findIndex(function(groupId) {
          return id == groupId;
        });

      // Update devices belonging to the group
      group.devices.map(function(device) {
        entityService.updateEntity('devices', manageName, device.id, {group: null}).then(function() {
          delete device.group;
        });
      });

      groups.splice(groupIndex, 1);
    }

    /**
     * Retrieve a device with its id
     *
     * @param {String} id the device id
     * @returns {*|{}}
     * @method getDevice
     */
    function getDevice(id) {

      // Find device in group if user is in group detail page
      if ($route.current.params.id) {
        if (!groups) {
          return getGroups().then(function() {
            for (var i = 0; i < groups.length; i++) {
              if (groups[i].id === $route.current.params.id) {
                return groups[i].devices.find(function(device) {
                  return device.id === id;
                });
              }
            }
          });
        }

        for (var i = 0; i < groups.length; i++) {
          if (groups[i].id === $route.current.params.id) {
            return groups[i].devices.find(function(device) {
              return device.id === id;
            });
          }
        }
      } else {
        if (!devices) {
          return getDevices().then(function() {
            return devices.acceptedDevices.find(function(device) {
              return device.id == id;
            });
          });
        }

        return devices.acceptedDevices.find(function(device) {
          return device.id == id;
        });
      }
    }

    /**
     * Update a device
     *
     * @param {Object} device The updated device
     * @method updateDevice
     */
    function updateDevice(result) {
      var device = getDevice(result.id);

      device[result.key] = result.data;

      if (result.key === 'status') {
        switch (device.status) {
          case 'stopped':
            device.state = 'MANAGE.DEVICE.READY';
            break;
          case 'error':
            device.state = 'MANAGE.DEVICE.ERROR';
            break;
          case 'started':
            device.state = 'MANAGE.DEVICE.RECORDING';
            break;
          case 'starting':
            device.state = 'MANAGE.DEVICE.STARTING';
            break;
          default:
            device.state = 'MANAGE.DEVICE.DISCONNECTED';
        }
      }
    }

    /**
     * Remove a device with its id
     *
     * @param id
     * @method removeDevice
     */
    function removeDevice(id) {
      var deviceIndex = devices.acceptedDevices.findIndex(function(workingDevice) {
        return id == workingDevice.id;
      });

      devices.acceptedDevices.splice(deviceIndex, 1);
    }

    /**
     * Update the lists of devices after an update device state
     *
     * @param {Object} device The updated device
     * @param {String} state The initial state of the updated device
     * @param {String} newState The new state of the device
     * @returns {Promise}
     * @method updateDeviceState
     */
    function updateDeviceState(device, state, newState) {
      var index = devices[state].findIndex(function(workingDevice) {
        return workingDevice.id == device.id;
      });

      if (index !== -1) {
        devices[state].splice(index, 1);
      }
      device.state = newState;

      if (newState === 'accepted') {
        devices.acceptedDevices.push(device);
      } else {
        devices.refusedDevices.push(device);
      }

      return $q.when(devices);
    }

    /**
     * Permits the set an attribute to the selected device
     *
     * @param {String} id The id of the device to test
     * @param {Object} selectedDevice The actual selected device
     * @param {String} lastSelectedId The last selected device known
     * @method manageSelectedDevice
     */
    function manageSelectedDevice(id, selectedDevice, lastSelectedId) {
      var device = (getDevice(id)) ? getDevice(id) : getGroup(id),
        lastDevice = null;

      // Remove the last selected device state if defined
      if (lastSelectedId) {
        lastDevice = (getDevice(lastSelectedId)) ? getDevice(lastSelectedId) : getGroup(lastSelectedId);
        lastDevice.isSelected = false;
      }

      // Verify if the device is selected or not
      if (device) {
        if (selectedDevice && id === selectedDevice.id) {
          device.isSelected = true;
        } else {
          device.isSelected = false;
        }
      }
    }

    /**
     * Update the cache when devices are added to a group
     *
     * @param {String} draggableId A device id
     * @param {String} dropzoneId A device or group id
     * @param {Object} group The new group to add devices
     * @returns {*}
     * @method addDevicesToGroup
     */
    function addDevicesToGroup(draggableId, dropzoneId, group) {
      var firstIndex = devices.acceptedDevices.findIndex(function(workingDevice) {
        return workingDevice.id == draggableId;
      });
      var secondIndex = devices.acceptedDevices.findIndex(function(workingDevice) {
        return workingDevice.id == dropzoneId;
      });

      if (group) {
        group.devices = [];
        devices.acceptedDevices[firstIndex].group = group.id;
        devices.acceptedDevices[secondIndex].group = group.id;

        group.devices.push(devices.acceptedDevices[firstIndex], devices.acceptedDevices[secondIndex]);
        groups.push(group);
      } else {
        groups.map(function(group) {
          if (group.id == dropzoneId) {
            devices.acceptedDevices[firstIndex].group = group.id;
            group.devices.push(devices.acceptedDevices[firstIndex]);
          }
        });
      }

      // Send an event to close the device detail window
      $timeout(function() {
        $rootScope.$broadcast('close.window');
      }, 250);

      return $q.when({
        groups: groups,
        devices: devices
      });
    }

    /**
     * Remove a device from its group
     *
     * @param {String} deviceId The device id
     * @param {String} groupId The group id
     * @returns {r.promise|*|promise}
     * @method removeDeviceFromGroup
     */
    function removeDeviceFromGroup(deviceId, groupId) {
      var defer = $q.defer(),
        group = getGroup(groupId),
        device = getDevice(deviceId, true),
        deviceIndex = group.devices.findIndex(function(id) {
          return id == deviceId;
        });

      group.devices.splice(deviceIndex, 1);
      delete device.group;

      defer.resolve();

      // Send an event to close the device detail window
      $rootScope.$broadcast('close.window');

      return defer.promise;
    }

    return {
      getGroups: getGroups,
      getDevices: getDevices,
      getGroup: getGroup,
      removeGroup: removeGroup,
      getDevice: getDevice,
      removeDevice: removeDevice,
      updateDevice: updateDevice,
      updateDeviceState: updateDeviceState,
      manageSelectedDevice: manageSelectedDevice,
      addDevicesToGroup: addDevicesToGroup,
      removeDeviceFromGroup: removeDeviceFromGroup
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = [
    '$q',
    '$rootScope',
    '$route',
    '$timeout',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
