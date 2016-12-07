'use strict';

var shortid = require('shortid');
var async = require('async');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var ScheduleManager = process.requireManage('app/server/services/ScheduleManager.js');
var Cache = process.requireManage('app/server/services/Cache.js');
var Device = process.requireManage('app/server/services/Device.js');
var Group = process.requireManage('app/server/services/Group.js');
var errors = process.requireManage('app/server/errors.js');

/**
 * The manage socket server singleton.
 *
 * @property server
 * @type {ManageServer}
 */
var server = null;

/**
 * Manages a socket server to keep live-synchronized information about devices
 * in client interfaces (browsers).
 *
 * Use ManageServer.get() to get an instance of the ManageServer.
 *
 * @class ManageServer
 * @constructor
 * @private
 * @param {DevicesSocketNamespace} devicesNamespace Devices socket namespace
 * @param {BrowsersSocketNamespace} browsersNamespace Browsers socket namespace
 */
function ManageServer(devicesNamespace, browsersNamespace) {

  /**
   * Model to manage devices.
   *
   * @property deviceModel
   * @type {DeviceModel}
   */
  this.deviceModel = new DeviceModel();

  /**
   * Model to manage groups.
   *
   * @property groupModel
   * @type {GroupModel}
   */
  this.groupModel = new GroupModel();

  /**
   * The schedule manager.
   *
   * @property scheduleManager
   * @type {ScheduleManager}
   */
  this.scheduleManager = new ScheduleManager();

  /**
   * The cache to store devices and groups.
   *
   * @property cache
   * @type {Array}
   */
  this.cache = new Cache();

  /**
   * The devices namespace to communicate with devices.
   *
   * @property devicesNamespace
   * @type {DevicesSocketNamespace}
   */
  this.devicesNamespace = devicesNamespace;

  /**
   * The browsers namespace to communicate with browsers.
   *
   * @property browsersNamespace
   * @type {BrowsersSocketNamespace}
   */
  this.browsersNamespace = browsersNamespace;

}

module.exports = ManageServer;

/**
 * Retrieves a socket by device id.
 *
 * @method getSocketByDeviceId
 * @private
 * @param {String} deviceId The device id
 * @return {Object|Null} The socket or null if not found
 */
function getSocketByDeviceId(deviceId) {
  var device = this.cache.get(deviceId);

  if (device)
    return this.devicesNamespace.getOpenedSockets()[device.socketId];

  return null;
}

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
 * Saves the history in database and cache then informs browsers about
 * the new historic.
 *
 * @method addGroupHistoric
 * @private
 * @async
 * @param {Group} group The group
 * @param {String} message The historic message
 * @param {Object} messageParams Message parameters for message translation
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error is something went wrong
 */
function addGroupHistoric(group, message, messageParams, callback) {
  var self = this;
  var historic = buildHistoric(message, messageParams);

  self.groupModel.addHistoric(group.id, historic, function(error, updateCount) {
    if (!error) {

      // Add historic to cache and inform browsers
      group.addHistoric(historic);
      self.browsersNamespace.addHistoric(group, historic);

    }

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
      self.deviceModel.addHistoric(device.id, historic, function(error, updateCount) {
        if (!error) {

          // Add historic to cache and inform browsers
          device.addHistoric(historic);
          self.browsersNamespace.addHistoric(device, historic);

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
        process.socketLogger.error(result.error.message, {error: result.error, method: 'addDeviceHistoric'});
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
    self.deviceModel.add({
      id: id
    }, function(error, total, createdDevice) {
      if (!error) {
        createdDevice = new Device(createdDevice);
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

  // Start is made at the start date
  // If start is recurrent, job will end at the specified date at midnight
  if (schedule.recurrent) {
    if (!schedule.endDate) {

      // Recurrent without end date
      // Set end date to begin date (only one occurence)
      schedule.endDate = new Date(schedule.beginDate.getTime());

    }

    // Set end date time to midnight (almost)
    schedule.endDate.setHours(23);
    schedule.endDate.setMinutes(59);
    schedule.endDate.setSeconds(59);
  }

  // Start schedule job
  schedule.startJobId = this.scheduleManager.addJob(
    schedule.beginDate,
    schedule.endDate,
    schedule.recurrent,
    function() {
      var abort = false;
      var sockets = [];

      if (manageable.type === Group.TYPE) {

        // Group

        // Do not start group if one of the device is running
        var devices = self.cache.getManageablesByProperty('group', manageable.id);
        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          if (device.status === DeviceModel.STATUS.ERROR ||
              device.status === DeviceModel.STATUS.STOPPED
          ) {
            sockets.push(getSocketByDeviceId.call(self, device.id));
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

        if (manageable.status === DeviceModel.STATUS.ERROR ||
            manageable.status === DeviceModel.STATUS.STOPPED
        ) {
          sockets.push(getSocketByDeviceId.call(self, manageable.id));
        } else {

          // Device is not ready to be used
          // Abort
          abort = true;
          addDeviceHistoric.call(self, manageable, 'MANAGE.HISTORY.START_RECORD_SCHEDULE_ABORTED', null, true);

        }
      }

      if (!abort) {
        self.devicesNamespace.askForStartRecord(sockets, schedule.id, schedule.preset, function(error, results) {
          results.forEach(function(result) {
            var device;
            if (result.error) {
              process.socketLogger.error(result.error.message, {error: result.error, method: 'scheduleStart'});

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
  var stopEndDate = schedule.endDate ? (new Date(schedule.endDate.getTime() + schedule.duration)) : null;
  schedule.stopJobId = this.scheduleManager.addJob(
    stopBeginDate,
    stopEndDate,
    schedule.recurrent,
    function() {
      var sockets = [];

      // Stop only started devices

      if (manageable.type === Group.TYPE) {

        // Group

        // Find group's devices
        var devices = self.cache.getManageablesByProperty('group', manageable.id);

        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          if (device.status === DeviceModel.STATUS.STARTED)
            sockets.push(getSocketByDeviceId.call(self, device.id));
        }

      } else if (manageable.type === Device.TYPE && manageable.status === DeviceModel.STATUS.STARTED) {
        sockets.push(getSocketByDeviceId.call(self, manageable.id));
      }

      self.devicesNamespace.askForStopRecord(sockets, function(error, results) {
        results.forEach(function(result) {
          var device;
          if (result.error) {
            process.socketLogger.error(result.error.message, {error: result.error, method: 'scheduleStop'});

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
        var model = (manageable.type === Device.TYPE) ? self.deviceModel : self.groupModel;

        deregisterSchedule.call(self, manageable, schedule.id);
        model.removeSchedule(manageable.id, schedule.id, function(error) {
          if (error)
            process.socketLogger.error(error.message, {error: error, method: 'scheduleStop'});
          else {

            // Remove schedule from cache and inform browsers
            manageable.removeSchedule(schedule.id);
            self.browsersNamespace.removeSchedule(manageable, schedule.id);

          }
        });
      }

    }
  );
}

/**
 * Initializes listeners on devices' namespace.
 *
 * @method initDevicesNamespaceListeners
 * @private
 */
function initDevicesNamespaceListeners() {
  var self = this;

  // Listen for a new connected device
  // With :
  //   - **String** id The new connected device id
  //   - **String** socketId The id of the device's socket
  //   - **String** deviceIP The device IP address
  this.devicesNamespace.on('connected', function(id, socketId, deviceIP) {

    // Try to register the new connected device (if it's not already registered)
    registerDevice.call(self, id, function(error, device, isNew) {
      var handleError = function(error, response) {
        if (error)
          process.socketLogger.error(error.message, {error: error, event: 'connected'});
      };

      if (error) {
        handleError(error);
        return;
      }

      var socket = self.getSocket(socketId);
      socket.deviceId = device.id;

      // socket.io works with IP v6 addresses even if the connected device
      // uses an IP v4 address
      // If the IP is an V4 wrapped in an IP V6 address, extract it
      var ipChunks = /(?:(?:::ffff:(.*)))|(.*)/.exec(deviceIP);
      device.ip = (ipChunks[1]) ? ipChunks[1] : ipChunks[2];
      device.url = 'http://' + ((ipChunks[1]) ? ipChunks[1] : '[' + ipChunks[2] + ']');
      device.socketId = socketId;

      // Device is already accepted
      // Asks the device its settings
      if (device.state === DeviceModel.STATES.ACCEPTED)
        self.askForDevicesSettings([device.id], handleError);

      // Ask the device its name
      self.devicesNamespace.askForName(socket, handleError);

      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.CONNECTED', null, true);

      // Inform browsers about the connected device
      self.browsersNamespace.connectDevice(device);
    });
  });

  // Listen for a device name changes
  // With:
  //   - **String** socketId The id of the device's socket
  //   - **String** deviceName The new device name
  this.devicesNamespace.on('settings.name', function(socketId, deviceName) {
    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {

      // Update device name
      self.deviceModel.update(device.id, {name: deviceName}, function(error) {
        if (error) {
          process.socketLogger.error(error.message, {error: error, event: 'settings.name'});
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
          self.browsersNamespace.update(device, 'name', device.name);
        }

      });

    }
  });

  // Listen for a device informing about its storage information
  // With:
  //   - **String** socketId The id of the device's socket
  //   - **Number** free Number of free Bytes
  //   - **Number** used Number of used Bytes
  this.devicesNamespace.on('storage', function(socketId, free, used) {
    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {
      device.setStorage(free, used);
      self.browsersNamespace.update(device, 'storage', device.storage);
    }
  });

  // Listen for a device informing about its inputs
  // With:
  //   - **String** socketId The id of the device's socket
  //   - **Object** camera Camera input status
  //   - **Object** slides Slides input status
  this.devicesNamespace.on('inputs', function(socketId, camera, slides) {
    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {
      device.setInputs(camera, slides);
      self.browsersNamespace.update(device, 'inputs', device.inputs);
    }
  });

  // Listen for a device informing about its configured presets
  // With:
  //   - **String** socketId The id of the device's socket
  //   - **Object** presets The configured presets
  this.devicesNamespace.on('settings.presets', function(socketId, presets) {
    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {
      device.setPresets(presets);
      self.browsersNamespace.update(device, 'presets', device.presets);
    }
  });

  // Listen for a device informing about its new status
  // With:
  //   - **String** socketId The id of the device's socket
  //   - **String** status The new session status
  this.devicesNamespace.on('session.status', function(socketId, status) {

    // Ignore UNKNOWN status
    if (status === DeviceModel.STATUS.UNKNOWN)
      return;

    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {
      var oldStatus = device.status;
      device.status = status;
      self.browsersNamespace.update(device, 'status', status);

      // Make sure status has really changed before saving an historic
      if (oldStatus &&
          oldStatus !== status &&
          oldStatus !== DeviceModel.STATUS.DISCONNECTED
      ) {

        // Save changes to history
        switch (status) {
          case DeviceModel.STATUS.ERROR:
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.ERROR_RECORD', null, true);
            break;
          case DeviceModel.STATUS.STARTED:
            addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STARTED_RECORD', null, true);
            break;
          case DeviceModel.STATUS.STOPPED:
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
  //   - **String** socketId The id of the device's socket
  this.devicesNamespace.on('disconnected', function(socketId) {
    var device = self.cache.getManageableByProperty('socketId', socketId);

    if (device) {
      device.disconnect();
      device.status = DeviceModel.STATUS.DISCONNECTED;
      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DISCONNECTED', null, true);
      self.browsersNamespace.update(device, 'status', DeviceModel.STATUS.DISCONNECTED);
    }
  });

  // Listen for a device socket communication error
  // With :
  //   - **Error** error The error
  this.devicesNamespace.on('error', function(error) {
    process.socketLogger.error(error.message, {error: error, method: 'error'});
  });
}

/**
 * Initializes listeners on browsers' namespace.
 *
 * @method initDevicesNamespaceListeners
 * @private
 */
function initBrowsersNamespaceListeners() {
  var self = this;

  // Listen for a browser requesting the list of devices
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('devices', function(callback) {
    callback({
      data: self.getDevices()
    });
  });

  // Listen for a browser requesting one or several devices settings
  // With :
  //   - **Array** ids The list of devices ids
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('device.settings', function(ids, callback) {

    // Ask devices settings
    self.askForDevicesSettings(ids);

    callback();
  });

  // Listen for a browser requesting a manageable name update
  // With :
  //   - **String** id The manageable id
  //   - **String** name The manageable name
  //   - **String** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('updateName', function(id, name, type, callback) {
    if (type === Device.TYPE) {
      var device = self.cache.get(id);

      if (!device) {
        return callback({
          error: errors.UPDATE_NAME_DEVICE_NOT_FOUND_ERROR
        });
      }

      var socket = getSocketByDeviceId.call(self, id);

      // Send message to corresponding device to update its name
      self.devicesNamespace.askForUpdateName(socket, name, function(error) {
        if (error) {
          process.socketLogger.error(error.message, {error: error, method: 'updateName'});

          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.UPDATE_NAME_ERROR', null, true);
          return callback({
            error: errors.UPDATE_DEVICE_NAME_ERROR
          });
        }

        callback();
      });
    } else if (type === Group.TYPE) {
      var group = self.cache.get(id);

      if (!group) {
        return callback({
          error: errors.UPDATE_NAME_GROUP_NOT_FOUND_ERROR
        });
      }

      self.groupModel.update(group.id, {name: name}, function(error) {
        if (error) {
          process.socketLogger.error(error.message, {error: error, method: 'group.updateName'});
          addGroupHistoric.call(self, group, 'MANAGE.HISTORY.GROUP_UPDATE_NAME_ERROR');

          return callback({
            error: errors.UPDATE_GROUP_NAME_ERROR
          });
        }

        callback();

        // Update cache and inform browsers
        group.name = name;
        self.browsersNamespace.update(group, 'name', group.name);
      });
    }
  });

  // Listen for a browser requesting one or several devices to start a new recording session
  // With :
  //   - **Array** ids The list of devices ids on which a new recording session must be started
  //   - **String** sessionId The id of recording session to start
  //   - **String** presetId The id of the preset for the recording session
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('device.startSession', function(ids, sessionId, presetId, callback) {
    var sockets = [];
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: errors.START_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: device.name
        });
      } else {
        sockets.push(getSocketByDeviceId.call(self, ids[i]));
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesNamespace.askForStartRecord(sockets, sessionId, presetId, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.socketLogger.error(result.error.message, {error: result.error, method: 'device.startSession'});

          // Save the error into history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.START_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            error: errors.START_DEVICE_SESSION_ERROR,
            name: device.name
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
  this.browsersNamespace.on('device.stopSession', function(ids, callback) {
    var sockets = [];
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: errors.STOP_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: device.name
        });
      } else {
        sockets.push(getSocketByDeviceId.call(self, ids[i]));
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesNamespace.askForStopRecord(sockets, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.socketLogger.error(result.error.message, {error: result.error, method: 'device.stopSession'});

          // Save the error to the history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.STOP_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            error: errors.STOP_DEVICE_SESSION_ERROR,
            name: device.name
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
  this.browsersNamespace.on('device.indexSession', function(ids, callback) {
    var sockets = [];
    var errors = [];

    for (var i = 0; i < ids.length; i++) {
      var device = self.cache.get(ids[i]);

      if (!device) {
        errors.push({
          error: errors.INDEX_DEVICE_SESSION_NOT_FOUND_ERROR,
          name: device.name
        });
      } else {
        sockets.push(getSocketByDeviceId.call(self, ids[i]));
      }
    }

    if (errors.length)
      return callback({errors: errors});

    self.devicesNamespace.askForSessionIndex(sockets, function(error, results) {
      results.forEach(function(result) {
        var device;
        if (result.error) {
          process.socketLogger.error(result.error.message, {error: result.error, method: 'device.indexSession'});

          // Save the error to the history
          device = self.cache.get(result.error.deviceId);
          addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.TAG_RECORD_ERROR', {
            code: result.error.code
          }, true);

          errors.push({
            error: errors.INDEX_DEVICE_SESSION_ERROR,
            name: device.name
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
  this.browsersNamespace.on('device.updateState', function(id, newState, callback) {
    var device = self.cache.get(id);

    if (DeviceModel.availableStates.indexOf(newState) === -1 || !device) {
      return callback({
        error: errors.UPDATE_DEVICE_STATE_NOT_FOUND_ERROR
      });
    }

    // Update device state
    self.deviceModel.update(id, {state: newState}, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'device.updateState'});
        return callback({
          error: errors.UPDATE_DEVICE_STATE_ERROR
        });
      }

      // Update devices cache with new state
      device.state = newState;

      if (device.state === DeviceModel.STATES.ACCEPTED)
        addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DEVICE_ACCEPTED', null, true);
      else if (device.state === DeviceModel.STATES.REFUSED)
        addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.DEVICE_REFUSED', null, true);

      // Inform browsers about the device new state
      self.browsersNamespace.updateDeviceState(id, newState);

      callback();
    });

  });

  // Listen for a browser requesting a device to be removed
  // With :
  //   - **String** id The id of the manageable
  //   - **String** type The type of the manageable
  //   - **Function** The function to respond to the browser
  this.browsersNamespace.on('remove', function(id, type, callback) {
    var removeFunction = (type === Device.TYPE) ? self.removeDevice : self.removeGroup;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: errors.REMOVE_NOT_FOUND_ERROR
      });
    }

    removeFunction.call(self, manageable.id, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'remove'});
        return callback({
          error: errors.REMOVE_ERROR
        });
      }

      callback();

      // Remove manageable from cache and informs browsers
      self.removeFromCache(manageable.id);

    });

  });

  // Listen for a browser requesting an historic to be removed from a manageable
  // With :
  //   - **String** id The manageable id
  //   - **String** historicId The historic id
  //   - **String** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('removeHistoric', function(id, historicId, type, callback) {
    var model = (type === Device.TYPE) ? self.deviceModel : self.groupModel;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: errors.REMOVE_HISTORIC_NOT_FOUND_ERROR
      });
    }

    model.removeHistoric(id, historicId, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'removeHistoric'});
        return callback({
          error: errors.REMOVE_HISTORIC_ERROR
        });
      }

      callback();

      // Remove historic from cache and inform browsers
      if (manageable && manageable.removeHistoric(historicId))
        self.browsersNamespace.removeHistoric(manageable, historicId);

    });
  });

  // Listen for a browser requesting a schedule to be added to a manageable
  // With :
  //   - **String** id The manageable id
  //   - **Object** schedule The schedule
  //   - **Object** type The manageable type
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('addSchedule', function(id, schedule, type, callback) {
    var model = (type === Device.TYPE) ? self.deviceModel : self.groupModel;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: errors.ADD_SCHEDULE_NOT_FOUND_ERROR
      });
    }

    var groupDevices = self.cache.getManageablesByProperty('group', manageable.id);

    if (!manageable.isValidSchedule(groupDevices, schedule)) {
      return callback({
        error: errors.ADD_SCHEDULE_INVALID_ERROR
      });
    }

    registerSchedule.call(self, manageable, schedule);
    model.addSchedule(manageable.id, schedule, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'addSchedule'});
        return callback({
          error: errors.ADD_SCHEDULE_ERROR
        });
      }

      callback();

      // Add schedule to cache and inform browsers
      manageable.addSchedule(schedule);
      self.browsersNamespace.addSchedule(manageable, schedule);

    });
  });

  // Listen for a browser requesting a schedule to be removed from a manageable
  // With :
  //   - **String** id The manageable id
  //   - **String** scheduleId The schedule id
  //   - **String** type The manageable type
  //   - **Function** The function to respond to the browser
  this.browsersNamespace.on('removeSchedule', function(id, scheduleId, type, callback) {
    var model = (type === Device.TYPE) ? self.deviceModel : self.groupModel;
    var manageable = self.cache.get(id);
    var schedule = manageable.getSchedule(scheduleId);

    if (!schedule || !manageable) {
      return callback({
        error: errors.REMOVE_SCHEDULE_NOT_FOUND_ERROR
      });
    }

    if (!manageable.isScheduleRunning(manageable.getSchedule(scheduleId))) {
      return callback({
        error: errors.REMOVE_SCHEDULE_RUNNING_ERROR
      });
    }

    deregisterSchedule.call(self, manageable, scheduleId);
    model.removeSchedule(manageable.id, schedule.id, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'removeSchedule'});
        return callback({
          error: errors.REMOVE_SCHEDULE_ERROR
        });
      }

      callback();

      // Remove schedule from cache and inform browsers
      manageable.removeSchedule(schedule.id);
      self.browsersNamespace.removeSchedule(manageable, schedule.id);
    });
  });

  // Listen for a browser requesting a manageable's history to be purged
  // With :
  //   - **String** id The manageable id
  //   - **String** type The manageable type
  //   - **Function** The function to respond to the browser
  this.browsersNamespace.on('removeHistory', function(id, type, callback) {
    var model = (type === Device.TYPE) ? self.deviceModel : self.groupModel;
    var manageable = self.cache.get(id);

    if (!manageable) {
      return callback({
        error: errors.REMOVE_HISTORY_NOT_FOUND_ERROR
      });
    }

    model.removeHistory(id, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'removeHistory'});
        return callback({
          error: errors.REMOVE_HISTORY_ERROR
        });
      }

      callback();

      // Remove history from cache and inform browsers
      manageable.removeHistory();
      self.browsersNamespace.removeHistory(manageable);

    });
  });

  // Listen for a browser requesting the list of groups
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('groups', function(callback) {
    callback({
      data: self.getGroups()
    });
  });

  // Listen for a browser requesting a group to be created
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('group.create', function(callback) {
    self.groupModel.add({
      history: [
        buildHistoric('MANAGE.HISTORY.CREATE_GROUP')
      ]
    }, function(error, addedCount, addedGroup) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'group.create'});
        return callback({
          error: errors.CREATE_GROUP_ERROR
        });
      }

      var group = new Group(addedGroup);

      callback({
        group: group
      });

      // Add group to cache and inform browsers
      self.cache.add(group);
      self.browsersNamespace.createGroup(group);
    });
  });

  // Listen for a browser requesting a device to be added to a group
  // With :
  //   - **String** deviceId The device id
  //   - **String** groupId The group id
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('group.addDevice', function(deviceId, groupId, callback) {
    var device = self.cache.get(deviceId);
    var group = self.cache.get(groupId);

    // TODO : DO NOT ADD DEVICE TO GROUP IF THERE IS COLLISION BETWEEN SCHEDULES

    if (!device || !group) {
      return callback({
        error: errors.ADD_DEVICE_TO_GROUP_NOT_FOUND_ERROR
      });
    }

    // Add group information to the device
    self.deviceModel.update(device.id, {group: groupId}, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'group.addDevice'});
        return callback({
          error: errors.ADD_DEVICE_TO_GROUP_ERROR
        });
      }

      callback();

      // Update cache and inform browsers
      device.group = groupId;
      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.ADD_DEVICE_TO_GROUP', {
        name: device.name,
        groupName: group.name
      }, true);
      self.browsersNamespace.addDeviceToGroup(deviceId, groupId);
    });

  });

  // Listen for a browser requesting a device to be removed from its group
  // With :
  //   - **String** id The id of the device
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('group.removeDevice', function(id, callback) {
    var device = self.cache.get(id);
    var group = self.cache.get(device.group);

    if (!device || !group) {
      return callback({
        error: errors.REMOVE_DEVICE_FROM_GROUP_NOT_FOUND_ERROR
      });
    }

    self.deviceModel.update(device.id, {group: null}, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'group.removeDevice'});
        return callback({
          error: errors.REMOVE_DEVICE_FROM_GROUP_ERROR
        });
      }

      callback();

      addDeviceHistoric.call(self, device, 'MANAGE.HISTORY.REMOVE_DEVICE_FROM_GROUP', {
        name: device.name,
        groupName: group.name
      }, true);

      // Update cache and inform browsers
      device.group = null;
      self.browsersNamespace.removeDeviceFromGroup(id);
    });
  });

  // Listen for a browser requesting an historic to be removed from a group
  // With :
  //   - **String** groupId The group id
  //   - **String** historicId The historic id
  //   - **Function** callback The function to respond to the browser
  this.browsersNamespace.on('group.removeHistoric', function(groupId, historicId, callback) {
    var group = self.cache.get(groupId);

    if (!group) {
      return callback({
        error: errors.REMOVE_GROUP_HISTORIC_NOT_FOUND_ERROR
      });
    }

    self.groupModel.removeHistoric(groupId, historicId, function(error) {
      if (error) {
        process.socketLogger.error(error.message, {error: error, method: 'group.removeHistoric'});
        return callback({
          error: errors.REMOVE_GROUP_HISTORIC_ERROR
        });
      }

      callback();

      // Remove historic from cache and informs browsers
      if (group.removeHistoric(historicId))
        self.browsersNamespace.removeHistoric(group, historicId);

    });
  });

  // Listen for a browser socket communication error
  // With :
  //   - **Error** error The error
  this.browsersNamespace.on('error', function(error) {
    process.socketLogger.error(error.message, {error: error, method: 'error'});
  });
}

/**
 * Connects namespaces to the socket.io server and prepares cache.
 *
 * Devices and groups are stored in cache to avoid abusive connections
 * to the database.
 *
 * @method connect
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
ManageServer.prototype.connect = function(callback) {
  var self = this;

  // Init event listeners on devices and browsers namespace
  initDevicesNamespaceListeners.call(this);
  initBrowsersNamespaceListeners.call(this);

  // Prepare cache on server start
  async.parallel([

    // Devices cache
    function(callback) {
      self.deviceModel.get(null, function(error, entities) {
        if (error)
          return callback(error);

        entities.forEach(function(device) {
          device.status = DeviceModel.STATUS.DISCONNECTED;
          self.cache.add(new Device(device));
        });
        callback();
      });
    },

    // Groups cache
    function(callback) {
      self.groupModel.get(null, function(error, entities) {
        if (error)
          return callback(error);

        entities.forEach(function(group) {
          self.cache.add(new Group(group));
        });
        callback();
      });
    }
  ], function(error, results) {
    var asyncFunctions = [];
    var createAsyncFunction = function(manageableItem, scheduleId) {
      return function(callback) {
        var model = (manageableItem.type === Device.TYPE) ? self.deviceModel : self.groupModel;
        model.removeSchedule(manageableItem.id, scheduleId, function(error) {
          if (error)
            return callback(error);

          // Remove schedule from cache
          manageableItem.removeSchedule(scheduleId);

          callback();
        });
      };
    };

    // Schedules have to registered again because node-schedule jobs
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
 * Gets a device socket by its id.
 *
 * @method getSocket
 * @param {String} id The socket id
 * @return {Socket|Null} The socket
 */
ManageServer.prototype.getSocket = function(id) {
  return id ? this.devicesNamespace.getOpenedSockets()[id] : null;
};

/**
 * Asks for devices settings.
 *
 * @method askForDevicesSettings
 * @async
 * @param {Array} ids An array of devices ids to ask for settings
 * @param {Function} callback Function to call when it's done with :
 *  - **Array** Results for each device
 */
ManageServer.prototype.askForDevicesSettings = function(ids, callback) {
  var self = this;
  var actions = [];

  ids.forEach(function(id) {
    var socket = getSocketByDeviceId.call(self, id);

    actions.push(function(callback) {
      self.devicesNamespace.askForSettings(socket, callback);
    });
  });

  async.parallel(async.reflectAll(actions), callback);
};

/**
 * Sends an update event to connected browsers to update a manageable.
 *
 * @method update
 * @param {String} id The manageable id
 * @param {Object} data The new data of the manageable
 */
ManageServer.prototype.update = function(id, data) {
  var self = this;
  var manageable = this.cache.get(id);

  if (manageable) {
    for (var key in data) {
      manageable[key] = data[key];
      self.browsersNamespace.update(manageable, key, data[key]);
    }
  }
};

/**
 * Removes an in-memory stored manageable with its id.
 *
 * @method removeFromCache
 * @param {String} id The manageable id
 */
ManageServer.prototype.removeFromCache = function(id) {
  var manageable = this.cache.get(id);

  if (this.cache.remove(manageable))
    this.browsersNamespace.remove(manageable);
};

/**
 * Gets a manageable.
 *
 * @method getManageable
 * @param {String} id The manageable id
 * @return {Manageable|Null} The manageable or null if not found
 */
ManageServer.prototype.getManageable = function(id) {
  return this.cache.get(id);
};

/**
 * Gets the list of devices from cache.
 *
 * @method getDevices
 * @return {Array} The list of devices in cache
 */
ManageServer.prototype.getDevices = function() {
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
ManageServer.prototype.getGroups = function() {
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
ManageServer.prototype.removeDevice = function(id, callback) {
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
    self.deviceModel.remove(device.id, callback);
  });

  if (device.group) {
    var devicesInTheGroup = self.cache.getManageablesByProperty('group', device.group);

    if (devicesInTheGroup.length > 1) {

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

    callback();

    // Remove device from cache and informs browsers
    self.removeFromCache(device.id);
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
ManageServer.prototype.removeGroup = function(id, callback) {
  var self = this;
  var group = this.cache.get(id);
  var actions = [];

  // Remove group's schedules
  if (group.schedules) {
    group.schedules.forEach(function(schedule) {
      deregisterSchedule.call(self, group, schedule.id);
      actions.push(function(callback) {
        self.groupModel.removeSchedule(group.id, schedule.id, callback);
      });
    });
  }

  // Remove group information from all group's devices
  var devices = self.cache.getManageablesByProperty('group', group.id);
  devices.forEach(function(device) {
    actions.push(function(callback) {

      // Remove device group from cache
      device.group = null;

      self.deviceModel.update(device.id, {group: null}, callback);
    });
  });

  // Remove group
  actions.push(function(callback) {
    self.groupModel.remove(group.id, callback);
  });

  async.series(actions, function(error, results) {
    if (error)
      return callback(error);

    callback();

    // Remove group from cache and informs browsers
    self.removeFromCache(group.id);
  });
};

/**
 * Gets ManageServer singleton.
 *
 * @method get
 * @param {DevicesSocketNamespace} [devicesNamespace] Devices socket namespace
 * @param {BrowsersSocketNamespace} [browsersNamespace] Browsers socket namespace
 * @return {ManageServer} The manage socket server
 */
ManageServer.get = function(devicesNamespace, browsersNamespace) {
  if (!server)
    server = new ManageServer(devicesNamespace, browsersNamespace);

  return server;
};