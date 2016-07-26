'use strict';

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
      device.status = 'ok';

      // Asks for device settings
      self.settings(socket);
      callback(error, device);
    }
  });
};

/**
 * Set the name of a device
 *
 * @method settingsName
 * @async
 * @param {Object} name The name of the device
 * @param {int} deviceId The id of the device we work on
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceListener.prototype.settingsName = function(name, deviceId, callback) {

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
 * Request for getting device storage and presets
 *
 * @method settings
 * @param {Object} socket The socket.io object
 */
DeviceListener.prototype.settings = function(socket) {
  socket.emit('get', 'settings.storage');
};

/**
 * Request for getting device presets
 *
 * @method presets
 * @param {Object} socket The socket.io object
 */
DeviceListener.prototype.presets = function(socket) {
  socket.emit('get', 'settings.presets');
};
