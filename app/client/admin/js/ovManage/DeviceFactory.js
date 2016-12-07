'use strict';

(function(app) {

  /**
   * Defines a factory to manage devices.
   *
   * Devices are categorized by state.
   * Either "accepted", "refused", "pending" or "incoming".
   * An "incoming" device is a newly connected device manifesting after retrieving
   * the list of known devices from the server.
   * A "pending" device is a connected device not in server's list of known devices.
   *
   * @module ov.manage
   * @class ManageDeviceFactory
   */
  function DeviceFactory($q,
                          $rootScope,
                          $filter,
                          $timeout,
                          DEVICE_STATES,
                          DEVICE_STATUS,
                          MANAGEABLE_TYPES,
                          TEMPLATES,
                          ManageFactory,
                          ManageableFactory
                         ) {
    var devices = {};
    devices[DEVICE_STATES.INCOMING] = [];

    /**
     * Retrieves a device by its id.
     *
     * Search is made on all devices, accepted, pending, refused and incoming devices.
     *
     * @method getDevice
     * @param {String} id The device id
     * @return {Object|Null} The device or null if not found
     */
    function getDevice(id) {
      var result = null;

      var findDeviceById = function(device) {
        if (device.id === id) result = device;
      };

      if (devices) {
        devices[DEVICE_STATES.ACCEPTED].forEach(findDeviceById);
        devices[DEVICE_STATES.PENDING].forEach(findDeviceById);
        devices[DEVICE_STATES.REFUSED].forEach(findDeviceById);
        devices[DEVICE_STATES.INCOMING].forEach(findDeviceById);
      }

      return result;
    }

    /**
     * Updates device's status message depending on its actual status.
     * Device's status message is a human readable explanation about the device's status.
     *
     * @method updateDeviceStatusMessage
     * @private
     * @param {String} id The device id
     */
    function updateDeviceStatusMessage(id) {
      var device = getDevice(id);

      if (device) {
        switch (device.status) {

          // Device stopped
          case DEVICE_STATUS.STOPPED:
            device.statusMessage = 'MANAGE.STATUS.READY';
            break;

          // Device in error
          case DEVICE_STATUS.ERROR:
            device.statusMessage = 'MANAGE.STATUS.ERROR';
            break;

          // Device recording session started
          case DEVICE_STATUS.STARTED:
            device.statusMessage = 'MANAGE.STATUS.RECORDING';
            break;

          // Device recording session starting
          case DEVICE_STATUS.STARTING:
            device.statusMessage = 'MANAGE.STATUS.STARTING';
            break;

          // Device disconnected
          default:
            device.statusMessage = 'MANAGE.STATUS.DISCONNECTED';
        }
      }
    }

    /**
     * Gets a preset of a device.
     *
     * @method getPreset
     * @param {String} deviceId The device id
     * @param {String} presetId The device preset to look for
     * @return {Object|Null} The preset configuration or null if not found
     */
    function getPreset(deviceId, presetId) {
      var device = getDevice(deviceId);

      if (device && presetId) {
        for (var i = 0; i < device.presets.length; i++) {
          if (device.presets[i].id === presetId)
            return device.presets[i];
        }
      }

      return null;
    }

    /**
     * Adds a device historic.
     *
     * @method addHistoric
     * @param {String} id The device id
     * @param {Object} historic The history
     */
    function addHistoric(id, historic) {
      var device = getDevice(id);
      ManageableFactory.addHistoric(device, historic);
    }

    /**
     * Adds a device schedule.
     *
     * @method addSchedule
     * @param {String} id The device id
     * @param {Object} schedule The schedule
     */
    function addSchedule(id, schedule) {
      var device = getDevice(id);
      ManageableFactory.addSchedule(device, schedule);
    }

    /**
     * Removes a device historic.
     *
     * @method removeHistoric
     * @param {String} id The device id
     * @param {String} historicId The historic id
     */
    function removeHistoric(id, historicId) {
      var device = getDevice(id);
      ManageableFactory.removeHistoric(device, historicId);
    }

    /**
     * Removes a device's history.
     *
     * @method removeHistory
     * @param {String} id The device id
     */
    function removeHistory(id) {
      var device = getDevice(id);
      ManageableFactory.removeHistory(device);
    }

    /**
     * Removes a device's schedule.
     *
     * @method removeSchedule
     * @param {String} id The device id
     * @param {String} scheduleId The schedule id
     */
    function removeSchedule(id, scheduleId) {
      var device = getDevice(id);
      ManageableFactory.removeSchedule(device, scheduleId);
    }

    /**
     * Adds a new device to the manage interface as a connected device.
     *
     * @method addDevice
     * @param {Object} device The new device description object
     * @param {String} state The device state
     */
    function addDevice(device, state) {
      if (!getDevice(device.id)) {
        var history = device.history;
        device.type = MANAGEABLE_TYPES.DEVICE;
        device.history = [];
        if (!device.inputs) device.inputs = {};
        if (!device.presets) device.presets = [];

        if (state === DEVICE_STATES.ACCEPTED)
          devices[DEVICE_STATES.ACCEPTED].push(device);
        else if (state === DEVICE_STATES.REFUSED)
          devices[DEVICE_STATES.REFUSED].push(device);
        else {
          device.state = DEVICE_STATES.INCOMING;
          devices[DEVICE_STATES.INCOMING].push(device);
        }

        history.forEach(function(historic) {
          addHistoric(device.id, historic);
        });
      }
    }

    /**
     * Gets all devices from server.
     *
     * @method getDevices
     * @return {Promise} A promise resolving with the list of devices categorized
     * by state (either "pending", "accepted" or "refused")
     */
    function getDevices() {
      var p = $q.defer();

      if (!devices[DEVICE_STATES.ACCEPTED]) {
        ManageFactory.getDevices().then(function(newDevices) {
          devices[DEVICE_STATES.ACCEPTED] = [];
          devices[DEVICE_STATES.PENDING] = [];
          devices[DEVICE_STATES.REFUSED] = [];
          newDevices.forEach(function(newDevice) {
            switch (newDevice.state) {
              case DEVICE_STATES.ACCEPTED:
                addDevice(newDevice, DEVICE_STATES.ACCEPTED);
                break;
              case DEVICE_STATES.PENDING:
                addDevice(newDevice, DEVICE_STATES.PENDING);
                break;
              case DEVICE_STATES.REFUSED:
                addDevice(newDevice, DEVICE_STATES.REFUSED);
                break;
              default:
                break;
            }
            updateDeviceStatusMessage(newDevice.id);
          });
          p.resolve(devices);
        }, function(error) {
          p.reject(error);
        });
      } else
        p.resolve(devices);

      return p.promise;
    }

    /**
     * Removes a device.
     *
     * @method remove
     * @param {String} id The device id
     * @return {Object} The removed device
     */
    function remove(id) {
      var deviceIndex = -1;
      var deviceCategory = null;
      var device = null;

      var findDevice = function(devices) {
        for (var i = 0; i < devices.length; i++) {
          if (id == devices[i].id) {
            deviceIndex = i;
            deviceCategory = devices;
            device = devices[i];
            return;
          }
        }
      };

      findDevice(devices[DEVICE_STATES.ACCEPTED]);
      findDevice(devices[DEVICE_STATES.PENDING]);
      findDevice(devices[DEVICE_STATES.REFUSED]);
      findDevice(devices[DEVICE_STATES.INCOMING]);

      if (deviceIndex !== -1)
        deviceCategory.splice(deviceIndex, 1);

      return device;
    }

    /**
     * Sets a property on all devices.
     *
     * @method setDevicesProperty
     * @param {String} property The name of the property to set
     * @param {Mixed} value The value for the property
     */
    function setDevicesProperty(property, value) {
      devices[DEVICE_STATES.ACCEPTED].forEach(function(device) {
        device[property] = value;
      });
    }

    /**
     * Updates a device's property.
     *
     * @method setProperty
     * @param {String} id The device id
     * @param {String} property The property to modify
     * @param {Mixed} value The property value
     */
    function setProperty(id, property, value) {
      var device = getDevice(id);

      if (device) {
        device[property] = value;

        if (property === 'status') {

          if (device.status === DEVICE_STATUS.DISCONNECTED) {

            // Device is now disconnected
            // Remove its volatile information
            delete device.presets;
            delete device.inputs;
            delete device.storage;

            // If the device is not acceted or refused
            // Remove it
            if (device.state === DEVICE_STATES.INCOMING || device.state === DEVICE_STATES.PENDING)
              remove(device.id);
          }

          updateDeviceStatusMessage(device.id, device.status);
        }
      }
    }

    /**
     * Validates a device preset confronting its available inputs.
     * Inputs error is available in device.inputs property.
     *
     * @method validatePreset
     * @param {String} deviceId The device id
     * @param {String} presetId The device preset id
     */
    function validatePreset(deviceId, presetId) {
      var device = getDevice(deviceId);

      if (device) {

        // Find device preset
        var preset = getPreset(deviceId, presetId);

        if (preset) {

          if ((device.inputs.camera === 'disconnected' || device.inputs.camera === 'ko') &&
              (device.inputs.desktop === 'disconnected' || device.inputs.desktop === 'ko')
          ) {

            // Both camera and desktop are disconnected

            if (preset.parameters.template === TEMPLATES.CAMERA_ONLY && !preset.parameters['rich-media'])
              device.inputs.error = 'MANAGE.DEVICE.INPUTS_STATUS.MISSING_CAMERA';
            else if (preset.parameters.template === TEMPLATES.PC_ONLY)
              device.inputs.error = 'MANAGE.DEVICE.INPUTS_STATUS.MISSING_PC';
            else
              device.inputs.error = 'MANAGE.DEVICE.INPUTS_STATUS.MISSING_PC_AND_CAMERA';

            return;

          } else if (device.inputs.camera === 'disconnected' || device.inputs.camera === 'ko') {

            // Camera disconnected but not PC

            if (preset.parameters.template !== TEMPLATES.PC_ONLY) {
              device.inputs.error = 'MANAGE.DEVICE.INPUTS_STATUS.MISSING_CAMERA';
              return;
            }

          } else if (device.inputs.desktop === 'disconnected' || device.inputs.desktop === 'ko') {

            // PC disconnected but not camera

            if (preset.parameters.template !== TEMPLATES.CAMERA_ONLY || preset.parameters['rich-media']) {
              device.inputs.error = 'MANAGE.DEVICE.INPUTS_STATUS.MISSING_PC';
              return;
            }

          }

          device.inputs.error = null;

        }

      }

    }

    /**
     * Updates a device's state.
     *
     * @method updateDeviceState
     * @param {String} id The updated device id
     * @param {String} newState The new state of the device
     */
    function updateDeviceState(id, newState) {

      // Remove device from its category ("accepted", "pending" or "refused")
      var device = remove(id);

      // Add device to its new category
      if (device) {
        device.state = newState;

        if (newState === DEVICE_STATES.ACCEPTED)
          devices[DEVICE_STATES.ACCEPTED].push(device);
        else
          devices[DEVICE_STATES.REFUSED].push(device);
      }
    }

    /**
     * Gets devices corresponding to the given state.
     *
     * @method getDevicesByState
     * @param {String} state The state to look for
     * @return {Array} The list of devices
     */
    function getDevicesByState(state) {
      return devices[state];
    }

    return {
      getDevices: getDevices,
      getDevice: getDevice,
      remove: remove,
      setDevicesProperty: setDevicesProperty,
      setProperty: setProperty,
      updateDeviceState: updateDeviceState,
      addDevice: addDevice,
      getDevicesByState: getDevicesByState,
      addHistoric: addHistoric,
      addSchedule: addSchedule,
      removeHistoric: removeHistoric,
      removeHistory: removeHistory,
      removeSchedule: removeSchedule,
      validatePreset: validatePreset
    };

  }

  app.factory('ManageDeviceFactory', DeviceFactory);
  DeviceFactory.$inject = [
    '$q',
    '$rootScope',
    '$filter',
    '$timeout',
    'MANAGE_DEVICE_STATES',
    'MANAGE_DEVICE_STATUS',
    'MANAGE_MANAGEABLE_TYPES',
    'MANAGE_TEMPLATES',
    'ManageFactory',
    'ManageManageableFactory'
  ];

})(angular.module('ov.manage'));
