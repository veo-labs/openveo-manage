'use strict';

// Module dependencies
var util = require('util');
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
