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
 * Send a storage event to the client with the updated device
 *
 * @method storage
 * @param {Object} device The updated device with storage data
 */
ClientListener.prototype.storage = function(device) {
  this.ioClient.emit('settings.storage', device);
};
