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
    devices = socketProvider.getDevices(),
    deviceIds = [],
    orderedDevices = {
      acceptedDevices: [],
      pendingDevices: [],
      refusedDevices: []
    };

  // Avoid to retrieve in database all connected devices already in cache
  devices.map(function(device) {
    deviceIds.push(device.id);
  });

  model.get({id: {$nin: deviceIds}}, function(error, entities) {
    if (error) {
      process.logger.error(error.message, {error: error, method: 'getEntitiesAction'});
      next(errors.GET_DEVICES_ERROR);
    } else {

      // Ordered devices by state
      openVeoAPI.util.joinArray(devices, entities).map(function(device) {
        switch (device.state) {
          case DeviceModel.STATE_ACCEPTED:
            orderedDevices.acceptedDevices.push(device);
            break;
          case DeviceModel.STATE_PENDING:
            orderedDevices.pendingDevices.push(device);
            break;
          case DeviceModel.STATE_REFUSED:
            orderedDevices.refusedDevices.push(device);
            break;
          default:
            break;
        }
      });

      response.send({
        entities: orderedDevices
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
      params = request.body,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

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
    var model = new this.Entity(request.user),
      entityId = request.params.id,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

    model.remove(entityId, function(error, deleteCount) {
      if (error) {
        process.logger.error(error.message, {error: error, method: 'removeEntityAction'});
        next(errors.REMOVE_ENTITY_ERROR);
      } else {

        // Update cached device
        socketProvider.removeDeviceById(entityId);
        response.send({error: null, status: 'ok'});
      }
    });
  } else {

    // Missing id of the device or the datas
    next(errors.REMOVE_DEVICE_MISSING_PARAMETERS);
  }
};


/**
 * Create a new cron schedule with a start and a end time
 *
 * Expects one GET parameter :
 *  - **beginDate** The begin date to start the schedule
 *  - **endDate** The end date to stop the schedule
 *  - **deviceIds** The ids of the devices to start recording simultaneously
 *  - **sessionId** The id for to send for all the records if its a group
 *
 * @method addCronScheduleAction
 */
/* ScheduleController.prototype.addCronScheduleAction = function(request, response, next) {
  console.log(request.params);
  if (request.params.beginDate && request.params.endDate && request.params.deviceIds) {
    var socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace),
      startTime = request.params.beginDate,
      endTime = request.params.endDate,
      sockets = [],
      actions = [];

    // Retrieve sockets from device ids
    request.params.deviceIds.map(function(id) {
      sockets.push(socketProvider.findSocket(id));
    });
    console.log('addCron');
    console.log(request.params);
    // Create the start job to launch a record
    var startJob = schedule.scheduleJob(startTime, function() {
      console.log('startJob');
      socketProvider.deviceListener.startRecord(sockets, request.params);
      /*sockets.map(function(socket) {
       actions.push(socketProvider.deviceListener.startRecord(socket, request.params.sessionId));
       });
       async.series(actions, function(error) {
       if (error) {
       process.logger.error(error, {error: error, method: 'addCronScheduleAction:startJob'});
       next(errors.START_SCHEDULE_JOB);
       } else {
       response.status(200).send();
       }
       });*/

      // TODO: update state recording
    // });

    // Create the end job to stop a record
   // var endJob = schedule.scheduleJob(endTime, function() {
   //   socketProvider.deviceListener.stopRecord(sockets);
      /* sockets.map(function(socket) {
       actions.push(socketProvider.deviceListener.stopRecord(socket));
       });
       async.series(actions, function(error) {
       if (error) {
       process.logger.error(error, {error: error, method: 'addCronScheduleAction:endJob'});
       next(errors.END_SCHEDULE_JOB);
       } else {
       response.status(200).send();
       }
       });*/

      // TODO: update state end recording
    /* });

    response.send();
  } else {

    // Missing params for the schedule
    next(errors.ADD_SCHEDULE_MISSING_PARAMETERS);
  }
};*/
