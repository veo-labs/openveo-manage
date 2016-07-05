'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a GroupProvider.
 */
function GroupProvider(database) {

  // In GroupProvider collection "groups"
  openVeoAPI.EntityProvider.call(this, database, 'manage_groups');
}

// GroupProvider must extend EntityProvider
module.exports = GroupProvider;
util.inherits(GroupProvider, openVeoAPI.EntityProvider);
