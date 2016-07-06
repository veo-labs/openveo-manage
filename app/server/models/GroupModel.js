'use strict';

// Module dependencies
var util = require('util');
var shortid = require('shortid');
var openVeoAPI = require('@openveo/api');

var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');

/**
 * Creates a GroupModel.
 */
function GroupModel() {
  openVeoAPI.EntityModel.call(this, new GroupProvider(openVeoAPI.applicationStorage.getDatabase()));
}

module.exports = GroupModel;
util.inherits(GroupModel, openVeoAPI.EntityModel);

/**
 * Adds a new group of devices to the manage groups' collection.
 *
 * @example
 *     var GroupModel = new process.require("app/server/models/GroupModel.js");
 *     var group = new GroupModel();
 *     group.add({
 *       id : "Group id",
 *       name : "Name of the group devices"
 *     }, callback);
 *
 * @method add
 * @async
 * @param {Object} data A group object
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted group
 */
GroupModel.prototype.add = function(data, callback) {

  var group = {
    id: data.id || shortid.generate(),
    name: data.name || 'Groupe'
  };
  this.provider.add(group, function(error, addedCount, groups) {
    if (callback)
      callback(error, addedCount, groups && groups[0]);
  });
};
