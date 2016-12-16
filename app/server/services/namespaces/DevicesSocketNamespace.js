'use strict';

var util = require('util');
var shortid = require('shortid');
var async = require('async');
var openVeoAPI = require('@openveo/api');
var SocketNamespace = process.requireManage('app/server/socket/SocketNamespace.js');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');

/**
 * Defines a device error.
 *
 * @class DeviceError
 * @constructor
 * @extends Error
 * @param {String} message The error message
 * @param {Number} deviceId The corresponding device id
 * @param {String} code The error code
 */
function DeviceError(message, deviceId, code) {
  this.name = 'DeviceError';
  this.deviceId = deviceId;
  this.message = message || '';
  this.code = code;
}

util.inherits(DeviceError, Error);

module.exports = DeviceError;

/**
 * Creates a socket.io namespace to communicate with devices.
 *
 * DevicesSocketNamespace emits the following events :
 *  - Event *connected* A new device is connected
 *    - **String** The new connected device id
 *    - **String** The id of the device's socket
 *    - **String** The device HTTP address
 *  - Event *session.status* Status of a device has been updated
 *    - **String** The id of the device's socket
 *    - **String** The new session status
 *  - Event *settings.name* Name of a device has been updated
 *    - **String** The id of the device's sock
 *    - **String** The device name
 *  - Event *settings.presets* Configured presets of a device have changed
 *    - **String** The id of the device's socket
 *    - **Object** The list of configured presets
 *  - Event *storage* Storage of a device has been updated
 *    - **String** The id of the device's socket
 *    - **Number** Number of free Bytes
 *    - **Number** Number of used Bytes
 *  - Event *inputs* Inputs of a device have changed
 *    - **String** The id of the device's socket
 *    - **Object** Camera input status
 *    - **Object** Slides input status
 *  - Event *disconnected* A device has been disconnected
 *    - **String** The id of the device's socket
 *  - Event *error* Something went wrong on the connection with a device
 *    - **String** The id of the device's socket
 *    - **Error** The socket.io error
 *
 * @class DevicesSocketNamespace
 * @extends SocketNamespace
 * @constructor
 */
function DevicesSocketNamespace() {
  DevicesSocketNamespace.super_.call(this);
}

util.inherits(DevicesSocketNamespace, SocketNamespace);
module.exports = DevicesSocketNamespace;

/**
 * Connects the namespace to the socket.io server.
 *
 * @method connect
 * @param {SocketServer} socketServer The socket server to connect to
 * @param {String} name The name to use to mount the namespace on the socket server
 */
DevicesSocketNamespace.prototype.connect = function(socketServer, name) {
  DevicesSocketNamespace.super_.prototype.connect.call(this, socketServer, name);
  var self = this;

  // Listen to new connected devices
  this.namespace.on('connection', function(socket) {
    process.socketLogger.info('New device connected', {socketId: socket.id});

    // New device connected

    // Listen to new connected devices
    // With :
    //   - **Object** data Information about the device with :
    //     - **String** id The device unique id
    socket.on('hello', function(data) {
      process.socketLogger.debug('Device says : hello', {data: data, ip: socket.handshake.address});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          id: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'hello'});
        return;
      }

      self.emit('connected', data.id, socket.id, socket.handshake.address);
    });

    // Listen to device's status modifications
    // With:
    //   - **Object** data Data with :
    //     - **String** status The new session status
    socket.on('session.status', function(data) {
      process.socketLogger.debug('Device says : session.status', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          status: {type: 'string', required: true, in: DeviceModel.availableStatus}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'session.status'});
        return;
      }

      self.emit('session.status', socket.id, data.status);
    });

    // Listen to device's name modifications
    // With:
    //   - **Object** data Data with :
    //     - **String** name The device name
    socket.on('settings.name', function(data) {
      process.socketLogger.debug('Device says : settings.name', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          name: {type: 'string', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'settings.name'});
        return;
      }

      self.emit('settings.name', socket.id, data.name);
    });

    // Listen to device's presets modifications
    // With:
    //   - **Object** presets The list of configured presets
    socket.on('settings.presets', function(presets) {
      var data = null;
      process.socketLogger.debug('Device says : settings.presets', {presets: presets});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject({
          presets: presets
        }, {
          presets: {type: 'object', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'settings.presets'});
        return;
      }

      self.emit('settings.presets', socket.id, data.presets);
    });

    // Listen to device's storage modifications
    // With:
    //   - **Object** data Data with :
    //     - **Number** free Number of free Bytes
    //     - **Number** used Number of used Bytes
    socket.on('storage', function(data) {
      process.socketLogger.debug('Device says : storage', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          free: {type: 'number', required: true},
          used: {type: 'number', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'storage'});
        return;
      }

      self.emit('storage', socket.id, data.free, data.used);
    });

    // Listen to device's inputs modifications
    // With:
    //   - **Object** data Data with :
    //     - **Object** camera Camera input status
    //     - **Object** slides Slides input status
    socket.on('inputs', function(data) {
      process.socketLogger.debug('Device says : inputs', {data: data});

      // Validate data
      try {
        data = openVeoAPI.util.shallowValidateObject(data, {
          camera: {type: 'object', required: true},
          slides: {type: 'object', required: true}
        });
      } catch (error) {
        process.socketLogger.warn(error.message, {error: error, event: 'inputs'});
        return;
      }

      self.emit('inputs', socket.id, data.camera, data.slides);
    });

    // Listen to device disconnection
    socket.on('disconnect', function() {
      process.socketLogger.info('Device disconnected', {socketId: socket.id});
      self.emit('disconnected', socket.id);
    });

    // Listen to connection errors
    socket.on('error', function(error) {
      process.socketLogger.error('Error in device communication', {socketId: socket.id, error: error});
      self.emit('error', socket.id, error);
    });
  });
};

/**
 * Requests actual settings about a connected device.
 *
 * @method askForSettings
 * @async
 * @param {Socket} socket The socket linked to the device
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DevicesSocketNamespace.prototype.askForSettings = function(socket, callback) {
  var settings = ['session.status', 'storage', 'inputs', 'settings.presets'];
  var actions = [];

  settings.forEach(function(setting) {
    actions.push(function(callback) {
      if (!socket)
        return callback(new DeviceError('Device not connected anymore'));

      var data = {
        event: setting
      };
      process.socketLogger.debug('Say "get" to device', {socketId: socket.id, data: data});
      socket.emit('get', data, function(response) {
        if (response && response.error)
          return callback(new DeviceError('Getting setting "' + setting + '" failed',
                                                socket.deviceId,
                                                response.error.code));

        callback();
      });
    });
  });

  async.parallel(actions, callback);
};

/**
 * Requests connected device name.
 *
 * @method askForUpdateName
 * @async
 * @param {Socket} socket The socket.io object
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DevicesSocketNamespace.prototype.askForName = function(socket, callback) {
  if (!socket)
    return callback(new DeviceError('Device not connected anymore'));

  var data = {
    event: 'settings.name'
  };
  process.socketLogger.debug('Say "get" to device', {socketId: socket.id, data: data});
  socket.emit('get', data, function(response) {
    if (response && response.error)
      return callback(new DeviceError('Getting device name failed', socket.deviceId, response.error.code));

    callback();
  });
};

/**
 * Sends an "update name" event to the connected device to change its name.
 *
 * @method askForUpdateName
 * @async
 * @param {Socket} socket The socket.io object
 * @param {String} name The new name of the device
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DevicesSocketNamespace.prototype.askForUpdateName = function(socket, name, callback) {
  if (!socket)
    return callback(new DeviceError('Device not connected anymore'));

  var data = {
    name: name
  };
  process.socketLogger.debug('Say "settings.name" to device', {socketId: socket.id, data: data});
  socket.emit('settings.name', data, function(response) {
    if (response && response.error)
      return callback(new DeviceError('Updating device name failed (' + name + ')',
                                            socket.deviceId,
                                            response.error.code));

    callback();
  });
};

/**
 * Sends a "session start" event to connected devices to start a new recording session.
 *
 * @method askForStartRecord
 * @async
 * @param {Array} sockets The list of sockets associated to connected devices to start
 * @param {Number} [presetId] The id of the preset for the recording session
 * @param {Function} callback Function to call when it's done with :
 *  - **Array** The result for each device with :
 *    - **error** An error if something went wrong
 *    - **value** The device id
 */
DevicesSocketNamespace.prototype.askForStartRecord = function(sockets, presetId, callback) {
  var actions = [];

  sockets.forEach(function(socket) {
    if (socket) {
      actions.push(function(callback) {
        var data = {
          id: shortid.generate(),
          preset: (presetId) ? presetId : null
        };
        process.socketLogger.debug('Say "session.start" to device', {socketId: socket.id, data: data});
        socket.emit('session.start', data, function(response) {
          if (response && response.error)
            return callback(new DeviceError('Session start failed', socket.deviceId, response.error.code));

          callback(null, socket.deviceId);
        });
      });
    }
  });

  async.parallel(async.reflectAll(actions), callback);
};

/**
 * Sends a "stop session" event to connected devices to stop a recording session.
 *
 * @method askForStopRecord
 * @async
 * @param {Array} sockets The list of sockets associated to connected devices
 * @param {Function} callback Function to call when it's done with :
 *  - **Array** The result for each device with :
 *    - **error** An error if something went wrong
 *    - **value** The device id
 */
DevicesSocketNamespace.prototype.askForStopRecord = function(sockets, callback) {
  var actions = [];

  sockets.forEach(function(socket) {
    if (socket) {
      actions.push(function(callback) {
        process.socketLogger.debug('Say "session.stop" to device', {socketId: socket.id});
        socket.emit('session.stop', {}, function(response) {
          if (response && response.error)
            return callback(new DeviceError('Session stop failed', socket.deviceId, response.error.code));

          callback(null, socket.deviceId);
        });
      });
    }
  });

  async.parallel(async.reflectAll(actions), callback);
};

/**
 * Sends a "session index" event to connected devices to tag a recording session.
 *
 * @method askForSessionIndex
 * @async
 * @param {Array} sockets The list of sockets associated to connected devices
 * @param {Function} callback Function to call when it's done with :
 *  - **Array** The result for each device with :
 *    - **error** An error if something went wrong
 *    - **value** The device id
 */
DevicesSocketNamespace.prototype.askForSessionIndex = function(sockets, callback) {
  var actions = [];

  sockets.forEach(function(socket) {
    if (socket) {
      actions.push(function(callback) {
        var data = {
          type: 'tag'
        };
        process.socketLogger.debug('Say "session.index" to device', {socketId: socket.id, data: data});
        socket.emit('session.index', data, function(response) {
          if (response && response.error)
            return callback(new DeviceError('Session index failed', socket.deviceId, response.error.code));

          callback(null, socket.deviceId);
        });
      });
    }
  });

  async.parallel(async.reflectAll(actions), callback);
};

/**
 * Gets the list of opened sockets on this namespace.
 *
 * @method getOpenedSockets
 * @return {Array} The list of actually opened sockets
 */
DevicesSocketNamespace.prototype.getOpenedSockets = function() {
  return this.namespace.sockets;
};
