'use strict';

(function(app) {

  /**
   * @module ov.manage
   */

  /**
   * Defines a factory to manage groups.
   *
   * @class ManageGroupFactory
   * @static
   */
  function GroupFactory(
    $q,
    $rootScope,
    $timeout,
    $filter,
    DEVICE_STATUS,
    MANAGEABLE_TYPES,
    DeviceFactory,
    ManageFactory,
    ManageableFactory
  ) {
    var TOTAL_PRESETS = 5;
    var groups = null;
    var presets = [];

    // Create presets for groups
    // Use preset id as preset name
    for (var i = 1; i < TOTAL_PRESETS + 1; i++)
      presets.push({id: String(i), name: String(i)});

    /**
     * Gets a group by its id.
     *
     * It implies that the list of groups has been retrieved
     * from server using GroupFactory.getGroups().
     *
     * @method getGroup
     * @param {String} id The group id
     * @return {Object|Null} The group or null if not found
     */
    function getGroup(id) {
      for (var i = 0; i < groups.length; i++)
        if (groups[i].id === id) return groups[i];

      return null;
    }

    /**
     * Updates status of a group regarding the status of its devices.
     *
     * @method updateStatus
     * @param {String} groupId The group id
     */
    function updateStatus(groupId) {
      var group = getGroup(groupId);

      if (group) {
        var groupReady = false;

        // If one device in the group is not able to start a session
        // mark the whole group as not able to start a session
        for (var i = 0; i < group.devices.length; i++) {

          // Update device status
          var device = group.devices[i];

          switch (device.status) {
            case DEVICE_STATUS.ERROR:
              group.statusMessage = 'MANAGE.STATUS.ERROR';
              group.status = DEVICE_STATUS.ERROR;
              return;
            case DEVICE_STATUS.STARTED:
            case DEVICE_STATUS.STOPPING:
              group.statusMessage = 'MANAGE.STATUS.RECORDING';
              group.status = DEVICE_STATUS.STARTED;
              return;
            case DEVICE_STATUS.STARTING:
              group.statusMessage = 'MANAGE.STATUS.STARTING';
              group.status = DEVICE_STATUS.STARTING;
              return;
            default:
              if (device.status == DEVICE_STATUS.STOPPED)
                groupReady = true;
          }
        }

        if (groupReady) {

          // All devices in the group are not in error, started or starting state
          // and at least one device is stopped
          group.statusMessage = 'MANAGE.STATUS.READY';
          group.status = DEVICE_STATUS.STOPPED;

        } else {

          // No devices connected
          group.statusMessage = 'MANAGE.STATUS.DISCONNECTED';
          group.status = DEVICE_STATUS.DISCONNECTED;

        }
      }
    }

    /**
     * Adds a group's historic.
     *
     * @method addHistoric
     * @param {String} id The group id
     * @param {Object} historic The historic
     */
    function addHistoric(id, historic) {
      var group = getGroup(id);
      ManageableFactory.addHistoric(group, historic);
    }

    /**
     * Adds a group's schedule.
     *
     * @method addSchedule
     * @param {String} id The group id
     * @param {Object} schedule The schedule
     */
    function addSchedule(id, schedule) {
      var group = getGroup(id);
      ManageableFactory.addSchedule(group, schedule);
    }

    /**
     * Removes a group's historic.
     *
     * @method removeHistoric
     * @param {String} id The group id
     * @param {String} historicId The historic id
     */
    function removeHistoric(id, historicId) {
      var group = getGroup(id);
      ManageableFactory.removeHistoric(group, historicId);
    }

    /**
     * Removes a device's history.
     *
     * @method removeHistory
     * @param {String} id The device id
     */
    function removeHistory(id) {
      var group = getGroup(id);
      ManageableFactory.removeHistory(group);
    }

    /**
     * Removes a group's schedule.
     *
     * @method removeSchedule
     * @param {String} groupId The group id
     * @param {String} scheduleId The schedule id
     */
    function removeSchedule(groupId, scheduleId) {
      var group = getGroup(groupId);
      ManageableFactory.removeSchedule(group, scheduleId);
    }

    /**
     * Gets a device from a group.
     *
     * @method getDeviceFromGroup
     * @param {String} deviceId The id of the device
     * @param {String} groupId The id of the group
     * @return {Object|Null} The device or null if not found
     */
    function getDeviceFromGroup(deviceId, groupId) {
      var group = getGroup(groupId);

      if (group) {
        for (var i = 0; i < group.devices.length; i++)
          if (group.devices[i].id === deviceId) return group.devices[i];
      }

      return null;
    }

    /**
     * Adds a device to a group.
     *
     * @method addDeviceToGroup
     * @param {Object} device The device to add to the group
     * @param {String} groupId The id of the group
     */
    function addDeviceToGroup(device, groupId) {
      if (device && groupId) {
        var group = getGroup(groupId);
        var existingDevice = getDeviceFromGroup(device.id, groupId);

        if (!existingDevice) {
          device.group = groupId;

          if (!group.devices)
            group.devices = [];

          group.devices.push(device);
          updateStatus(group.id);
        }

      }
    }

    /**
     * Adds a new group.
     *
     * @method addGroup
     * @param {Object} group The new group description object
     * @param {String} group.id Group's id
     * @param {Array} [group.history] Group's history
     */
    function addGroup(group) {
      if (!getGroup(group.id)) {
        var history = group.history;
        group.type = MANAGEABLE_TYPES.GROUP;
        group.devices = [];
        group.history = [];
        group.inputs = {};
        group.presets = presets;
        groups.push(group);

        history.forEach(function(historic) {
          addHistoric(group.id, historic);
        });

        updateStatus(group.id);
      }
    }

    /**
     * Gets all groups from server.
     *
     * @method getGroups
     * @return {Promise} A promise resolving with the list of groups
     */
    function getGroups() {
      var p = $q.defer();

      if (!groups) {
        ManageFactory.getGroups().then(function(newGroups) {
          groups = [];

          newGroups.forEach(function(group) {
            addGroup(group);
          });

          p.resolve(groups);
        }, function(error) {
          p.reject(error);
        });
      } else
        p.resolve(groups);

      return p.promise;
    }

    /**
     * Adds devices to their respecting group.
     *
     * It uses the group property of each device.
     *
     * @method addDevices
     * @param {Array} devices The list of devices
     */
    function addDevices(devices) {
      if (groups && devices) {

        // Iterate through devices
        for (var i in devices) {
          var deviceGroupId = devices[i].group;

          // Iterate through groups
          for (var j in groups) {

            if (groups[j].id === deviceGroupId) {

              // Found device's group
              // Add device to the group
              addDeviceToGroup(devices[i], groups[j].id);
              break;

            }
          }
        }
      }
    }

    /**
     * Sets a property on all groups.
     *
     * @method setGroupsProperty
     * @param {String} property The name of the property to set
     * @param {Mixed} value The value for the property
     */
    function setGroupsProperty(property, value) {
      groups.forEach(function(group) {
        group[property] = value;
      });
    }

    /**
     * Removes a group.
     *
     * @method removeGroup
     * @param {String} id The group id
     */
    function removeGroup(id) {
      var groupIndex = -1;
      var group = null;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].id === id) {
          groupIndex = i;
          group = groups[i];
          break;
        }
      }

      // Remove devices from group
      if (group) {
        group.devices.forEach(function(device) {
          delete device.group;
        });
      }

      // Remove group
      if (groupIndex !== -1)
        groups.splice(groupIndex, 1);
    }

    /**
     * Updates a group property.
     *
     * @method setProperty
     * @param {String} id The group id
     * @param {String} property The property to modify
     * @param {Mixed} value The property value
     */
    function setProperty(id, property, value) {
      var group = getGroup(id);

      if (group)
        group[property] = value;
    }

    /**
     * Removes a device from a group.
     *
     * @method removeDeviceFromGroup
     * @param {Object} device The device to remove
     * @param {String} device.id The device's id
     * @param {String} device.group The device's group
     * @param {String} groupId The group id
     */
    function removeDeviceFromGroup(device, groupId) {
      var group = getGroup(groupId),
        deviceIndex = -1;

      if (device && group) {
        for (var i = 0; i < group.devices.length; i++) {
          if (group.devices[i].id === device.id) {
            deviceIndex = i;
            break;
          }
        }

        if (deviceIndex !== -1)
          group.devices.splice(deviceIndex, 1);

        delete device.group;
        updateStatus(group.id);
      }
    }

    /**
     * Validates a preset confronting group's devices' available inputs.
     *
     * If one of the devices has invalid inputs regarding the preset, preset
     * is considered invalid.
     *
     * @method validatePreset
     * @param {String} groupId The group id
     * @param {String} presetId The preset id
     */
    function validatePreset(groupId, presetId) {
      var group = getGroup(groupId);

      if (group) {
        var devicesInError = [];

        group.devices.forEach(function(device) {
          DeviceFactory.validatePreset(device.id, presetId);

          if (device.inputs && device.inputs.error)
            devicesInError.push($filter('translate')(device.name));
        });

        if (devicesInError.length) {
          group.inputs.error = $filter('translate')('MANAGE.GROUP.PRESET_INPUTS_ERROR', null, {
            devices: devicesInError.join(', ')
          });
        } else
          group.inputs.error = null;

      }

    }

    /**
     * Checks if a schedule is not in collision with other schedules.
     *
     * Group's schedule should not be in collision with devices' schedule inside the group.
     *
     * @method isValidSchedule
     * @param {String} id The group id
     * @param {Object} schedule The schedule to validate
     * @return {Error|Null} The error if validation failed, null otherwise
     */
    function isValidSchedule(id, schedule) {
      var group = getGroup(id);

      if (group) {
        var validationError = ManageableFactory.isValidSchedule(schedule, group.schedules);
        if (validationError) return validationError;

        var devicesInConflict = [];

        // Validates that the new schedule is not in conflict with one of the
        // schedules in group's devices
        for (var i = 0; i < group.devices.length; i++) {
          var device = group.devices[i];
          var isConflict = false;

          for (var j = 0; j < device.schedules.length; j++) {
            if (ManageableFactory.checkSchedulesConflict(device.schedules[j], schedule)) {
              isConflict = true;
              break;
            }
          }

          if (isConflict)
            devicesInConflict.push($filter('translate')(device.name));

        }

        if (devicesInConflict.length) {
          return new Error($filter('translate')('MANAGE.MANAGEABLE.GROUP_DEVICES_CONFLICT_ERROR', null, {
            devices: devicesInConflict.join(', ')
          }));
        }
      }

      return null;
    }

    return {
      getGroups: getGroups,
      addDevices: addDevices,
      getGroup: getGroup,
      addGroup: addGroup,
      removeGroup: removeGroup,
      setGroupsProperty: setGroupsProperty,
      setProperty: setProperty,
      addDeviceToGroup: addDeviceToGroup,
      removeDeviceFromGroup: removeDeviceFromGroup,
      addHistoric: addHistoric,
      addSchedule: addSchedule,
      removeHistoric: removeHistoric,
      removeHistory: removeHistory,
      removeSchedule: removeSchedule,
      updateStatus: updateStatus,
      validatePreset: validatePreset,
      isValidSchedule: isValidSchedule
    };

  }

  app.factory('ManageGroupFactory', GroupFactory);
  GroupFactory.$inject = [
    '$q',
    '$rootScope',
    '$timeout',
    '$filter',
    'MANAGE_DEVICE_STATUS',
    'MANAGE_MANAGEABLE_TYPES',
    'ManageDeviceFactory',
    'ManageFactory',
    'ManageManageableFactory'
  ];

})(angular.module('ov.manage'));
