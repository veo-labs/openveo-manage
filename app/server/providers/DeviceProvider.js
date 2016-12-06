'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a DeviceProvider to interact with database to manage devices.
 *
 * @class DeviceProvider
 * @constructor
 * @param {Object} database The database configuration
 */
function DeviceProvider(database) {
  openVeoAPI.EntityProvider.call(this, database, 'manage_devices');
}

module.exports = DeviceProvider;
util.inherits(DeviceProvider, openVeoAPI.EntityProvider);

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
    {key: {id: 1}, id: 'byId'}
  ], function(error, result) {
    if (result && result.note)
      process.logger.debug('Create devices indexes : ' + result.note);

    callback(error);
  });
};
