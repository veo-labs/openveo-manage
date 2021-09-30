'use strict';

/**
 * @module manage/providers/DeviceProvider
 */

var util = require('util');
var nanoid = require('nanoid').nanoid;
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
 * @extends module:manage/providers/ManageableProvider~ManageableProvider
 * @constructor
 * @param {Storage} storage The storage to use to store provider entities
 * @see {@link https://github.com/veo-labs/openveo-api|OpenVeo API documentation} for more information about Storage
 */
function DeviceProvider(storage) {
  DeviceProvider.super_.call(this, storage, 'manage_devices');

  Object.defineProperties(this,

    /** @lends module:manage/providers/DeviceProvider~DeviceProvider */
    {

      /**
       * The list of devices' states.
       *
       * @type {Object}
       * @instance
       * @readonly
       */
      STATES: {value: STATES},

      /**
       * The list of devices' available states.
       *
       * @type {Array}
       * @instance
       * @readonly
       */
      AVAILABLE_STATES: {value: [
        STATES.ACCEPTED,
        STATES.PENDING,
        STATES.REFUSED
      ]}

    }

  );
}

module.exports = DeviceProvider;
util.inherits(DeviceProvider, ManageableProvider);

/**
 * Adds devices.
 *
 * @param {Array} devices The list of devices to store with for each device:
 * @param {String} [devices[].id] The device id, generated if not specified
 * @param {String} [devices[].name] The device name
 * @param {String} [devices[].state] The device default state
 * @param {module:manage/providers/DeviceProvider~DeviceProvider~addCallback} [callback] The function to call when it's
 * done
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
      id: device.id || nanoid(),
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
 * @param {ResourceFilter} [filter] Rules to filter device to update
 * @param {String} [filter.name] The device name
 * @param {String} [filter.state] The device default state
 * @param {Array} [filter.history] The device history messages
 * @param {Array} [filter.schedules] The device schedules
 * @param {String} [filter.group] The device associated group
 * @param {module:manage/providers/DeviceProvider~DeviceProvider~updateOneCallback} [callback] The function to call
 * when it's done
 */
DeviceProvider.prototype.updateOne = function(filter, data, callback) {
  var modifications = {};
  if (data.name) modifications.name = data.name;
  if (data.state && this.AVAILABLE_STATES.indexOf(data.state) >= 0) modifications.state = data.state;
  if (data.history) modifications.history = data.history;
  if (data.schedules) modifications.schedules = data.schedules;
  if (Object.prototype.hasOwnProperty.call(data, 'group')) modifications.group = data.group;

  DeviceProvider.super_.prototype.updateOne.call(this, filter, modifications, callback);
};

/**
 * Creates devices indexes.
 *
 * @param {callback} callback Function to call when it's done
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

/**
 * @callback module:manage/providers/DeviceProvider~DeviceProvider~addCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total The total amount of devices inserted
 * @param {Array} devices The list of added devices
 */

/**
 * @callback module:manage/providers/DeviceProvider~DeviceProvider~updateOneCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */
