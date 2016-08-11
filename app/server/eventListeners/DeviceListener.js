'use strict';

var async = require('async');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');

/**
 * Define functions for events from devices
 *
 * @param ioDevice
 * @param ioClient
 * @param deviceModel
 * @constructor
 */
function DeviceListener(ioDevice, ioClient, deviceModel) {

  this.ioDevice = ioDevice;
  this.ioClient = ioClient;
  this.deviceModel = deviceModel;
}

module.exports = DeviceListener;

/**
 * Initialize the hello callback to connect a device
 *
 * @method hello
 * @async
 * @param {Object} data Data received from the device
 * @param {Object} socket The socket linked to the device
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, device otherwise
 */
DeviceListener.prototype.hello = function(data, socket, callback) {
  var self = this;

  // Retrieve device
  this.deviceModel.getOne(data.id, null, function(error, device) {

    // Device does not exist, create it
    if (error || !device) {
      self.deviceModel.add(data, function(error, total, createdDevice) {
        if (error) {
          callback(error);
        } else {

          // Asks for device settings
          socket.emit('get', {event: 'settings.name'});
          socket.emit('get', {event: 'session.status'});
          callback(error, createdDevice);
        }
      });
    } else {
      if (device.state === DeviceModel.STATE_ACCEPTED) {
        socket.emit('get', {event: 'session.status'});

        // Asks for device settings
        self.settings(socket);
      }

      callback(error, device);
    }
  });
};

/**
 * Set the name of a device on the first connexion
 *
 * @method setName
 * @async
 * @param {String} name The name of the device
 * @param {int} deviceId The id of the device we work on
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.setName = function(name, deviceId, callback) {

  // update device name
  this.deviceModel.update(deviceId, {name: name}, function(error) {
    if (error) {
      callback(error);
    } else {
      callback();
    }
  });
};

/**
 * Request for getting device settings
 *
 * @method settings
 * @param {Object} socket The socket.io object
 */
DeviceListener.prototype.settings = function(socket) {
  socket.emit('get', {event: 'storage'});
  socket.emit('get', {event: 'inputs'});
  socket.emit('get', {event: 'settings.presets'});
};

/**
 * Send request for updating the device name
 *
 * @method updateName
 * @param {Object} socket The socket.io object
 * @param {String} name The new name of the device
 */
DeviceListener.prototype.updateName = function(socket, name) {
  socket.emit('settings.name', {name: name});
};

/**
 * Send request to start a recording session
 *
 * @method startRecord
 * @param {Array} sockets An array of sockets
 * @param {Object} param The parameters containing the session id, the recording preset to use
 * and the optionally the devices ids
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.startRecord = function(sockets, param, callback) {
  var actions = [],
    startRecordAsyncFunction = function(socket, param) {
      return function(callback) {
        socket.emit('session.start', {
          id: param.scheduleId,
          preset: (param.preset) ? param.preset : null
        });
        callback();
      };
    };

  sockets.map(function(socket) {

    // Verify if socket is defined
    if (socket) {
      actions.push(startRecordAsyncFunction(socket, param));
    }
  });

  async.parallel(actions, function(error) {
    if (error) {
      process.logger.error(error, {error: error, method: 'startRecord'});
      callback(error);
    } else {
      callback();
    }
  });
};

/**
 * Send request to stop a recording session
 *
 * @method stopRecord
 * @param {Array} sockets An array of sockets
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.stopRecord = function(sockets, callback) {
  var actions = [],
    stopRecordAsyncFunction = function(socket) {
      return function(callback) {
        socket.emit('session.stop');
        callback();
      };
    };

  sockets.map(function(socket) {

    // Verify if socket is defined
    if (socket) {
      actions.push(stopRecordAsyncFunction(socket));
    }
  });

  async.parallel(actions, function(error) {
    if (error) {
      process.logger.error(error, {error: error, method: 'stopRecord'});
      callback(error);
    } else {
      callback();
    }
  });
};

/**
 * Send request to tag a recording session
 *
 * @method tagRecord
 * @param {Array} sockets An array of sockets
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.tagRecord = function(sockets, callback) {
  var actions = [],
    tagRecordAsyncFunction = function(socket) {
      return function(callback) {
        socket.emit('session.index', {
          type: 'tag'
        });
        callback();
      };
    };

  sockets.map(function(socket) {

    // Verify if socket is defined
    if (socket) {
      actions.push(tagRecordAsyncFunction(socket));
    }
  });

  async.parallel(actions, function(error) {
    if (error) {
      process.logger.error(error, {error: error, method: 'stopRecord'});
      callback(error);
    } else {
      callback();
    }
  });
};
