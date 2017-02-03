'use strict';

/**
 * @module models
 */

var util = require('util');
var shortid = require('shortid');
var ManageableModel = process.requireManage('app/server/models/ManageableModel.js');

/**
 * Defines a GroupModel to manage groups' entities.
 *
 * @class GroupModel
 * @extends ManageableModel
 * @constructor
 * @param {GroupProvider} groupProvider The group provider
 * @param {DeviceProvider} deviceProvider The device provider
 */
function GroupModel(groupProvider, deviceProvider) {
  GroupModel.super_.call(this, groupProvider);

  Object.defineProperties(this, {

    /**
     * Device provider.
     *
     * @property deviceProvider
     * @type DeviceProvider
     * @final
     */
    deviceProvider: {value: deviceProvider}

  });
}

module.exports = GroupModel;
util.inherits(GroupModel, ManageableModel);

/**
 * Adds a new group.
 *
 * @method add
 * @async
 * @param {Object} data A group description object
 * @param {String} [data.id] Group's id
 * @param {String} [data.name] Group's name
 * @param {Array} [data.history] Group's history
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted group
 */
GroupModel.prototype.add = function(data, callback) {
  var group = {
    id: data.id || shortid.generate(),
    name: data.name || 'MANAGE.GROUP.DEFAULT_NAME',
    schedules: [],
    history: data.history || []
  };

  this.provider.add(group, function(error, addedCount, groups) {
    if (callback)
      callback(error, addedCount, groups && groups[0]);
  });
};
