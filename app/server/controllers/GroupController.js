'use strict';

var path = require('path');
var util = require('util');
var openVeoAPI = require('@openveo/api');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;
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
 * Removes a group.
 *
 * Parameters :
 *  - **id** The id of the device to remove
 *
 * @method removeEntityAction
 */
GroupController.prototype.removeEntityAction = function(request, response, next) {
  if (request.params.id) {
    var model = new this.Entity(request.user),
      entityId = request.params.id,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

    socketProvider.scheduleManager.toggleJobs(null, entityId, 'removeGroup', socketProvider, function() {
      model.remove(entityId, function(error, deleteCount) {
        if (error) {
          process.logger.error(error.message, {error: error, method: 'removeEntityAction'});
          next(errors.REMOVE_GROUP_ERROR);
        } else {
          response.send({error: null, status: 'ok'});
        }
      });
    });
  } else {

    // Missing id of the group
    next(errors.REMOVE_GROUP_MISSING_PARAMETERS);
  }
};
