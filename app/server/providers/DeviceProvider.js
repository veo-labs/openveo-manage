'use strict';

/**
 * @module providers
 */

var util = require('util');
var openVeoApi = require('@openveo/api');

/**
 * Defines a DeviceProvider to interact with database to manage devices' entities.
 *
 * @class DeviceProvider
 * @extends EntityProvider
 * @constructor
 * @param {Database} database The database to interact with
 */
function DeviceProvider(database) {
  DeviceProvider.super_.call(this, database, 'manage_devices');
}

module.exports = DeviceProvider;
util.inherits(DeviceProvider, openVeoApi.providers.EntityProvider);

/**
 * Creates devices indexes.
 *
 * @method createIndexes
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
DeviceProvider.prototype.createIndexes = function(callback) {
  this.database.createIndexes(this.collection, [
    {key: {id: 1}, name: 'byId'}
  ], function(error, result) {
    if (result && result.note)
      process.logger.debug('Create devices indexes : ' + result.note);

    callback(error);
  });
};
