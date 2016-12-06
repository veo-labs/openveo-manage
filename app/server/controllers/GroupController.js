'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var ManageServer = process.requireManage('app/server/services/ManageServer.js');
var errors = process.requireManage('app/server/errors.js');
var AccessError = openVeoAPI.errors.AccessError;

/**
 * Creates a GroupController to handle actions on groups.
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
 * Gets the list of groups.
 *
 * @example
 *     {
 *       "entities" : [ ... ]
 *     }
 *
 * @method getEntitiesAction
 */
GroupController.prototype.getEntitiesAction = function(request, response, next) {
  response.send({
    entities: ManageServer.get().getGroups()
  });
};

/**
 * Updates a group.
 *
 * Expects the following url parameters :
 *  - **id** The id of the group to update
 *
 * Also expects data in body.
 *
 * @method updateEntityAction
 */
EntityController.prototype.updateEntityAction = function(request, response, next) {
  if (request.params.id && request.body) {
    var model = new this.Entity(request.user),
      entityId = request.params.id,
      data = null;

    try {
      data = openVeoAPI.util.shallowValidateObject(request.body, {
        name: {type: 'string'},
        schedules: {type: 'array<object>'},
        history: {type: 'array<object>'}
      });
    } catch (error) {
      return next(errors.UPDATE_GROUP_WRONG_PARAMETERS);
    }

    model.update(entityId, request.body, function(error, updateCount) {
      if (error && (error instanceof AccessError))
        next(errors.UPDATE_GROUP_FORBIDDEN);
      else if (error) {
        process.logger.error((error && error.message) || 'Fail updating',
          {method: 'updateEntityAction', entity: entityId});
        next(errors.UPDATE_GROUP_ERROR);
      } else {

        // Permits to keep all users up to date
        ManageServer.get().updateGroup(entityId, data);

        response.send({error: null, status: 'ok'});
      }
    });
  } else {

    // Missing id of the group or the datas
    next(errors.UPDATE_GROUP_MISSING_PARAMETERS);

  }
};

/**
 * Removes a group.
 *
 * Parameters :
 *  - **id** The id of the group to remove
 *
 * @method removeEntityAction
 */
GroupController.prototype.removeEntityAction = function(request, response, next) {
  if (request.params.id) {
    var entityId = request.params.id,
      server = ManageServer.get(),
      group = server.getManageable(entityId);

    if (!group)
      return next(errors.REMOVE_GROUP_NOT_FOUND_ERROR);

    server.removeGroup(group.id, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, method: 'removeEntityAction'});
        next(errors.REMOVE_GROUP_ERROR);
      }

      response.send({error: null, status: 'ok'});
    });
  } else {

    // Missing id of the group
    next(errors.REMOVE_GROUP_MISSING_PARAMETERS);
  }
};
