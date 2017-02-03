'use strict';

/**
 * @module models
 */

var util = require('util');
var shortid = require('shortid');
var ManageableModel = process.requireManage('app/server/models/ManageableModel.js');

var STATES = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REFUSED: 'refused'
};
Object.freeze(STATES);

/**
 * Defines a DeviceModel to manage devices' entities.
 *
 * @class DeviceModel
 * @extends ManageableModel
 * @constructor
 * @param {DeviceProvider} provider The device provider
 */
function DeviceModel(provider) {
  DeviceModel.super_.call(this, provider);

  Object.defineProperties(this, {

    /**
     * The list of devices' states.
     *
     * @property STATES
     * @type Object
     * @final
     */
    STATES: {value: STATES},

    /**
     * The list of devices' available states.
     *
     * @property AVAILABLE_STATES
     * @type Array
     * @final
     */
    AVAILABLE_STATES: {value: [
      STATES.ACCEPTED,
      STATES.PENDING,
      STATES.REFUSED
    ]}

  });
}

module.exports = DeviceModel;
util.inherits(DeviceModel, ManageableModel);

/**
 * Adds a new device to the devices' collection.
 *
 * @method add
 * @async
 * @param {Object} data A device description object
 * @param {string} [data.id] Device's id
 * @param {string} [data.state] Device's state
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted device
 */
DeviceModel.prototype.add = function(data, callback) {
  if (!data.state) {
    data.state = this.STATES.PENDING;
  } else if (this.AVAILABLE_STATES.indexOf(data.state) < 0) {
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
