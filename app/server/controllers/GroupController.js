'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var errors = process.requireManage('app/server/httpErrors.js');

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

/**
 * Gets a list of groups with its devices.
 *
 * @method getEntitiesAction
 */
GroupController.prototype.getEntitiesAction = function(request, response, next) {
  var model = new this.Entity(request.user);

  model.get(null, function(error, entities) {
    if (error) {
      process.logger.error(error.message, {error: error, method: 'getEntitiesAction'});
      next(errors.GET_GROUPS_ERROR);
    } else {
      response.send({
        entities: entities
      });
    }
  });
};
