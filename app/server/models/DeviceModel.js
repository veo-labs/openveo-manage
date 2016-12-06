'use strict';

var util = require('util');
var shortid = require('shortid');
var openVeoAPI = require('@openveo/api');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var ManageableModel = process.requireManage('app/server/models/ManageableModel.js');

/**
 * Creates a DeviceModel to manage devices entities.
 *
 * @class DeviceModel
 * @constructor
 * @extends ManageableModel
 */
function DeviceModel() {
  ManageableModel.call(this, new DeviceProvider(openVeoAPI.applicationStorage.getDatabase()));
}

module.exports = DeviceModel;
util.inherits(DeviceModel, ManageableModel);

// List of status available for a device
DeviceModel.STATUS = {
  STOPPED: 'stopped',
  ERROR: 'error',
  STARTED: 'started',
  STARTING: 'starting',
  STOPPING: 'stopping',
  DISCONNECTED: 'disconnected',
  UNKNOWN: 'unknown'
};

// List of states available for a device
DeviceModel.STATES = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REFUSED: 'refused'
};

DeviceModel.availableStatus = [
  DeviceModel.STATUS.STOPPED,
  DeviceModel.STATUS.ERROR,
  DeviceModel.STATUS.STARTED,
  DeviceModel.STATUS.STARTING,
  DeviceModel.STATUS.STOPPING,
  DeviceModel.STATUS.DISCONNECTED,
  DeviceModel.STATUS.UNKNOWN
];

DeviceModel.availableStates = [
  DeviceModel.STATES.ACCEPTED,
  DeviceModel.STATES.PENDING,
  DeviceModel.STATES.REFUSED
];

/**
 * Adds a new device to the devices' collection.
 *
 * @example
 *     var DeviceModel = new process.require("app/server/models/DeviceModel.js");
 *     var device = new DeviceModel();
 *     device.add({
 *       id : "Optional device id",
 *       state : "Optional device state (default to STATES.PENDING)"
 *     }, callback);
 *
 * @method add
 * @async
 * @param {Object} data A device description object
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted device
 */
DeviceModel.prototype.add = function(data, callback) {
  if (!data.state) {
    data.state = DeviceModel.STATES.PENDING;
  } else if (DeviceModel.availableStates.indexOf(data.state) < 0) {
    return callback(new Error('Invalid device state ' + data.state));
  }

  var device = {
    id: data.id || shortid.generate(),
    name: '',
    state: data.state,
    history: [],
    schedules: []
  };
  this.provider.add(device, function(error, addedCount, devices) {
    if (callback)
      callback(error, addedCount, devices && devices[0]);
  });
};
