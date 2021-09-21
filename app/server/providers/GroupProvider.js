'use strict';

/**
 * @module providers
 */

var util = require('util');
var nanoid = require('nanoid').nanoid;
var ManageableProvider = process.requireManage('app/server/providers/ManageableProvider.js');

/**
 * Defines a GroupProvider to interact with storage to manage groups' entities.
 *
 * @class GroupProvider
 * @extends ManageableProvider
 * @constructor
 * @param {Storage} storage The storage to use to store provider entities
 */
function GroupProvider(storage) {
  GroupProvider.super_.call(this, storage, 'manage_groups');
}

module.exports = GroupProvider;
util.inherits(GroupProvider, ManageableProvider);

/**
 * Adds groups.
 *
 * @method add
 * @async
 * @param {Array} groups The list of groups to store with for each group:
 *   - **String** [id] The group id, generated if not specified
 *   - **String** [name='MANAGE.GROUP.DEFAULT_NAME'] The group name
 *   - **Array** [history] The group history messages
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of groups inserted
 *   - **Array** The list of added groups
 */
GroupProvider.prototype.add = function(groups, callback) {
  var groupsToAdd = [];

  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];

    groupsToAdd.push({
      id: group.id || nanoid(),
      name: group.name || 'MANAGE.GROUP.DEFAULT_NAME',
      schedules: [],
      history: group.history || []
    });
  }

  GroupProvider.super_.prototype.add.call(this, groupsToAdd, callback);
};

/**
 * Updates a group.
 *
 * @method updateOne
 * @async
 * @param {ResourceFilter} [filter] Rules to filter group to update
 * @param {String} [name] The group name
 * @param {Array} [history] The group history messages
 * @param {Array} [schedules] The group schedules
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** 1 if everything went fine
 */
GroupProvider.prototype.updateOne = function(filter, data, callback) {
  var modifications = {};
  if (data.name) modifications.name = data.name;
  if (data.history) modifications.history = data.history;
  if (data.schedules) modifications.schedules = data.schedules;

  GroupProvider.super_.prototype.updateOne.call(this, filter, modifications, callback);
};

/**
 * Creates groups indexes.
 *
 * @method createIndexes
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
GroupProvider.prototype.createIndexes = function(callback) {
  this.storage.createIndexes(this.location, [
    {key: {id: 1}, name: 'byId'}
  ], function(error, result) {
    if (result && result.note)
      process.logger.debug('Create manage groups indexes : ' + result.note);

    callback(error);
  });
};
