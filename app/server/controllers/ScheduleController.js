'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var schedule = require('node-schedule');
var async = require('async');
var path = require('path');
var ScheduleModel = process.requireManage('app/server/models/ScheduleModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;
var errors = process.requireManage('app/server/httpErrors.js');
var AccessError = openVeoAPI.errors.AccessError;

/**
 * Creates a ScheduleController
 *
 * @class ScheduleController
 * @constructor
 * @extends EntityController
 */
function ScheduleController() {
  EntityController.call(this, ScheduleModel);
}

module.exports = ScheduleController;
util.inherits(ScheduleController, EntityController);

/**
 * Create a new schedule with a start and an end time
 *
 * Expects one GET parameter :
 *  - **beginDate** The begin date to start the schedule
 *  - **endDate** The end date to stop the schedule
 *  - **ids** The ids of the devices to start recording simultaneously
 *
 *  Also expects data in body.
 *
 * @method addEntityAction
 */
ScheduleController.prototype.addEntityAction = function(request, response, next) {
  if (request.params.beginDate && request.params.endDate && request.params.ids && request.body) {
    var model = new this.Entity(request.user),
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace),
      startTime = request.params.beginDate,
      endTime = request.params.endDate,
      sockets = [],
      actions = [];

    model.add(request.body, function(error, insertCount, entity) {
      if (error) {
        process.logger.error(error.message, {error: error, method: 'addEntityAction'});
        next((error instanceof AccessError) ? errors.ADD_ENTITY_FORBIDDEN : errors.ADD_ENTITY_ERROR);
      } else {

        // Retrieve sockets from device ids
        request.params.ids.map(function(id) {
          sockets.push(socketProvider.findSocket(id));
        });

        // Create the start job to launch a record
        var startJob = schedule.scheduleJob(startTime, function() {
          sockets.map(function(socket) {
            actions.push(socketProvider.deviceListerner.startRecord(socket)); // TODO: add param
          });
          async.parallel(actions, function(error) {
            if (error) {
              process.logger.error(error, {error: error, method: 'addScheduleAction:startJob'});
              next(errors.START_SCHEDULE_JOB);
            } else {
              response.status(200).send();
            }
          });

          // TODO: update state recording
        });

        // Create the end job to stop a record
        var endJob = schedule.scheduleJob(endTime, function() {
          sockets.map(function(socket) {
            actions.push(socketProvider.deviceListerner.stopRecord(socket));
          });
          async.parallel(actions, function(error) {
            if (error) {
              process.logger.error(error, {error: error, method: 'addScheduleAction:endJob'});
              next(errors.END_SCHEDULE_JOB);
            } else {
              response.status(200).send();
            }
          });

          // TODO: update state end recording
        });

        response.send({
          entity: entity
        });
      }
    });

  } else {

    // Missing params for the schedule
    next(errors.ADD_SCHEDULE_MISSING_PARAMETERS);
  }
};
