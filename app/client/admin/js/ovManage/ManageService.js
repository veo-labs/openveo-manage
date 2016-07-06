'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($http, $q, entityService, manageName) {

    var groups = null;
    var devices = null;
    var groupsDevices = null;

    /**
     * Add a new device
     *
     * @param device
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
     * Ordering devices from its state
     *
     * @param workingDevices
     * @private
     * @method orderDevices
     */
    function orderDevices(workingDevices) {

      // Prepare cache
      devices = {};
      devices.acceptedDevices = [];
      devices.pendingDevices = [];
      devices.refusedDevices = [];
      groupsDevices = [];

      workingDevices.map(function(device) {
        if (!device.group) {
          addDevice(device);
        } else {
          groups.map(function(group) {
            if (!group.devices) group.devices = [];
            if (group.id == device.group) {
              group.devices.push(device.id);
            }
          });

          // Store all devices belong to groups
          groupsDevices.push(device);
        }
      });
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
     */
    function getGroups() {
      return groups;
    }

    /**
     * Retrieve a group with its id
     *
     * @param id
     * @return group
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
     * Define groups
     *
     * @param data
     */
    function setGroups(data) {
      groups = data;
    }

    /**
     * Add a group to the groups
     *
     * @param group
     */
    function addGroup(group) {
      groups.push(group);
    }

    /**
     * Delete a group from groups with its id
     * @param id
     */
    /* function removeGroup(id) {

    }*/

    /**
     * Retrieve devices
     *
     * @returns {*}
     */
    function getDevices() {
      return devices;
    }

    /**
     *
     * @param id
     * @returns {*|{}}
     */
    function getDevice(id) {
      if (!devices) {
        return loadDevices(false).then(function() {
          return devices.find(function(device) {
            return device.id == id;
          });
        });
      }

      return devices.find(function(device) {
        return device.id == id;
      });
    }

    /**
     * Retrieve the group devices with group id
     *
     * @param groupId
     * @returns {Array}
     */
    function getDevicesByGroup(groupId) {
      var groupDevices = [];

      if (!groupsDevices) {
        return loadDevices(false).then(function() {
          groupsDevices.map(function(device) {
            if (device.group == groupId) {
              groupDevices.push(device);
            }
          });

          return groupDevices;
        });
      }

      groupsDevices.map(function(device) {
        if (device.group == groupId) {
          groupDevices.push(device);
        }
      });

      return groupDevices;
    }

    /**
     * define devices
     *
     * @param data
     */
    function setDevices(data) {
      devices = data;
    }

    /**
     * Update the lists of devices after an update device state
     *
     * @param {Object} device The updated device
     * @param {String} state The initial state of the updated device
     * @param {Boolean} accepted The updated device go to the accepted or refused list
     * @returns {Promise}
     * @method updateDeviceState
     */
    function updateDeviceState(device, state, accepted) {
      var index = devices[state].findIndex(function(workingDevice) {
        return workingDevice.id == device.id;
      });

      devices[state].splice(index, 1);

      if (accepted) {
        devices.acceptedDevices.push(device);
      } else {
        devices.refusedDevices.push(device);
      }

      return $q.when(devices);
    }

    /**
     * Update the cache when devices are added to a group
     *
     * @param draggableId
     * @param dropzoneId
     * @param group
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

        devices.acceptedDevices.splice(index, 1);
        index = devices.acceptedDevices.findIndex(function(workingDevice) {
          return workingDevice.id == dropzoneId;
        });
        devices.acceptedDevices.splice(index, 1);
      } else {
        groups.map(function(group) {
          if (group.id == dropzoneId) {
            group.devices.push(draggableId);
          }
        });

        devices.acceptedDevices.splice(index, 1);
      }

      return $q.when({
        groups: groups,
        devices: devices
      });
    }

    return {
      getGroups: getGroups,
      getGroup: getGroup,
      setGroups: setGroups,
      addGroup: addGroup,
      getDevices: getDevices,
      getDevice: getDevice,
      getDevicesByGroup: getDevicesByGroup,
      setDevices: setDevices,
      addDevice: addDevice,
      getDevicesPromised: getDevicesPromised,
      updateDeviceState: updateDeviceState,
      addDevicesToGroup: addDevicesToGroup
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = ['$http', '$q', 'entityService', 'manageName'];

})(angular.module('ov.manage'));
