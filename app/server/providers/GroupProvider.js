'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a GroupProvider to interact with database to manage groups.
 *
 * @class GroupProvider
 * @constructor
 * @param {Object} database The database configuration
 */
function GroupProvider(database) {
  openVeoAPI.EntityProvider.call(this, database, 'manage_groups');
}

module.exports = GroupProvider;
util.inherits(GroupProvider, openVeoAPI.EntityProvider);

/**
 * Creates groups indexes.
 *
 * @method createIndexes
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
GroupProvider.prototype.createIndexes = function(callback) {
  this.database.createIndexes(this.collection, [
    {key: {id: 1}, id: 'byId'}
  ], function(error, result) {
    if (result && result.note)
      process.logger.debug('Create manage groups indexes : ' + result.note);

    callback(error);
  });
};
