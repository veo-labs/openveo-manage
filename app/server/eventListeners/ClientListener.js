'use strict';

/**
 * Define function for events from clients
 *
 * @param ioDevice
 * @param ioClient
 * @param deviceModel
 * @constructor
 */
function ClientListener(ioDevice, ioClient, deviceModel) {

  this.ioDevice = ioDevice;
  this.ioClient = ioClient;
  this.deviceModel = deviceModel;
}

module.exports = ClientListener;

/* ClientListener.prototype.storage = function(data, devices) {
  var self = this,
    device;

  data.forEach(function(deviceId) {
    device = devices.find(function(device) {
      return device.deviceId == deviceId;
    });

    // Ask for storage
    self.ioDevice.sockets[device.socketId].emit('get', storage);
  });
};*/
