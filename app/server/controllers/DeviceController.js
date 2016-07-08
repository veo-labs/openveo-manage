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
var AccessError = openVeoAPI.errors.AccessError;

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
    socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace),
    connectedDevices = socketProvider.getDevices(),
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
        entities: openVeoAPI.util.joinArray(connectedDevices, entities)
      });
    }
  });
};

/**
 * Updates a device.
 *
 * Parameters :
 *  - **id** The id of the device to update
 *
 * Also expects data in body.
 *
 * @method updateEntityAction
 */
DeviceController.prototype.updateEntityAction = function(request, response, next) {
  if (request.params.id && request.body) {
    var model = new this.Entity(request.user),
      entityId = request.params.id,
      params,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

    try {
      params = openVeoAPI.util.shallowValidateObject(request.body, {
        name: {type: 'string'},
        state: {type: 'string'}
      });
    } catch (error) {
      return next(errors.UPDATE_DEVICE_WRONG_PARAMETERS);
    }
    if (DeviceModel.availableStates.indexOf(request.body.state) < 0) {
      return next(new Error('Invalid device state ' + request.body.state));
    }

    model.update(entityId, params, function(error, updateCount) {
      if (error && (error instanceof AccessError))
        next(errors.UPDATE_DEVICE_FORBIDDEN);
      else if (error) {
        process.logger.error((error && error.message) || 'Fail updating',
          {method: 'updateEntityAction', entity: entityId});
        next(errors.UPDATE_DEVICE_ERROR);
      } else {

        // Update cached device
        socketProvider.updateDevice(entityId, params);

        response.send({error: null, status: 'ok'});
      }
    });
  } else {

    // Missing id of the device or the datas
    next(errors.UPDATE_DEVICE_MISSING_PARAMETERS);

  }
};
