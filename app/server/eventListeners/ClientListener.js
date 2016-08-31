'use strict';

/**
 * Define function for events from clients
 *
 * @param ioClient
 * @constructor
 */
function ClientListener(ioClient) {

  this.ioClient = ioClient;
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
 * @param {String} key The device key to update
 * @param {Object | String} The updated data
 * @param {String} id the device id
 */
ClientListener.prototype.update = function(key, data, id) {
  this.ioClient.emit('update', {key: key, data: data, id: id});
};

/**
 * Send an event to the client for removing the device or group
 *
 * @method remove
 * @param {String} id the device or group id to remove
 */
ClientListener.prototype.remove = function(id) {
  this.ioClient.emit('remove', {id: id});
};

/**
 * Sned an event to the client when updating the state of a device
 *
 * @method updateState
 * @param {Object} data Contain the id of the new device
 */
ClientListener.prototype.updateState = function(data) {
  this.ioClient.emit('updateState', data);
};
