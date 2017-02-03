'use strict';

/**
 * @module providers
 */

var util = require('util');
var openVeoApi = require('@openveo/api');

/**
 * Defines a GroupProvider to interact with database to manage groups' entities.
 *
 * @class GroupProvider
 * @extends EntityProvider
 * @constructor
 * @param {Database} database The database to interact with
 */
function GroupProvider(database) {
  GroupProvider.super_.call(this, database, 'manage_groups');
}

module.exports = GroupProvider;
util.inherits(GroupProvider, openVeoApi.providers.EntityProvider);

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
