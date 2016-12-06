'use strict';

var util = require('util');
var shortid = require('shortid');
var openVeoAPI = require('@openveo/api');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var ManageableModel = process.requireManage('app/server/models/ManageableModel.js');

/**
 * Creates a GroupModel to manage devices' groups.
 *
 * @class GroupModel
 * @constructor
 * @extends ManageableModel
 */
function GroupModel() {
  ManageableModel.call(this, new GroupProvider(openVeoAPI.applicationStorage.getDatabase()));

  /**
   * Device provider.
   *
   * @property deviceProvider
   * @type DeviceProvider
   */
  this.deviceProvider = new DeviceProvider(openVeoAPI.applicationStorage.getDatabase());
}

module.exports = GroupModel;
util.inherits(GroupModel, ManageableModel);

/**
 * Adds a new group.
 *
 * @example
 *     var GroupModel = new process.require("app/server/models/GroupModel.js");
 *     var group = new GroupModel();
 *     group.add({
 *       id : "Optional group id",
 *       name : "Optional group name (default to 'MANAGE.GROUP.DEFAULT_NAME')",
 *       history : [] // Optional history
 *     }, callback);
 *
 * @method add
 * @async
 * @param {Object} data A group description object
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
