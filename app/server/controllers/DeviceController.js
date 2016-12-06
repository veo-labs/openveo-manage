'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var ManageServer = process.requireManage('app/server/services/ManageServer.js');
var errors = process.requireManage('app/server/errors.js');
var AccessError = openVeoAPI.errors.AccessError;

/**
 * Creates a DeviceController to handle actions on devices entities.
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
 * Gets the list of devices.
 *
 * @example
 *     {
 *       "entities" : [ ... ]
 *     }
 *
 * @method getEntitiesAction
 */
DeviceController.prototype.getEntitiesAction = function(request, response, next) {
  response.send({
    entities: ManageServer.get().getDevices()
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
      data = null;

    try {
      data = openVeoAPI.util.shallowValidateObject(request.body, {
        name: {type: 'string'},
        state: {type: 'array<string>'},
        history: {type: 'array<object>'},
        schedules: {type: 'array<object>'}
      });
    } catch (error) {
      return next(errors.UPDATE_DEVICE_WRONG_PARAMETERS);
    }

    model.update(entityId, data, function(error, updateCount) {
      if (error && (error instanceof AccessError))
        next(errors.UPDATE_DEVICE_FORBIDDEN);
      else if (error) {
        process.logger.error((error && error.message) || 'Fail updating', {
          method: 'updateEntityAction', entity: entityId
        });
        next(errors.UPDATE_DEVICE_ERROR);
      } else {

        // Update cached device
        ManageServer.get().update(entityId, data);
        response.send({error: null, status: 'ok'});

      }
    });
  } else {

    // Missing id of the device or the data
    next(errors.UPDATE_DEVICE_MISSING_PARAMETERS);
  }
};

/**
 * Removes a device.
 *
 * Parameters :
 *  - **id** The id of the device to remove
 *
 * @method removeEntityAction
 */
DeviceController.prototype.removeEntityAction = function(request, response, next) {
  if (request.params.id) {
    var entityId = request.params.id,
      server = ManageServer.get(),
      device = server.getManageable(entityId);

    if (!device)
      return next(errors.REMOVE_DEVICE_NOT_FOUND_ERROR);

    server.removeDevice(device.id, function(error) {
      if (error) {
        process.logger.error(error.message, {error: error, method: 'removeEntityAction'});
        next(errors.REMOVE_DEVICE_ERROR);
      }

      response.send({error: null, status: 'ok'});
    });

  } else {

    // Missing id of the device or the data
    next(errors.REMOVE_DEVICE_MISSING_PARAMETERS);

  }
};
