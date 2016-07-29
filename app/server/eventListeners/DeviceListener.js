'use strict';

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
          createdDevice.status = 'ok';

          // Asks for device settings
          socket.emit('get', 'settings.name');
          callback(error, createdDevice);
        }
      });
    } else {
      if (device.state === DeviceModel.STATE_ACCEPTED) {
        device.status = 'ok';

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
 * @param {Object} name The name of the device
 * @param {int} deviceId The id of the device we work on
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.setName = function(name, deviceId, callback) {

  // update device name
  this.deviceModel.update(deviceId, name, function(error) {
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
  socket.emit('get', 'storage');
  socket.emit('get', 'inputs');
  socket.emit('get', 'settings.presets');
};

/**
 * Send request for updating the device name
 *
 * @method updateName
 * @param socket
 * @param name
 */
DeviceListener.prototype.updateName = function(socket, name) {
  socket.emit('settings.name', name);
};
