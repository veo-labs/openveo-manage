'use strict';

/**
 * @module providers
 */

var util = require('util');
var shortid = require('shortid');
var ManageableProvider = process.requireManage('app/server/providers/ManageableProvider.js');

var STATES = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REFUSED: 'refused'
};
Object.freeze(STATES);

/**
 * Defines a DeviceProvider to interact with storage to manage devices' entities.
 *
 * @class DeviceProvider
 * @extends ManageableProvider
 * @constructor
 * @param {Storage} storage The storage to use to store provider entities
 */
function DeviceProvider(storage) {
  DeviceProvider.super_.call(this, storage, 'manage_devices');

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

module.exports = DeviceProvider;
util.inherits(DeviceProvider, ManageableProvider);

/**
 * Adds devices.
 *
 * @method add
 * @async
 * @param {Array} devices The list of devices to store with for each device:
 *   - **String** [id] The device id, generated if not specified
 *   - **String** [name] The device name
 *   - **String** [state] The device default state
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of devices inserted
 *   - **Array** The list of added devices
 */
DeviceProvider.prototype.add = function(devices, callback) {
  var devicesToAdd = [];

  for (var i = 0; i < devices.length; i++) {
    var device = devices[i];

    if (!device.state)
      device.state = this.STATES.PENDING;
    else if (this.AVAILABLE_STATES.indexOf(device.state) < 0)
      return this.executeCallback(callback, new Error('Invalid device state ' + device.state));

    devicesToAdd.push({
      id: device.id || shortid.generate(),
      name: '',
      state: device.state,
      history: [],
      schedules: []
    });
  }

  DeviceProvider.super_.prototype.add.call(this, devicesToAdd, callback);
};

/**
 * Updates a device.
 *
 * @method updateOne
 * @async
 * @param {ResourceFilter} [filter] Rules to filter device to update
 * @param {String} [filter.name] The device name
 * @param {String} [filter.state] The device default state
 * @param {Array} [filter.history] The device history messages
 * @param {Array} [filter.schedules] The device schedules
 * @param {String} [filter.group] The device associated group
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** 1 if everything went fine
 */
DeviceProvider.prototype.updateOne = function(filter, data, callback) {
  var modifications = {};
  if (data.name) modifications.name = data.name;
  if (data.state && this.AVAILABLE_STATES.indexOf(data.state) >= 0) modifications.state = data.state;
  if (data.history) modifications.history = data.history;
  if (data.schedules) modifications.schedules = data.schedules;
  if (data.hasOwnProperty('group')) modifications.group = data.group;

  DeviceProvider.super_.prototype.updateOne.call(this, filter, modifications, callback);
};

/**
 * Creates devices indexes.
 *
 * @method createIndexes
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceProvider.prototype.createIndexes = function(callback) {
  this.storage.createIndexes(this.location, [
    {key: {id: 1}, name: 'byId'}
  ], function(error, result) {
    if (result && result.note)
      process.logger.debug('Create devices indexes : ' + result.note);

    callback(error);
  });
};
