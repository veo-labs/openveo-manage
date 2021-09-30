'use strict';

/**
 * @module manage/providers/GroupProvider
 */

var util = require('util');
var nanoid = require('nanoid').nanoid;
var ManageableProvider = process.requireManage('app/server/providers/ManageableProvider.js');

/**
 * Defines a GroupProvider to interact with storage to manage groups' entities.
 *
 * @class GroupProvider
 * @extends module:manage/providers/ManageableProvider~ManageableProvider
 * @constructor
 * @param {Storage} storage The storage to use to store provider entities
 * @see {@link https://github.com/veo-labs/openveo-api|OpenVeo API documentation} for more information about Storage
 */
function GroupProvider(storage) {
  GroupProvider.super_.call(this, storage, 'manage_groups');
}

module.exports = GroupProvider;
util.inherits(GroupProvider, ManageableProvider);

/**
 * Adds groups.
 *
 * @param {Array} groups The list of groups to store with for each group:
 * @param {String} [groups[].id] The group id, generated if not specified
 * @param {String} [groups[].name='MANAGE.GROUP.DEFAULT_NAME'] The group name
 * @param {Array} [groups[].history] The group history messages
 * @param {module:manage/providers/GroupProvider~GroupProvider~addCallback} [callback] The function to call when it's
 * done
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
 * @param {ResourceFilter} [filter] Rules to filter group to update
 * @param {String} [name] The group name
 * @param {Array} [history] The group history messages
 * @param {Array} [schedules] The group schedules
 * @param {module:manage/providers/GroupProvider~GroupProvider~updateOneCallback} [callback] The function to call when
 * it's done
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
 * @param {callback} callback Function to call when it's done
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

/**
 * @callback module:manage/providers/GroupProvider~GroupProvider~addCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total The total amount of groups inserted
 * @param {Array} groups The list of added groups
 */

/**
 * @callback module:manage/providers/GroupProvider~GroupProvider~updateOneCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */
