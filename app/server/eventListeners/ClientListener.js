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

/**
 * Send an hello event to the client with the connected device
 *
 * @method hello
 * @param {Object} device The new device
 */
ClientListener.prototype.hello = function(device) {
  this.ioClient.emit('hello', device);
};

/**
 * Send an event to the client with the updated device
 *
 * @method update
 * @param {Object} device The updated device with storage data
 */
ClientListener.prototype.update = function(device) {
  this.ioClient.emit('update', device);
};
