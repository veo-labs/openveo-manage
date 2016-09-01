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
 * Send an event to the client for removing the device
 *
 * @method removeDevice
 * @param {String} id the device id to remove
 */
ClientListener.prototype.removeDevice = function(id) {
  this.ioClient.emit('remove.device', {id: id});
};

/**
 * Send an event to the client when updating the state of a device
 *
 * @method updateState
 * @param {Object} data Contain the id of the new device
 */
ClientListener.prototype.updateState = function(data) {
  this.ioClient.emit('update.state', data);
};

/**
 * Send an event to the client when adding a device to a group
 *
 * @method addDeviceToGroup
 * @param {Object} data Contain the device ids an optionally the group
 */
ClientListener.prototype.addDeviceToGroup = function(data) {
  this.ioClient.emit('group.addDevice', data);
};

/**
 * Send an event to the client when removing a group
 *
 * @method removeGroup
 * @param {Object} data Contain the id of the group to remove
 */
ClientListener.prototype.removeGroup = function(data) {
  this.ioClient.emit('remove.group', data);
};
