'use strict';

var util = require('util');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var openVeoAPI = require('@openveo/api');
var SocketNamespace = process.requireManage('app/server/socket/SocketNamespace.js');
var errors = process.requireManage('app/server/errors.js');

/**
 * Creates a socket.io namespace to communicate with browsers.
 *
 * BrowsersSocketNamespace emits the following events :
 *
 * Events relative to both groups and devices :
 *  - Event *updateName* when a browser requests a name modification on a manageable
 *    - **String** The manageable id
 *    - **String** The new manageable name
 *    - **String** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *remove* when a browser requests a manageable to be removed
 *    - **String** The manageable id
 *    - **String** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *addSchedule* when a browser requests a schedule to be added to a manageable
 *    - **String** The manageable id
 *    - **Object** The schedule
 *    - **Object** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *removeSchedule* when a browser requests a schedule to be removed from a manageable
 *    - **String** The device id
 *    - **String** The schedule id
 *    - **Object** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *removeHistoric* when a browser requests an historic to be removed from a manageable
 *    - **String** The manageable id
 *    - **String** The historic id
 *    - **String** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *removeHistory* when a browser requests a manageable's history to be removed
 *    - **String** The manageable id
 *    - **Object** The manageable type
 *    - **Function** The function to respond to the browser
 *  - Event *error* when something went wrong on the connection with a browser
 *    - **String** The id of the browser's socket
 *    - **Error** The socket.io error
 *
 * Events relative to devices :
 *  - Event *devices* when a browser requests the list of devices
 *    - **Function** The function to respond to the browser
 *  - Event *device.settings* when a browser requests an update for one or several devices settings
 *    - **Array** The list of outdated devices
 *  - Event *device.updateState* when a browser requests a state modification on a device
 *    - **String** The device id
 *    - **String** The new device state
 *    - **Function** The function to respond to the browser
 *  - Event *device.startSession* when a browser requests one or several devices to start a recording session
 *    - **Array** The list of devices ids on which a new recording session must be started
 *    - **[String]** The id of the recording session to start
 *    - **[String]** The id of the preset for the recording session
 *    - **Function** The function to respond to the browser
 *  - Event *device.stopSession* when a browser requests one or several devices to stop a recording session
 *    - **Array** The list of devices ids on which a current recording session must be stopped
 *    - **Function** The function to respond to the browser
 *  - Event *device.indexSession* when a browser requests one or several devices to add a tag to the recording session
 *    - **Array** The list of devices ids on which a current recording session must be tagged
 *    - **Function** The function to respond to the browser
 *
 * Events relative to groups :
 *  - Event *groups* when a browser requests the list of groups
 *    - **Function** The function to respond to the browser
 *  - Event *group.create* when a browser requests creation of a new group
 *    - **Function** The function to respond to the browser
 *  - Event *group.addDevice* when a browser requests to add a device to a group
 *    - **deviceId** The device id
 *    - **groupId** The group id
 *    - **Function** The function to respond to the browser
 *  - Event *group.removeDevice* when a browser requests to remove a device from a group
 *    - **String** The id of the device
 *    - **String** The id of the group
 *
 * @class BrowsersSocketNamespace
 * @extends SocketNamespace
 * @constructor
 */
function BrowsersSocketNamespace() {
  BrowsersSocketNamespace.super_.call(this);
}

util.inherits(BrowsersSocketNamespace, SocketNamespace);
module.exports = BrowsersSocketNamespace;

/**
 * Connects the namespace to the socket.io server.
 *
 * @method connect
 * @param {SocketServer} socketServer The socket server to connect to
 * @param {String} name The name to use to mount the namespace on the socket server
 */
BrowsersSocketNamespace.prototype.connect = function(socketServer, name) {
  BrowsersSocketNamespace.super_.prototype.connect.call(this, socketServer, name);

  var self = this,
    database = openVeoAPI.applicationStorage.getDatabase(),
    sessionSecret = openVeoAPI.applicationStorage.getSessionSecret(),
    sessionStore = database.getStore('core_sessions'),
    parsedCookie,
    sessionId;

  // Verify if the user is connected on each socket transaction
  this.namespace.use(function(socket, next) {
    parsedCookie = cookie.parse(socket.handshake.headers.cookie);
    sessionId = cookieParser.signedCookie(parsedCookie['connect.sid'], sessionSecret);

    if (!sessionId) {
      process.socketLogger.warn('Browser socket event not authorized');
      return next(errors.BACK_END_UNAUTHORIZED);
    }

    sessionStore.get(sessionId, function(error, session) {
      if (error || !session || !session.passport || !session.passport.user) {
        process.socketLogger.warn('Browser socket event not authorized');
        return next(errors.BACK_END_UNAUTHORIZED);
      }

      next();
    });
  });

  // Listen to new connected browsers
  this.namespace.on('connection', function(socket) {
    process.socketLogger.info('New browser connected', {socketId: socket.id});

    // New browser connected

    // Listen for a browser requesting manageable name update
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **String** name The new manageable name
    //     - **String** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('updateName', function(data, callback) {
      process.socketLogger.debug('Browser says : updateName', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          name: {type: 'string', required: true},
          type: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'updateName'});
        return callback({
          error: errors.UPDATE_NAME_WRONG_PARAMETERS
        });
      }

      self.emit('updateName', data.id, data.name, data.type, callback);
    });

    // Listen for a browser requesting a manageable to be removed
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **String** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('remove', function(data, callback) {
      process.socketLogger.debug('Browser says : remove', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          type: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'remove'});
        return callback({
          error: errors.REMOVE_WRONG_PARAMETERS
        });
      }

      self.emit('remove', data.id, data.type, callback);
    });

    // Listen for a browser requesting an historic to be removed from a manageable
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **String** historicId The historic id
    //     - **String** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('removeHistoric', function(data, callback) {
      process.socketLogger.debug('Browser says : removeHistoric', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          historicId: {type: 'string', required: true},
          type: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'removeHistoric'});
        return callback({
          error: errors.REMOVE_HISTORIC_WRONG_PARAMETERS
        });
      }

      self.emit('removeHistoric', data.id, data.historicId, data.type, callback);
    });

    // Listen for a browser requesting a schedule to be added to a manageable
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **Object** schedule The schedule
    //     - **Object** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('addSchedule', function(data, callback) {
      process.socketLogger.debug('Browser says : addSchedule', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          schedule: {type: 'object', required: true},
          type: {type: 'string', required: true}
        });

        data.schedule = openVeoAPI.util.shallowValidateObject(data.schedule, {
          beginDate: {type: 'date', required: true, gt: new Date()},
          duration: {type: 'number', required: true},
          preset: {type: 'string', required: true},
          endDate: {type: 'date', gt: new Date(data.schedule.beginDate)},
          recurrent: {type: 'boolean', default: false}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'addSchedule'});
        return callback({
          error: errors.ADD_SCHEDULE_WRONG_PARAMETERS
        });
      }

      // Transform date literals into JavaScript Date objects
      if (data.schedule.endDate)
        data.schedule.endDate = new Date(data.schedule.endDate);

      data.schedule.beginDate = new Date(data.schedule.beginDate);
      data.schedule.beginDate.setSeconds(0);

      self.emit('addSchedule', data.id, data.schedule, data.type, callback);
    });

    // Listen for a browser requesting a schedule to be removed from a manageable
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **String** scheduleId The schedule id
    //     - **String** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('removeSchedule', function(data, callback) {
      process.socketLogger.debug('Browser says : removeSchedule', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          scheduleId: {type: 'string', required: true},
          type: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'removeSchedule'});
        return callback({
          error: errors.REMOVE_SCHEDULE_WRONG_PARAMETERS
        });
      }

      self.emit('removeSchedule', data.id, data.scheduleId, data.type, callback);
    });

    // Listen for a browser requesting manageable's history to be purged
    // With :
    //   - **Object* data Data with :
    //     - **String** id The manageable id
    //     - **String** type The manageable type
    //   - **Function** callback The function to respond to the browser
    socket.on('removeHistory', function(data, callback) {
      process.socketLogger.debug('Browser says : removeHistory', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          type: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'removeHistory'});
        return callback({
          error: errors.REMOVE_HISTORY_WRONG_PARAMETERS
        });
      }

      self.emit('removeHistory', data.id, data.type, callback);
    });

    // Listen to browser socket disconnection
    socket.on('disconnect', function() {
      process.socketLogger.info('Browser disconnected', {socketId: socket.id});
      self.emit('disconnected', socket.id);
    });

    // Listen to connection errors
    socket.on('error', function(error) {
      process.socketLogger.error('Error in browser communication', {socketId: socket.id, error: error});
      self.emit('error', socket.id, error);
    });

    // Listen for a browser requesting the list of devices
    //   - **Null** data data Nothing
    //   - **Function** callback The function to respond to the browser
    socket.on('devices', function(data, callback) {
      process.socketLogger.debug('Browser says : devices');
      self.emit('devices', callback);
    });

    // Listen for a browser requesting one or several devices settings
    // With :
    //   - **Object* data Data with :
    //     - **Array** ids The list of devices ids which need settings information
    //   - **Function** callback The function to respond to the browser
    socket.on('device.settings', function(data, callback) {
      process.socketLogger.debug('Browser says : device.settings', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          ids: {type: 'array<string>', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'device.settings'});
      }

      self.emit('device.settings', data.ids, callback);
    });

    // Listen for a browser requesting a device state update
    // With :
    //   - **Object* data Data with :
    //     - **String** id The device id
    //     - **String** state The new device state
    //   - **Function** callback The function to respond to the browser
    socket.on('device.updateState', function(data, callback) {
      process.socketLogger.debug('Browser says : device.updateState', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true},
          state: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'device.updateState'});
        return callback({
          error: errors.UPDATE_DEVICE_STATE_WRONG_PARAMETERS
        });
      }

      self.emit('device.updateState', data.id, data.state, callback);
    });

    // Listen for a browser requesting one or several devices to start a new recording session
    // With :
    //   - **Object* data Data with :
    //     - **Array** ids The list of devices ids on which a new recording session must be started
    //     - **[String]** presetId The id of the preset for the recording session
    //   - **Function** callback The function to respond to the browser
    socket.on('device.startSession', function(data, callback) {
      process.socketLogger.debug('Browser says : device.startSession', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          ids: {type: 'array<string>', required: true},
          presetId: {type: 'string'}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'device.startSession'});
        return callback({
          error: errors.START_DEVICE_SESSION_WRONG_PARAMETERS
        });
      }

      self.emit('device.startSession', data.ids, data.presetId, callback);
    });

    // Listen for a browser requesting one or several devices to stop a recording session
    // With :
    //   - **Object* data Data with :
    //     - **Array** ids The list of devices ids on which a new recording session must be stopped
    //   - **Function** callback The function to respond to the browser
    socket.on('device.stopSession', function(data, callback) {
      process.socketLogger.debug('Browser says : device.stopSession', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          ids: {type: 'array<string>', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'device.stopSession'});
        return callback({
          error: errors.STOP_DEVICE_SESSION_WRONG_PARAMETERS
        });
      }

      self.emit('device.stopSession', data.ids, callback);
    });

    // Listen for a browser requesting one or several devices to tag the current recording session
    // With :
    //   - **Object* data Data with :
    //     - **Array** ids The list of devices ids on which a current recording session must be tagged
    //   - **Function** callback The function to respond to the browser
    socket.on('device.indexSession', function(data, callback) {
      process.socketLogger.debug('Browser says : device.indexSession', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          ids: {type: 'array<string>', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'device.indexSession'});
        return callback({
          error: errors.INDEX_DEVICE_SESSION_WRONG_PARAMETERS
        });
      }

      self.emit('device.indexSession', data.ids, callback);
    });

    // Listen for a browser requesting the list of groups
    //   - **Object* data Nothing
    //   - **Function** callback The function to respond to the browser
    socket.on('groups', function(data, callback) {
      process.socketLogger.debug('Browser says : groups');
      self.emit('groups', callback);
    });

    // Listen for a browser requesting the creation of a new group
    //   - **Object* data Nothing
    //   - **Function** callback The function to respond to the browser
    socket.on('group.create', function(data, callback) {
      process.socketLogger.debug('Browser says : group.create');
      self.emit('group.create', callback);
    });

    // Listen for a browser requesting a device to be added to a group
    // With :
    //   - **Object* data Data with :
    //     - **String** deviceId The device id
    //     - **String** groupId The group id
    //   - **Function** callback The function to respond to the browser
    socket.on('group.addDevice', function(data, callback) {
      process.socketLogger.debug('Browser says : group.addDevice', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          deviceId: {type: 'string', required: true},
          groupId: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'group.addDevice'});
        return callback({
          error: errors.ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS
        });
      }

      self.emit('group.addDevice', data.deviceId, data.groupId, callback);
    });

    // Listen for a browser requesting a device to be removed from its group
    // With :
    //   - **Object* data Data with :
    //     - **String** id The id of the device
    //   - **Function** callback The function to respond to the browser
    socket.on('group.removeDevice', function(data, callback) {
      process.socketLogger.debug('Browser says : group.removeDevice', {data: data});

       // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'group.removeDevice'});
        return callback({
          error: errors.REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS
        });
      }

      self.emit('group.removeDevice', data.id, callback);
    });

  });
};

/**
 * Sends a "remove" event to connected browsers.
 *
 * @method remove
 * @param {Manageable} manageable The manageable
 */
BrowsersSocketNamespace.prototype.remove = function(manageable) {
  var data = {
    id: manageable.id,
    type: manageable.type
  };
  process.socketLogger.debug('Say "remove" to browsers', {data: data});
  this.namespace.emit('remove', data);
};

/**
 * Sends an "update" event to connected browsers.
 *
 * @method update
 * @param {Manageable} manageable The manageable
 * @param {String} key The manageable key to update
 * @param {Mixed} value The updated data
 */
BrowsersSocketNamespace.prototype.update = function(manageable, key, value) {
  var data = {
    key: key,
    value: value,
    type: manageable.type,
    id: manageable.id
  };
  process.socketLogger.debug('Say "update" to browsers', {data: data});
  this.namespace.emit('update', data);
};

/**
 * Sends an "add schedule" event to connected browsers.
 *
 * @method addSchedule
 * @param {Manageable} manageable The manageable
 * @param {Object} schedule The new schedule
 */
BrowsersSocketNamespace.prototype.addSchedule = function(manageable, schedule) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    schedule: schedule
  };
  process.socketLogger.debug('Say "addSchedule" to browsers', {data: data});
  this.namespace.emit('addSchedule', data);
};

/**
 * Sends a "remove schedule" event to connected browsers.
 *
 * @method removeSchedule
 * @param {Manageable} manageable The manageable
 * @param {String} scheduleId The schedule id
 */
BrowsersSocketNamespace.prototype.removeSchedule = function(manageable, scheduleId) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    scheduleId: scheduleId
  };
  process.socketLogger.debug('Say "removeSchedule" to browsers', {data: data});
  this.namespace.emit('removeSchedule', data);
};

/**
 * Sends an "add historic" event to connected browsers.
 *
 * @method addHistoric
 * @param {Manageable} manageable The manageable
 * @param {Object} historic The new historic
 */
BrowsersSocketNamespace.prototype.addHistoric = function(manageable, historic) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    historic: historic
  };
  process.socketLogger.debug('Say "addHistoric" to browsers', {data: data});
  this.namespace.emit('addHistoric', data);
};

/**
 * Sends a "remove historic" event to connected browsers.
 *
 * @method removeHistoric
 * @param {Manageable} manageable The manageable
 * @param {String} historicId The historic id
 */
BrowsersSocketNamespace.prototype.removeHistoric = function(manageable, historicId) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    historicId: historicId
  };
  process.socketLogger.debug('Say "removeHistoric" to browsers', {data: data});
  this.namespace.emit('removeHistoric', data);
};

/**
 * Sends a "remove history" event to connected browsers.
 *
 * @method removeHistory
 * @param {Manageable} manageable The manageable
 */
BrowsersSocketNamespace.prototype.removeHistory = function(manageable) {
  var data = {
    id: manageable.id,
    type: manageable.type
  };
  process.socketLogger.debug('Say "removeHistory" to browsers', {data: data});
  this.namespace.emit('removeHistory', data);
};

/**
 * Sends a "connect" event to connected browsers to inform that a new device is connected.
 *
 * @method connect
 * @param {Object} device The new device
 */
BrowsersSocketNamespace.prototype.connectDevice = function(device) {
  process.socketLogger.debug('Say "device.connect" to browsers', {data: device});
  this.namespace.emit('device.connect', device);
};

/**
 * Sends an "update device state" event to connected browsers.
 *
 * @method updateDeviceState
 * @param {String} id The device id
 * @param {String} newState The new device state
 */
BrowsersSocketNamespace.prototype.updateDeviceState = function(id, newState) {
  var data = {
    id: id,
    state: newState
  };
  process.socketLogger.debug('Say "device.updateState" to browsers', {data: data});
  this.namespace.emit('device.updateState', data);
};

/**
 * Sends a "create group" event to connected browsers.
 *
 * @method createGroup
 * @param {Group} group The new group
 */
BrowsersSocketNamespace.prototype.createGroup = function(group) {
  var data = {
    group: group
  };
  process.socketLogger.debug('Say "group.create" to browsers', {data: data});
  this.namespace.emit('group.create', data);
};

/**
 * Sends an "add device to group" event to connected browsers.
 *
 * @method addDeviceToGroup
 * @param {String} deviceId The device id
 * @param {String} groupId The group id
 */
BrowsersSocketNamespace.prototype.addDeviceToGroup = function(deviceId, groupId) {
  var data = {
    deviceId: deviceId,
    groupId: groupId
  };
  process.socketLogger.debug('Say "group.addDevice" to browsers', {data: data});
  this.namespace.emit('group.addDevice', data);
};

/**
 * Sends a "remove device from group" event to connected browsers.
 *
 * @method removeDeviceFromGroup
 * @param {Number} id The device id
 */
BrowsersSocketNamespace.prototype.removeDeviceFromGroup = function(id) {
  var data = {
    id: id
  };
  process.socketLogger.debug('Say "group.removeDevice" to browsers', {data: data});
  this.namespace.emit('group.removeDevice', data);
};
