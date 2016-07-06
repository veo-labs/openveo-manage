'use strict';

// Module dependencies
var util = require('util');
var openVeoAPI = require('@openveo/api');

var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');

/**
 * Creates a DeviceModel.
 */
function DeviceModel() {
  openVeoAPI.EntityModel.call(this, new DeviceProvider(openVeoAPI.applicationStorage.getDatabase()));
}

module.exports = DeviceModel;
util.inherits(DeviceModel, openVeoAPI.EntityModel);

DeviceModel.STATE_ACCEPTED = 'accepted';
DeviceModel.STATE_PENDING = 'pending';
DeviceModel.STATE_REFUSED = 'refused';
DeviceModel.availableStates = [DeviceModel.STATE_ACCEPTED, DeviceModel.STATE_PENDING, DeviceModel.STATE_REFUSED];

/**
 * Adds a new device to the devices' collection.
 *
 * @example
 *     var DeviceModel = new process.require("app/server/models/DeviceModel.js");
 *     var device = new DeviceModel();
 *     device.add({
 *       id : "Device id",
 *       name : "Name of the device",
 *       state : "The state of the device (accepted, pending, refused)"
 *     }, callback);
 *
 * @method add
 * @async
 * @param {Object} data A device object
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted device
 */
DeviceModel.prototype.add = function(data, callback) {

  if (!data.state) {
    data.state = DeviceModel.STATE_PENDING;
  } else if (DeviceModel.availableStates.indexOf(data.state) < 0) {
    return callback(new Error('Invalid device state ' + data.state));
  }

  var device = {
    id: data.id,
    name: data.name || 'Device',
    state: data.state
  };
  this.provider.add(device, function(error, addedCount, devices) {
    if (callback)
      callback(error, addedCount, devices && devices[0]);
  });
};
