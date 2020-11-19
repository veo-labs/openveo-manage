'use strict';

/**
 * @module manage
 */

var shortid = require('shortid');
var async = require('async');
var openVeoApi = require('@openveo/api');
var Cache = process.requireManage('app/server/manageables/Cache.js');
var Device = process.requireManage('app/server/manageables/Device.js');
var Group = process.requireManage('app/server/manageables/Group.js');
var ERRORS = process.requireManage('app/server/errors.js');
var NotFoundError = openVeoApi.errors.NotFoundError;
var ResourceFilter = openVeoApi.storages.ResourceFilter;

/**
 * Manager singleton.
 *
 * @property manager
 * @type Manager
 * @private
 */
var manager = null;

/**
 * Orchestrates devices and browsers to keep them live-synchronized.
 *
 * Use Manager.get() to get an instance of the Manager.
 *
 * @class Manager
 * @constructor
 * @param {DevicePilot} devicesPilot Devices' pilot to interact with devices
 * @param {BrowserPilot} browsersPilot Browsers' pilot to interact with browsers
 * @param {DeviceProvider} deviceProvider Provider to manipulate devices
 * @param {GroupProvider} groupProvider Provider to manipulate groups
 * @param {ScheduleManager} scheduleManager A schedule manager to add / remove schedule jobs
 */
function Manager(devicesPilot, browsersPilot, deviceProvider, groupProvider, scheduleManager) {
  Object.defineProperties(this, {

    /**
     * The browsers' pilot to interact with browsers.
     *
     * @property browsersPilot
     * @type BrowserPilot
     * @final
     */
    browsersPilot: {value: browsersPilot},

    /**
     * The devices' pilot to interact with devices.
     *
     * @property devicesPilot
     * @type DevicePilot
     * @final
     */
    devicesPilot: {value: devicesPilot},

    /**
     * The cache to store devices and groups.
     *
     * @property cache
     * @type Cache
     * @final
     */
    cache: {value: new Cache()},

    /**
     * The schedule manager.
     *
     * @property scheduleManager
     * @type ScheduleManager
     * @final
     */
    scheduleManager: {value: scheduleManager},

    /**
     * Provider to manage groups.
     *
     * @property groupProvider
     * @type GroupProvider
     * @final
     */
    groupProvider: {value: groupProvider},

    /**
     * Provider to manage devices.
     *
     * @property deviceProvider
     * @type DeviceProvider
     * @final
     */
    deviceProvider: {value: deviceProvider}

  });

}

module.exports = Manager;

/**
 * Builds an history message.
 *
 * Historic are composed of a date, a message as a translation key
 * and parameters for the translation key.
 *
 * @method buildHistoric
 * @private
 * @param {String} message The historic message
 * @param {Object} [params] Message parameters
 * @return {Object} The historic object
 */
function buildHistoric(message, params) {
  return {
    id: shortid.generate(),
    date: new Date(),
    message: {
      data: message,
      params: params || {}
    }
  };
}

/**
 * Adds an historic to device's history.
 *
 * Saves the historic in database and cache then informs browsers about
 * the new historic.
 *
 * @method addGroupHistoric
 * @private
 * @async
 * @param {Group} group The group
 * @param {String} message The historic message
 * @param {Object} messageParams Message parameters for message translation
 * @param {Function} [callback] Function to call when it's done with :
 *  - **Error** An error is something went wrong
 */
function addGroupHistoric(group, message, messageParams, callback) {
  var self = this;
  var historic = buildHistoric(message, messageParams);

  self.groupProvider.addHistoric(group.id, historic, function(error, updateCount) {
    if (!error) {

      // Add historic to cache and inform browsers
      group.addHistoric(historic);
      self.browsersPilot.addHistoric(group, historic);

    }

    if (callback)
      callback(error);
  });
}

/**
 * Adds an historic to device's history.
 *
 * Use modifier *addToGroup* to also add the historic into history of device's group.
 * Saves the history in database and cache then informs browsers about
 * the new historic.
 *
 * @method addDeviceHistoric
 * @private
 * @async
 * @param {Device} device The device
 * @param {String} message The historic message
 * @param {Object} messageParams Message parameters for message translation
 * @param {Boolean} addToGroup true to also add the historic to the history of the device's group
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error is something went wrong
 */
function addDeviceHistoric(device, message, messageParams, addToGroup, callback) {
  var self = this;
  var historic = buildHistoric(message, messageParams);
  historic.message.params.name = device.name;

  async.parallel(async.reflectAll([
    function(callback) {
      self.deviceProvider.addHistoric(device.id, historic, function(error, updateCount) {
        if (!error) {

          // Add historic to cache and inform browsers
          device.addHistoric(historic);
          self.browsersPilot.addHistoric(device, historic);

        }

        callback(error);
      });
    },
    function(callback) {
      if (device.group && addToGroup) {
        var group = self.cache.get(device.group);
        addGroupHistoric.call(self, group, message, historic.message.params, callback);

      } else
        callback();
    }
  ]), function(error, results) {
    results.forEach(function(result) {
      if (result.error)
        process.logger.error(result.error.message, {error: result.error, method: 'addDeviceHistoric'});
    });

    if (callback)
      callback(error, results);
  });
}

/**
 * Registers a device if not already registered.
 *
 * Adds devide to database and cache.
 *
 * @method registerDevice
 * @private
 * @async
 * @param {String} id The id of the device to register
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 *  - **Object** The registered device
 *  - **Boolean** true if the device wasn't registered
 */
function registerDevice(id, callback) {
  var self = this;
  var device = this.cache.get(id);

  if (device) {
    callback(null, device, false);
  } else {

    // Device does not exist, create it
    self.deviceProvider.add([
      {
        id: id
      }
    ], function(error, total, createdDevices) {
      var createdDevice;

      if (!error) {
        createdDevice = new Device(createdDevices[0]);
        self.cache.add(createdDevice);
      }

      callback(error, createdDevice, true);
    });

  }
}

/**
 * Deregisters a schedule.
 *
 * @method deregisterSchedule
 * @private
 * @async
 * @param {String} manageable The manageable associated to the schedule
 * @param {Object} scheduleId The schedule id
 */
function deregisterSchedule(manageable, scheduleId) {

  // Get schedule
  var schedule = manageable.getSchedule(scheduleId);

  // Cancel both begin and end jobs
  this.scheduleManager.removeJob(schedule.startJobId);
  this.scheduleManager.removeJob(schedule.stopJobId);
}

/**
 * Registers a new schedule.
 *
 * @method registerSchedule
 * @private
 * @async
 * @param {String} manageable The manageable associated to the schedule
 * @param {Object} schedule The schedule description object
 */
function registerSchedule(manageable, schedule) {
  var self = this;

  // Start schedule job
  schedule.startJobId = this.scheduleManager.addJob(
    schedule.beginDate,
    schedule.endDate,
    schedule.recurrent,
    function() {
      var abort = false;
      var ids = [];

      if (manageable.type === Group.TYPE) {

        // Group

        // Do not start group if one of the device is running
        var devices = self.cache.getManageablesByProperty('group', manageable.id);
        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          if (device.status === self.devicesPilot.STATUSES.ERROR ||
              device.status === self.devicesPilot.STATUSES.STOPPED
          ) {
            ids.push(device.id);
          } else {

            // Device is not ready to be used
            // Abort group
            abort = true;
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD_SCHEDULE_ABORTED', null, true);

            break;
          }
        }


      } else if (manageable.type === Device.TYPE) {

        // Device

        if (manageable.status === self.devicesPilot.STATUSES.ERROR ||
            manageable.status === self.devicesPilot.STATUSES.STOPPED
        ) {
          ids.push(manageable.id);
        } else {

          // Device is not ready to be used
          // Abort
          abort = true;
          addDeviceHistoric.call(self, manageable, 'MANAGE.HISTORY.START_RECORD_SCHEDULE_ABORTED', null, true);

        }
      }

      if (!abort) {
        self.devicesPilot.askForStartRecord(ids, schedule.preset, schedule.name, function(error, results) {
          results.forEach(function(result) {
            var device;
            if (result.error) {
              process.logger.error(result.error.message, {error: result.error, method: 'scheduleStart'});

              // Save the error into history
              device = self.cache.get(result.error.deviceId);
              addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD_SCHEDULE_ERROR', {
                code: result.error.code
              }, true);

            } else {
              device = self.cache.get(result.value);
              addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD_SCHEDULE', null, true);
            }
          });
        });
      }
    }
  );

  // Stop schedule job
  // Stop is made at the start date plus duration
  var stopBeginDate = new Date(schedule.beginDate.getTime() + schedule.duration);
  schedule.stopJobId = this.scheduleManager.addJob(
    stopBeginDate,
    schedule.endDate,
    schedule.recurrent,
    function() {
      var ids = [];

      // Stop only started devices

      if (manageable.type === Group.TYPE) {

        // Group

        // Find group's devices
        var devices = self.cache.getManageablesByProperty('group', manageable.id);

        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          if (device.status === self.devicesPilot.STATUSES.STARTED)
            ids.push(device.id);
        }

      } else if (manageable.type === Device.TYPE && manageable.status === self.devicesPilot.STATUSES.STARTED) {
        ids.push(manageable.id);
      }

      self.devicesPilot.askForStopRecord(ids, function(error, results) {
        results.forEach(function(result) {
          var device;
          if (result.error) {
            process.logger.error(result.error.message, {error: result.error, method: 'scheduleStop'});

            // Save the error to the history
            device = self.cache.get(result.error.deviceId);
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOP_RECORD_SCHEDULE_ERROR', {
              code: result.error.code
            }, true);

          } else {
            device = self.cache.get(result.value);
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOP_RECORD_SCHEDULE', null, true);
          }
        });
      });

      // Remove job if not recurrent or expired
      if (!schedule.recurrent || manageable.isScheduleExpired(schedule)) {
        var provider = (manageable.type === Device.TYPE) ? self.deviceProvider : self.groupProvider;

        deregisterSchedule.call(self, manageable, schedule.id);
        provider.removeSchedule(manageable.id, schedule.id, function(error) {
          if (error)
            process.logger.error(error.message, {error: error, method: 'scheduleStop'});
          else {

            // Remove schedule from cache and inform browsers
            manageable.removeSchedule(schedule.id);
            self.browsersPilot.removeSchedule(manageable, schedule.id);

          }
        });
      }

    }
  );
}

/**
 * Initializes listeners on devices' messages.
 *
 * @method initDevicesListeners
 * @private
 */
function initDevicesListeners() {
  var self = this;
  var MESSAGES = this.devicesPilot.MESSAGES;

  // Listen for a new connected device
  // With :
  //   - **String** deviceIp The device IP address
  //   - **String** id The new connected device id
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.AUTHENTICATED, function(deviceIp, id, callback) {

    // Try to register the new connected device (if it's not already registered)
    registerDevice.call(self, id, function(error, device, isNew) {
      var handleError = function(error, response) {
        if (error)
          process.logger.error(error.message, {error: error, event: MESSAGES.AUTHENTICATED});
      };
      if (error) {
        handleError(error);
        return;
      }

      // socket.io works with IP v6 addresses even if the connected device
      // uses an IP v4 address
      // If the IP is a V4 IP wrapped in an IP V6 address, extract it
      // First and third matches correspond to an IP V4 address
      // Second match correspond to an IP V6 address
      var ipChunks = /(?:(?:::ffff:(.*)))|(.*:.*)|(.*)/.exec(deviceIp);
      device.ip = ipChunks[1] || ipChunks[2] || ipChunks[3];
      device.url = 'http://' + ((ipChunks[1] || ipChunks[3]) ? device.ip : '[' + device.ip + ']');

      // Device is already accepted
      // Asks the device its settings
      if (device.state === self.deviceProvider.STATES.ACCEPTED)
        self.devicesPilot.askForSettings([device.id], handleError);

      // Ask the device its name
      self.devicesPilot.askForName([device.id], handleError);

      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.CONNECTED', null, true);

      // Inform browsers about the connected device
      self.browsersPilot.connectDevice(device);

    });

  });

  // Listen for a device name changes
  // With:
  //   - **String** deviceName The new device name
  //   - **String** id The id of the device's id
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.NAME_UPDATED, function(deviceName, id, callback) {
    var device = self.cache.get(id);

    if (device) {

      // Update device's name
      self.deviceProvider.updateOne(new ResourceFilter().equal('id', id), {name: deviceName}, function(error) {
        if (error) {
          process.logger.error(error.message, {error: error, event: MESSAGES.NAME_UPDATED});
          return;
        }

        if (device.name !== deviceName) {
          var hadNoName = !device.name;
          device.name = deviceName;

          if (!hadNoName) {

            // Save update name action to history only if the device
            // already had a name (not on device connection)
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.UPDATE_NAME', null, true);

          }

          // Inform browsers about the device new name
          self.browsersPilot.update(device, 'name', device.name);
        }

      });

    }
  });

  // Listen for a device informing about its storage information
  // With:
  //   - **Number** free Number of free Bytes
  //   - **Number** used Number of used Bytes
  //   - **String** id The id of the device
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.STORAGE_UPDATED, function(free, used, id, callback) {
    var device = self.cache.get(id);

    if (device) {
      device.setStorage(free, used);
      self.browsersPilot.update(device, 'storage', device.storage);
    }
  });

  // Listen for a device informing about its inputs
  // With:
  //   - **Object** camera Camera input status
  //   - **Object** slides Slides input status
  //   - **String** id The id of the device
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.INPUTS_UPDATED, function(camera, slides, id, callback) {
    var device = self.cache.get(id);

    if (device) {
      device.setInputs(camera, slides);
      self.browsersPilot.update(device, 'inputs', device.inputs);
    }
  });

  // Listen for a device informing about its configured presets
  // With:
  //   - **Object** presets The configured presets
  //   - **String** id The id of the device
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.PRESETS_UPDATED, function(presets, id, callback) {
    var device = self.cache.get(id);

    if (device) {
      device.setPresets(presets);
      self.browsersPilot.update(device, 'presets', device.presets);
    }
  });

  // Listen for a device informing about its new status
  // With:
  //   - **String** status The new session status
  //   - **String** id The id of the device
  //   - **Function** callback The function to call to respond to the device
  this.devicesPilot.on(MESSAGES.SESSION_STATUS_UPDATED, function(status, id, callback) {

    // Ignore UNKNOWN status
    if (status === self.devicesPilot.STATUSES.UNKNOWN)
      return;

    var device = self.cache.get(id);

    if (device) {
      var oldStatus = device.status;
      device.status = status;
      self.browsersPilot.update(device, 'status', status);

      // Make sure status has really changed before saving an historic
      if (oldStatus &&
          oldStatus !== status &&
          oldStatus !== self.devicesPilot.STATUSES.DISCONNECTED
      ) {

        // Save changes to history
        switch (status) {
          case self.devicesPilot.STATUSES.ERROR:
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.ERROR_RECORD', null, true);
            break;
          case self.devicesPilot.STATUSES.STARTED:
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STARTED_RECORD', null, true);
            break;
          case self.devicesPilot.STATUSES.STOPPED:
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOPPED_RECORD', null, true);
            break;
          default:
            break;
        }
      }
    }
  });

  // Listen to device socket disconnection
  // With:
  //   - **String** id The id of the device
  this.devicesPilot.on(MESSAGES.DISCONNECTED, function(id) {
    var device = self.cache.get(id);

    if (device) {
      device.disconnect();
      device.status = self.devicesPilot.STATUSES.DISCONNECTED;
      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DISCONNECTED', null, true);
      self.browsersPilot.update(device, 'status', self.devicesPilot.STATUSES.DISCONNECTED);
    }
  });

  // Listen for a device socket communication error
  // With :
  //   - **Error** error The error
  //   - **String** id The id of the device
  this.devicesPilot.on(MESSAGES.ERROR, function(error, id) {
    process.logger.error(error.message, {error: error, event: MESSAGES.ERROR, id: id});
  });
}

/**
 * Initializes listeners on browsers' messages.
 *
 * @method initBrowsersListeners
 * @private
 */
function initBrowsersListeners() {
  var self = this;
  var MESSAGES = this.browsersPilot.MESSAGES;

  // Listen for a browser requesting the list of devices
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.GET_DEVICES, function(callback) {
    callback({
      data: self.getDevices()
    });
  });

  // Listen for a browser requesting one or several devices' settings
  // With :
  //   - **Array** ids The list of devices ids
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.GET_DEVICE_SETTINGS, function(ids, callback) {

    // Ask devices' settings
    self.devicesPilot.askForSettings(ids);

    callback();
  });

  // Listen for a browser requesting the name of a manageable to be updated
  // With :
  //   - **String** id The manageable id
  //   - **String** name The manageable name
  //   - **String** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.UPDATE_NAME, function(id, name, type, callback) {
    if (type === Device.TYPE) {
      self.updateDeviceName(id, name, function(error) {
        if (error)
          process.logger.error(error.message, {error: error, event: MESSAGES.UPDATE_NAME});

        if (error instanceof NotFoundError)
          return callback({error: ERRORS.UPDATE_DEVICE_NAME_NOT_FOUND_ERROR});
        else if (error)
          return callback({error: ERRORS.UPDATE_DEVICE_NAME_ERROR});

        callback();
      });
    } else if (type === Group.TYPE) {
      self.updateGroupName(id, name, function(error) {
        if (error)
          process.logger.error(error.message, {error: error, event: MESSAGES.UPDATE_NAME});

        if (error instanceof NotFoundError)
          return callback({error: ERRORS.UPDATE_GROUP_NAME_NOT_FOUND_ERROR});
        else if (error)
          return callback({error: ERRORS.UPDATE_GROUP_NAME_ERROR});

        callback();
      });
    }
  });

  // Listen for a browser requesting one or several devices to start a new recording session
  // With :
  //   - **Array** ids The list of devices ids on which a new recording session must be started
  //   - **String** presetId The id of the preset for the recording session
  //   - **String** name The name of the recording session
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.START_DEVICE_SESSION, function(ids, presetId, name, callback) {
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: ERRORS.START_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: ids[i]
        });
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesPilot.askForStartRecord(ids, presetId, name, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.logger.error(result.error.message, {error: result.error, event: MESSAGES.START_DEVICE_SESSION});

          // Save the error into history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            name: device.name,
            code: ERRORS.START_DEVICE_SESSION_ERROR.code
          });
        } else {
          device = self.cache.get(result.value);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD', null, true);
        }
      });

      callback({errors: errors});
    });
  });

  // Listen for a browser requesting one or several devices to stop a recording session
  // With :
  //   - **Array** ids The list of devices ids on which a new recording session must be stopped
  //   - **Function** The function to respond to the browser
  this.browsersPilot.on(MESSAGES.STOP_DEVICE_SESSION, function(ids, callback) {
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: ERRORS.STOP_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: ids[i]
        });
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesPilot.askForStopRecord(ids, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.logger.error(result.error.message, {error: result.error, event: MESSAGES.STOP_DEVICE_SESSION});

          // Save the error to the history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOP_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            name: device.name,
            code: ERRORS.STOP_DEVICE_SESSION_ERROR.code
          });
        } else {
          device = self.cache.get(result.value);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOP_RECORD', null, true);
        }
      });

      callback({errors: errors});
    });
  });

  // Listen for a browser requesting one or several devices to tag the current recording session
  // With :
  //   - **Array** ids The list of devices ids on which a current recording session must be tagged
  //   - **Function** The function to respond to the browser
  this.browsersPilot.on(MESSAGES.INDEX_DEVICE_SESSION, function(ids, callback) {
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: ERRORS.INDEX_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: ids[i]
        });
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesPilot.askForSessionIndex(ids, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.logger.error(result.error.message, {error: result.error, event: MESSAGES.INDEX_DEVICE_SESSION});

          // Save the error to the history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.TAG_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            name: device.name,
            code: ERRORS.INDEX_DEVICE_SESSION_ERROR.code
          });
        } else {
          device = self.cache.get(result.value);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.TAG_RECORD', null, true);
        }
      });

      callback({errors: errors});
    });
  });

  // Listen for a browser requesting a device state update
  // With :
  //   - **String** id The device id
  //   - **String** newState The new device state
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.UPDATE_DEVICE_STATE, function(id, newState, callback) {
    var device = self.cache.get(id);

    if (self.deviceProvider.AVAILABLE_STATES.indexOf(newState) === -1 || !device) {
      return callback({
        error: ERRORS.UPDATE_DEVICE_STATE_NOT_FOUND_ERROR
      });
    }

    // New state is the same as the actual one
    if (device.state === newState)
      return callback();

    // Update device state
    self.deviceProvider.updateOne(new ResourceFilter().equal('id', id), {state: newState}, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.UPDATE_DEVICE_STATE});
        return callback({
          error: ERRORS.UPDATE_DEVICE_STATE_ERROR
        });
      }

      // Update devices cache with new state
      device.state = newState;

      if (device.state === self.deviceProvider.STATES.ACCEPTED)
        addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DEVICE_ACCEPTED', null, true);
      else if (device.state === self.deviceProvider.STATES.REFUSED)
        addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DEVICE_REFUSED', null, true);

      // Inform browsers about the device new state
      self.browsersPilot.updateDeviceState(id, newState);

      callback();
    });

  });

  // Listen for a browser requesting a device to be removed
  // With :
  //   - **String** id The id of the manageable
  //   - **String** type The type of the manageable
  //   - **Function** The function to respond to the browser
  this.browsersPilot.on(MESSAGES.REMOVE, function(id, type, callback) {
    var removeFunction = (type === Device.TYPE) ? self.removeDevice : self.removeGroup;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: ERRORS.REMOVE_NOT_FOUND_ERROR
      });
    }

    removeFunction.call(self, manageable.id, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.REMOVE});
        return callback({
          error: ERRORS.REMOVE_ERROR
        });
      }

      callback();
    });

  });

  // Listen for a browser requesting an historic to be removed from a manageable
  // With :
  //   - **String** id The manageable id
  //   - **String** historicId The historic id
  //   - **String** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.REMOVE_HISTORIC, function(id, historicId, type, callback) {
    var provider = (type === Device.TYPE) ? self.deviceProvider : self.groupProvider;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: ERRORS.REMOVE_HISTORIC_NOT_FOUND_ERROR
      });
    }

    provider.removeHistoric(id, historicId, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.REMOVE_HISTORIC});
        return callback({
          error: ERRORS.REMOVE_HISTORIC_ERROR
        });
      }

      // Remove historic from cache and inform browsers
      if (manageable && manageable.removeHistoric(historicId))
        self.browsersPilot.removeHistoric(manageable, historicId);

      callback();
    });
  });

  // Listen for a browser requesting a schedule to be added to a manageable
  // With :
  //   - **String** id The manageable id
  //   - **Object** schedule The schedule
  //   - **String** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.ADD_SCHEDULE, function(id, schedule, type, callback) {
    var provider = (type === Device.TYPE) ? self.deviceProvider : self.groupProvider;
    var manageable = self.cache.get(id);
    var isValidSchedule = false;

    if (!manageable) {
      return callback({
        error: ERRORS.ADD_SCHEDULE_NOT_FOUND_ERROR
      });
    }

    schedule.endDate = manageable.getLastScheduleOccurence(schedule).endDate;

    // Validate that schedule is not in collision with other schedules
    if (type === Group.TYPE) {
      var groupDevices = self.cache.getManageablesByProperty('group', manageable.id);
      isValidSchedule = manageable.isValidSchedule(schedule, groupDevices);
    } else if (type === Device.TYPE) {
      var deviceGroup = (manageable.group) ? self.cache.get(manageable.group) : null;
      isValidSchedule = manageable.isValidSchedule(schedule, deviceGroup);
    }

    if (!isValidSchedule) {
      return callback({
        error: ERRORS.ADD_SCHEDULE_INVALID_ERROR
      });
    }

    registerSchedule.call(self, manageable, schedule);
    provider.addSchedule(manageable.id, schedule, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.ADD_SCHEDULE});
        return callback({
          error: ERRORS.ADD_SCHEDULE_ERROR
        });
      }

      // Add schedule to cache and inform browsers
      manageable.addSchedule(schedule);
      self.browsersPilot.addSchedule(manageable, schedule);

      callback();
    });
  });

  // Listen for a browser requesting a schedule to be removed from a manageable
  // With :
  //   - **String** id The manageable id
  //   - **String** scheduleId The schedule id
  //   - **String** type The manageable type
  //   - **Function** The function to respond to the browser
  this.browsersPilot.on(MESSAGES.REMOVE_SCHEDULE, function(id, scheduleId, type, callback) {
    var provider = (type === Device.TYPE) ? self.deviceProvider : self.groupProvider;
    var manageable = self.cache.get(id);
    var schedule = manageable && manageable.getSchedule(scheduleId);

    if (!schedule || !manageable) {
      return callback({
        error: ERRORS.REMOVE_SCHEDULE_NOT_FOUND_ERROR
      });
    }

    if (manageable.isScheduleRunning(manageable.getSchedule(scheduleId))) {
      return callback({
        error: ERRORS.REMOVE_SCHEDULE_RUNNING_ERROR
      });
    }

    deregisterSchedule.call(self, manageable, scheduleId);
    provider.removeSchedule(manageable.id, schedule.id, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.REMOVE_SCHEDULE});
        return callback({
          error: ERRORS.REMOVE_SCHEDULE_ERROR
        });
      }

      // Remove schedule from cache and inform browsers
      manageable.removeSchedule(schedule.id);
      self.browsersPilot.removeSchedule(manageable, schedule.id);

      callback();
    });
  });

  // Listen for a browser requesting a manageable's history to be purged
  // With :
  //   - **String** id The manageable id
  //   - **String** type The manageable type
  //   - **Function** The function to respond to the browser
  this.browsersPilot.on(MESSAGES.REMOVE_HISTORY, function(id, type, callback) {
    var provider = (type === Device.TYPE) ? self.deviceProvider : self.groupProvider;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: ERRORS.REMOVE_HISTORY_NOT_FOUND_ERROR
      });
    }

    provider.removeHistory(id, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.REMOVE_HISTORY});
        return callback({
          error: ERRORS.REMOVE_HISTORY_ERROR
        });
      }

      // Remove history from cache and inform browsers
      manageable.removeHistory();
      self.browsersPilot.removeHistory(manageable);

      callback();
    });
  });

  // Listen for a browser requesting the list of groups
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.GET_GROUPS, function(callback) {
    callback({
      data: self.getGroups()
    });
  });

  // Listen for a browser requesting a group to be created
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.CREATE_GROUP, function(callback) {
    self.groupProvider.add([
      {
        history: [
          buildHistoric('MANAGE.HISTORY.CREATE_GROUP')
        ]
      }
    ], function(error, total, addedGroups) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.CREATE_GROUP});
        return callback({
          error: ERRORS.CREATE_GROUP_ERROR
        });
      }

      var group = new Group(addedGroups[0]);

      // Add group to cache and inform browsers
      self.cache.add(group);
      self.browsersPilot.createGroup(group);

      callback({
        group: group
      });
    });
  });

  // Listen for a browser requesting a device to be added to a group
  // With :
  //   - **String** deviceId The device id
  //   - **String** groupId The group id
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.ADD_DEVICE_TO_GROUP, function(deviceId, groupId, callback) {
    var device = self.cache.get(deviceId);
    var group = self.cache.get(groupId);

    if (!device || !group) {
      return callback({
        error: ERRORS.ADD_DEVICE_TO_GROUP_NOT_FOUND_ERROR
      });
    }

    var isCollision = device.isGroupSchedulesCollision(group);

    if (isCollision) {
      return callback({
        error: ERRORS.ADD_DEVICE_TO_GROUP_SCHEDULES_COLLISION_ERROR
      });
    }

    // Add group information to the device
    self.deviceProvider.updateOne(new ResourceFilter().equal('id', device.id), {group: groupId}, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.ADD_DEVICE_TO_GROUP});
        return callback({
          error: ERRORS.ADD_DEVICE_TO_GROUP_ERROR
        });
      }

      // Update cache and inform browsers
      device.group = groupId;
      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.ADD_DEVICE_TO_GROUP', {
        name: device.name,
        groupName: group.name
      }, true);
      self.browsersPilot.addDeviceToGroup(deviceId, groupId);

      callback();
    });

  });

  // Listen for a browser requesting a device to be removed from its group
  // With :
  //   - **String** id The id of the device
  //   - **Function** callback The function to respond to the browser
  this.browsersPilot.on(MESSAGES.REMOVE_DEVICE_FROM_GROUP, function(id, callback) {
    var device = self.cache.get(id);
    var group = device && self.cache.get(device.group);

    if (!device || !group) {
      return callback({
        error: ERRORS.REMOVE_DEVICE_FROM_GROUP_NOT_FOUND_ERROR
      });
    }

    self.deviceProvider.updateOne(new ResourceFilter().equal('id', device.id), {group: null}, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, event: MESSAGES.REMOVE_DEVICE_FROM_GROUP});
        return callback({
          error: ERRORS.REMOVE_DEVICE_FROM_GROUP_ERROR
        });
      }

      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.REMOVE_DEVICE_FROM_GROUP', {
        name: device.name,
        groupName: group.name
      }, true);

      // Update cache and inform browsers
      device.group = null;
      self.browsersPilot.removeDeviceFromGroup(id);

      callback();
    });
  });

  // Listen for a browser socket communication error
  // With :
  //   - **Error** error The error
  this.browsersPilot.on(MESSAGES.ERROR, function(error) {
    process.logger.error(error.message, {error: error, method: 'error'});
  });
}

/**
 * Starts manager.
 *
 * When started the manager starts receiving events from
 * both devices and browsers. It also populates cache with all registered
 * devices and groups.
 *
 * All expired schedules' jobs of devices and groups are removed. Other schedules
 * are registered.
 *
 * @method start
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
Manager.prototype.start = function(callback) {
  var self = this;

  // Init event listeners on devices' and browsers' pilots
  initDevicesListeners.call(this);
  initBrowsersListeners.call(this);

  // Prepare cache on server start
  async.parallel([

    // Devices cache
    function(callback) {
      self.deviceProvider.getAll(null, null, {id: 'desc'}, function(error, devices) {
        if (error)
          return callback(error);

        devices.forEach(function(device) {
          device.status = self.devicesPilot.STATUSES.DISCONNECTED;
          self.cache.add(new Device(device));
        });
        callback();
      });
    },

    // Groups cache
    function(callback) {
      self.groupProvider.getAll(null, null, {id: 'desc'}, function(error, groups) {
        if (error)
          return callback(error);

        groups.forEach(function(group) {
          self.cache.add(new Group(group));
        });
        callback();
      });
    }
  ], function(error, results) {
    if (error)
      return callback(error);

    var asyncFunctions = [];
    var createAsyncFunction = function(manageableItem, scheduleId) {
      return function(callback) {
        var provider = (manageableItem.type === Device.TYPE) ? self.deviceProvider : self.groupProvider;
        provider.removeSchedule(manageableItem.id, scheduleId, function(error) {
          if (error)
            return callback(error);

          // Remove schedule from cache
          manageableItem.removeSchedule(scheduleId);

          callback();
        });
      };
    };

    // Schedules have to be registered again because schedule jobs
    // are volatile
    // Register schedules for each manageable
    // If the schedule is expired remove it instead
    self.cache.manageables.forEach(function(manageable) {
      manageable.schedules.forEach(function(schedule) {
        if (manageable.isScheduleExpired(schedule)) {

          // Schedule has expired
          // Deregister schedule then remove it from database and cache
          asyncFunctions.push(createAsyncFunction(manageable, schedule.id));

        } else
          registerSchedule.call(self, manageable, schedule);
      });
    });

    // Purge expired schedules
    async.parallel(asyncFunctions, callback);
  });
};

/**
 * Asks device to modify its name.
 *
 * @method updateDeviceName
 * @async
 * @param {String} id The id of the device
 * @param {String} name The new device's name
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
Manager.prototype.updateDeviceName = function(id, name, callback) {
  var self = this;
  var device = this.cache.get(id);

  if (!device)
    return callback(new NotFoundError(id));

  // Send message to corresponding device to update its name
  this.devicesPilot.askForUpdateName(id, name, function(error) {
    if (error) {
      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.UPDATE_DEVICE_NAME_ERROR', null, true);
      return callback(error);
    }

    callback();
  });
};

/**
 * Updates a group's name.
 *
 * @method updateGroupName
 * @async
 * @param {String} id The id of the group
 * @param {String} name The new group's name
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
Manager.prototype.updateGroupName = function(id, name, callback) {
  var self = this;
  var group = this.cache.get(id);

  if (!group)
    return callback(new NotFoundError(id));

  this.groupProvider.updateOne(new ResourceFilter().equal('id', group.id), {name: name}, function(error) {
    if (error) {
      addGroupHistoric.call(self, group, 'MANAGE.HISTORY.UPDATE_GROUP_NAME_ERROR');
      return callback(error);
    }

    // Update cache and inform browsers
    group.name = name;
    self.browsersPilot.update(group, 'name', group.name);

    // Save update name action to history
    addGroupHistoric.call(self, group, 'MANAGE.HISTORY.UPDATE_GROUP_NAME', {
      name: group.name
    });

    callback();
  });
};

/**
 * Removes an in-memory stored manageable with its id.
 *
 * @method removeFromCache
 * @param {String} id The manageable id
 */
Manager.prototype.removeFromCache = function(id) {
  var manageable = this.cache.get(id);

  if (this.cache.remove(manageable))
    this.browsersPilot.remove(manageable);
};

/**
 * Gets the list of devices from cache.
 *
 * @method getDevices
 * @return {Array} The list of devices in cache
 */
Manager.prototype.getDevices = function() {
  var devices = [];
  this.cache.getManageablesByProperty('type', Device.TYPE).forEach(function(manageable) {
    devices.push(manageable);
  });

  return devices;
};

/**
 * Gets the list of groups from cache.
 *
 * @method getGroups
 * @return {Array} The list of groups in cache
 */
Manager.prototype.getGroups = function() {
  var groups = [];
  this.cache.getManageablesByProperty('type', Group.TYPE).forEach(function(manageable) {
    groups.push(manageable);
  });

  return groups;
};

/**
 * Removes a device.
 *
 * @method removeDevice
 * @async
 * @param {String} id The device id
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong
 */
Manager.prototype.removeDevice = function(id, callback) {
  var self = this;
  var device = this.cache.get(id);
  var actions = [];

  // Remove device's schedules
  if (device.schedules) {
    device.schedules.forEach(function(schedule) {
      deregisterSchedule.call(self, device, schedule.id);
    });
  }

  // Remove device
  actions.push(function(callback) {
    self.deviceProvider.remove(new ResourceFilter().equal('id', device.id), callback);
  });

  if (device.group) {
    var devicesInTheGroup = self.cache.getManageablesByProperty('group', device.group);

    if (devicesInTheGroup.length === 1) {

      // No more devices in the group
      // Remove group
      actions.push(function(callback) {
        self.removeGroup(device.group, callback);
      });

    }
  }

  async.series(actions, function(error, results) {
    if (error)
      return callback(error);

    // Remove device from cache and informs browsers
    self.removeFromCache(device.id);

    // Disconnect device
    self.devicesPilot.disconnect([device.id]);

    callback();
  });
};

/**
 * Removes a group.
 *
 * @method removeGroup
 * @async
 * @param {String} id The device id
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong
 */
Manager.prototype.removeGroup = function(id, callback) {
  var self = this;
  var group = this.cache.get(id);
  var actions = [];

  // Remove group's schedules
  if (group.schedules) {
    group.schedules.forEach(function(schedule) {
      deregisterSchedule.call(self, group, schedule.id);
    });
  }

  // Remove group information from all group's devices
  var devices = self.cache.getManageablesByProperty('group', group.id);
  devices.forEach(function(device) {
    actions.push(function(callback) {

      // Remove device group from cache
      device.group = null;

      self.deviceProvider.updateOne(new ResourceFilter().equal('id', device.id), {group: null}, callback);
    });
  });

  // Remove group
  actions.push(function(callback) {
    self.groupProvider.remove(new ResourceFilter().equal('id', group.id), callback);
  });

  async.series(actions, function(error, results) {
    if (error)
      return callback(error);

    // Remove group from cache and informs browsers
    self.removeFromCache(group.id);

    callback();
  });
};

/**
 * Gets Manager singleton.
 *
 * @method get
 * @param {DevicePilot} [devicesPilot] Devices' pilot to interact with devices
 * @param {BrowserPilot} [browsersPilot] Browsers' pilot to interact with browsers
 * @param {DeviceProvider} [deviceProvider] Provider to manipulate devices
 * @param {groupProvider} [groupProvider] Provider to manipulate groups
 * @param {ScheduleManager} [scheduleManager] A schedule manager to add / remove schedule jobs
 * @return {Manager} The manager
 */
Manager.get = function(devicesPilot, browsersPilot, deviceProvider, groupProvider, scheduleManager) {
  if (!manager && devicesPilot && browsersPilot)
    manager = new Manager(devicesPilot, browsersPilot, deviceProvider, groupProvider, scheduleManager);

  return manager;
};
