'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($q, $rootScope, entityService, manageName) {

    var groups = null;
    var devices = null;

    /**
     * Add a new device
     *
     * @param {Object} device The new device
     * @method addDevice
     */
    function addDevice(device) {
      switch (device.state) {
        case 'accepted':
          devices.acceptedDevices.push(device);
          break;
        case 'pending':
          devices.pendingDevices.push(device);
          break;
        case 'refused':
          devices.refusedDevices.push(device);
          break;
        default:
      }
    }

    /**
     * Load all groups devices from server
     *
     * @private
     * @return {Promise} The promise used to retrieve groups from server
     * @method loadGroups
     */
    function loadGroups() {
      if (!groups) {
        return entityService.getAllEntities('groups', manageName).then(function(groups) {
          return groups.data.entities;
        });
      }

      return $q.when(groups);
    }

    /**
     * Ordering devices from its state
     *
     * @param {Array} workingDevices The devices to order
     * @private
     * @method orderDevices
     */
    function orderDevices(workingDevices) {

      // Prepare cache
      devices = {};
      devices.acceptedDevices = [];
      devices.pendingDevices = [];
      devices.refusedDevices = [];

      workingDevices.map(function(device) {
        addDevice(device);
        groups.map(function(group) {
          if (!group.devices) group.devices = [];
          if (group.id == device.group) {
            group.devices.push(device.id);
          }
        });
      });
    }

    /**
     * Loads devices from server for cache them
     *
     * @private
     * @method loadDevices
     */
    function loadDevices() {
      if (!devices || !groups) {
        var promises = {
          workingDevices: entityService.getAllEntities('devices', manageName),
          workingGroups: loadGroups()
        };
        return $q.all(promises).then(function(values) {
          groups = values.workingGroups;
          orderDevices(values.workingDevices.data.entities);

          return {
            groups: groups,
            acceptedDevices: devices.acceptedDevices,
            refusedDevices: devices.refusedDevices,
            pendingDevices: devices.pendingDevices
          };
        });
      }
    }

    /**
     * Return the loaded devices
     *
     * @return {Promise} The promise used to retrieve devices from server
     * @method getDevicesPromised
     */
    function getDevicesPromised() {
      if (!devices || !groups) {
        return loadDevices();
      }

      return $q.when({
        groups: groups,
        acceptedDevices: devices.acceptedDevices,
        refusedDevices: devices.refusedDevices,
        pendingDevices: devices.pendingDevices
      });
    }

    /**
     * Retrieve groups
     *
     * @returns {*}
     * @method getGroups
     */
    function getGroups() {
      return groups;
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
        return loadDevices().then(function() {
          return groups.find(function(group) {
            return group.id == id;
          });
        });
      }

      return groups.find(function(group) {
        return group.id == id;
      });
    }

    /**
     * Retrieve the group devices with group id
     *
     * @param {String} groupId the group id
     * @returns {Array}
     * @method getDevicesByGroup
     */
    function getDevicesByGroup(groupId) {
      var groupDevices = [];

      if (!devices) {
        return loadDevices().then(function() {
          devices.acceptedDevices.map(function(device) {
            if (device.group == groupId) {
              groupDevices.push(device);
            }
          });

          return groupDevices;
        });
      }

      devices.acceptedDevices.map(function(device) {
        if (device.group == groupId) {
          groupDevices.push(device);
        }
      });

      return groupDevices;
    }

    /**
     * Remove a group with its id and clear the devices
     *
     * @param id
     * @method removeGroup
     */
    function removeGroup(id) {
      var devices = getDevicesByGroup(id),
        groupIndex = groups.findIndex(function(groupId) {
          return id == groupId;
        });

      // Update devices belonging to the group
      devices.map(function(device) {
        entityService.updateEntity('devices', manageName, device.id, {group: null}).then(function() {
          delete device.group;
        });
      });

      groups.splice(groupIndex, 1);
    }

    /**
     * Retrieve a group with complete devices with its id
     *
     * @param {String} id The group id
     * @return group
     * @method getGroup
     */
    function getGroupWithFullDevices(id) {
      var devices = [];

      if (!groups) {
        return loadDevices().then(function() {
          return groups.find(function(group) {
            if (group.id == id) {
              devices = getDevicesByGroup(group.id);
              group.devices = devices;

              return group;
            }
          });
        });
      }

      return groups.find(function(group) {
        if (group.id == id) {
          devices = getDevicesByGroup(group.id);
          group.devices = devices;

          return group;
        }
      });
    }

    /**
     * Define groups
     *
     * @param {Array} data An array of groups
     * @method setGroups
     */
    function setGroups(data) {
      groups = data;
    }

    /**
     * Add a group to the groups
     *
     * @param {Object} group The new group
     * @method addGroup
     */
    function addGroup(group) {
      groups.push(group);
    }

    /**
     * Update a device
     *
     * @param {Object} device The updated device
     * @method updateDevice
     */
    function updateDevice(device) {
      if (device) {
        var index = devices.acceptedDevices.findIndex(function(workingDevice) {
          return workingDevice.id == device.id;
        });

        devices.acceptedDevices[index] = device;
      }
    }

    /**
     * Retrieve all devices
     *
     * @returns {*}
     * @method getDevices
     */
    function getDevices() {
      return devices;
    }

    /**
     * Retrieve a device with its id
     *
     * @param {String} id the device id
     * @returns {*|{}}
     * @method getDevice
     */
    function getDevice(id) {
      if (!devices) {
        return loadDevices().then(function() {
          return devices.acceptedDevices.find(function(device) {
            return device.id == id;
          });
        });
      }

      return devices.acceptedDevices.find(function(device) {
        return device.id == id;
      });
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
     * Define devices
     *
     * @param {Array} data An array of devices
     * @method setDevices
     */
    function setDevices(data) {
      devices = data;
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
      if (selectedDevice && id === selectedDevice.id) {
        device.isSelected = true;
      } else {
        device.isSelected = false;
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
      var index = devices.acceptedDevices.findIndex(function(workingDevice) {
        return workingDevice.id == draggableId;
      });

      if (group) {
        group.devices = [];
        group.devices.push(draggableId, dropzoneId);
        groups.push(group);

        devices.acceptedDevices[index].group = group.id;
        index = devices.acceptedDevices.findIndex(function(workingDevice) {
          return workingDevice.id == dropzoneId;
        });

        devices.acceptedDevices[index].group = group.id;
      } else {
        groups.map(function(group) {
          if (group.id == dropzoneId) {
            group.devices.push(draggableId);
            devices.acceptedDevices[index].group = group.id;
          }
        });
      }

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

    /**
     *
     *
     * @param {String} deviceId The device id
     * @param {Object} schedule The new schedule to add to the device
     * @returns {*|r.promise|promise}
     * @method addSchedule
     */
    function addSchedule(deviceId, schedule) {
      var defer = $q.defer(),
        device = (getDevice(deviceId)) ? getDevice(deviceId) : getGroup(deviceId);

      if (!device.schedules) {
        device.schedules = [];
      }

      device.schedules.push(schedule);
      defer.resolve(device);

      return defer.promise;
    }

    return {
      getGroups: getGroups,
      getGroup: getGroup,
      getGroupWithFullDevices: getGroupWithFullDevices,
      setGroups: setGroups,
      addGroup: addGroup,
      removeGroup: removeGroup,
      getDevices: getDevices,
      getDevice: getDevice,
      removeDevice: removeDevice,
      getDevicesByGroup: getDevicesByGroup,
      setDevices: setDevices,
      addDevice: addDevice,
      updateDevice: updateDevice,
      getDevicesPromised: getDevicesPromised,
      updateDeviceState: updateDeviceState,
      manageSelectedDevice: manageSelectedDevice,
      addDevicesToGroup: addDevicesToGroup,
      removeDeviceFromGroup: removeDeviceFromGroup,
      addSchedule: addSchedule
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = [
    '$q',
    '$rootScope',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
