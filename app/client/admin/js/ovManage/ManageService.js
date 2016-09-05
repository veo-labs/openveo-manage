'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($http, $q, $rootScope, $route, $timeout, entityService, manageName) {

    var groups = null,
      devices = null,
      devicesConnexion = [],
      basePath = '/be/manage/';

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
     * Save the event to the history
     *
     * @param {String} id The id of the device or the group
     * @param {String} model The type of entity [devices/groups]
     * @param {String} action The type of history action
     * @param {Object} history The history object to save
     * @param {String | null} name The name to save as message parameter
     * @method addToHistory
     */
    function addToHistory(id, model, action, history, name) {
      $http.post(basePath + 'addHistoryToEntity/' + id, {entityType: model, action: action, history: history,
        name: name}).then(function() {});
    }

    /**
     * Remove a group with its id and clear the devices
     *
     * @param id
     * @method removeGroup
     */
    function removeGroup(id) {
      var groupIndex = groups.findIndex(function(data) {
        return id == data.id;
      });

      if (groupIndex !== -1)
        groups.splice(groupIndex, 1);

      if ($route.current.params.id) {
        $rootScope.$broadcast('back');
      } else {
        $rootScope.$broadcast('close.window');
      }
    }

    /**
     * Retrieve a device with its id
     *
     * @param {String} id the device id
     * @returns {*|{}}
     * @method getDevice
     */
    function getDevice(id) {

      var result = {};

      if (!devices) {
        return getDevices().then(function() {
          devices.acceptedDevices.map(function(device) {
            if (device.id === id) {
              result = device;
            }
          });
          devices.pendingDevices.map(function(device) {
            if (device.id === id) {
              result = device;
            }
          });
          devices.refusedDevices.map(function(device) {
            if (device.id === id) {
              result = device;
            }
          });
        });
      }

      devices.acceptedDevices.map(function(device) {
        if (device.id === id) {
          result = device;
        }
      });
      devices.pendingDevices.map(function(device) {
        if (device.id === id) {
          result = device;
        }
      });
      devices.refusedDevices.map(function(device) {
        if (device.id === id) {
          result = device;
        }
      });

      return result;
    }

    /**
     * Update a device
     *
     * @param {Object} device The updated device
     * @method updateDevice
     */
    function updateDevice(result) {
      var device = getGroup(result.id) ? getGroup(result.id) : getDevice(result.id);

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
          case 'disconnected':
            delete device.presets;
            delete device.inputs;
            delete device.storage;
            break;
          default:
            device.state = 'MANAGE.DEVICE.DISCONNECTED';
        }
      }

      // Keep the devices of a group up to date
      if (device.group) {
        for (var i = 0; i < groups.length; i++) {
          if (groups[i].id === device.group) {
            for (var j = 0; j < groups[i].devices.length; j++) {
              if (groups[i].devices[j].id === device.id) {
                groups[i].devices[j] = device;
                break;
              }
            }
          }
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

      if (deviceIndex !== -1)
        devices.acceptedDevices.splice(deviceIndex, 1);

      // Send an event to close the device detail window
      $rootScope.$broadcast('close.window');
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
      var device = (getGroup(id)) ? getGroup(id) : getDevice(id),
        lastDevice = null;

      // Remove the last selected device state if defined
      if (lastSelectedId) {
        lastDevice = (getGroup(lastSelectedId)) ? getGroup(lastSelectedId) : getDevice(lastSelectedId);
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
    }

    /**
     * Remove a device from its group
     *
     * @param {String} deviceId The device id
     * @param {String} groupId The group id
     * @method removeDeviceFromGroup
     */
    function removeDeviceFromGroup(deviceId, groupId) {
      var group = getGroup(groupId),
        device = getDevice(deviceId),
        deviceIndex = group.devices.findIndex(function(data) {
          return data.id == deviceId;
        });

      if (deviceIndex !== -1) {
        group.devices.splice(deviceIndex, 1);
      }
      delete device.group;

      // Send an event to close the device detail window
      $rootScope.$broadcast('close.window');
    }

    /**
     * Remove a device from the device connexion object on user response
     *
     * @param {int} id The device id to remove
     * @method removeDeviceConnected
     */
    function removeDeviceConnected(id) {
      for (var i = 0; i < devicesConnexion.length; i++) {
        if (devicesConnexion[i].id == id) {
          devicesConnexion.splice(i, 1);
          break;
        }
      }
    }

    /**
     * Add a new device to the manage interface
     *
     * @param {Object} device the new device object
     * @method addDeviceConnected
     */
    function addDeviceConnected(device) {
      devicesConnexion.push(device);
    }

    /**
     * Retrieve the new pending connexion devices
     * @returns {Array}
     */
    function getDevicesConnected() {
      return devicesConnexion;
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
      removeDeviceFromGroup: removeDeviceFromGroup,
      addToHistory: addToHistory,
      removeDeviceConnected: removeDeviceConnected,
      addDeviceConnected: addDeviceConnected,
      getDevicesConnected: getDevicesConnected
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = [
    '$http',
    '$q',
    '$rootScope',
    '$route',
    '$timeout',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
