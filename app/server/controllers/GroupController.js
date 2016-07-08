'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var EntityController = openVeoAPI.controllers.EntityController;

// var errors = process.requireManage('app/server/httpErrors.js');

/**
 * Creates a GroupController
 *
 * @class GroupController
 * @constructor
 * @extends EntityController
 */
function GroupController() {
  EntityController.call(this, GroupModel);
}

module.exports = GroupController;
util.inherits(GroupController, EntityController);
