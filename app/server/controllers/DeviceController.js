'use strict';

var path = require('path');
var util = require('util');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;
var errors = process.requireManage('app/server/httpErrors.js');

/**
 * Creates a DeviceController
 *
 * @class DeviceController
 * @constructor
 * @extends EntityController
 */
function DeviceController() {
  EntityController.call(this, DeviceModel);
}

module.exports = DeviceController;
util.inherits(DeviceController, EntityController);

/**
 * Gets a list of devices.
 *
 * @method getEntitiesAction
 */
DeviceController.prototype.getEntitiesAction = function(request, response, next) {
  var model = new this.Entity(request.user),
    connectedDevices = SocketProviderManager.getDevicesFromSocketManagerByNamespace(namespace),
    deviceIds = [];

  connectedDevices.map(function(device) {
    deviceIds.push(device.id);
  });

  model.get({id: {$nin: deviceIds}}, function(error, entities) {
    if (error) {
      process.logger.error(error.message, {error: error, method: 'getEntitiesAction'});
      next(errors.GET_DEVICES_ERROR);
    } else {
      response.send({
        entities: connectedDevices.concat(entities)
      });
    }
  });
};
