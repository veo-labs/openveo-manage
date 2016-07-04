'use strict';

function DeviceListener(socketManager) {

  this.socketManager = socketManager;
}

module.exports = DeviceListener;

/**
 * Initialize the hello callback to connect a device
 *
 * @method hello
 * @private
 * @param {Object} data Data received from the device
 */
DeviceListener.hello = function(data) {
  var self = this;

  // Retrieve device
  this.deviceModel.getOne(data.id, null, function(error, device) {

    // Device does not exist, create it
    if (error || !device) {
      self.deviceModel.add(data, function(error, total, createdDevice) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else {

          // Cache the device if not present
          addDevice.call(self, createdDevice);
        }
      });
      self.ioClient.emit('hello', data);
    } else {

      // Cache the device if not present
      addDevice.call(self, device);

      // TODO : Update device status
    }
  });
};
