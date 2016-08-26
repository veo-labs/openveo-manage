'use strict';

var util = require('util');
var path = require('path');
var openVeoAPI = require('@openveo/api');
var errors = process.requireManage('app/server/httpErrors.js');
var ScheduleManager = process.requireManage('app/server/services/ScheduleManager.js');
var Controller = openVeoAPI.controllers.Controller;
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;

/**
 * Creates a ScheduleController
 *
 * @class ScheduleController
 * @constructor
 * @extends Controller
 */
function ScheduleController() {
  Controller.call(this);

  /**
   * ScheduleManager.
   *
   * @property scheduleManager
   * @type ScheduleManager
   */
  this.scheduleManager = new ScheduleManager();
}

module.exports = ScheduleController;
util.inherits(ScheduleController, Controller);

/**
 * Create the new job for a device or a group of devices
 *
 * Also expects data in body.
 *
 * @method addScheduledJobAction
 */
ScheduleController.prototype.addScheduledJobAction = function(request, response, next) {
  var schedules = request.body.schedules,
    params = request.body.params,
    socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

  if (params.beginDate && params.endDate && params.deviceIds) {
    this.scheduleManager.createJob(socketProvider, schedules, params, function(error) {
      if (error) {
        next(error);
      } else {
        response.send({error: null, status: 'ok'});
      }
    });
  } else {

    // Missing schedule parameters
    next(errors.ADD_SCHEDULE_MISSING_PARAMETERS);
  }
};

/**
 * Enable/disable devices' jobs when it added/removed to a group
 *
 * Also expects data in body.
 *
 * @method toggleScheduledJobsAction
 */
ScheduleController.prototype.toggleScheduledJobsAction = function(request, response, next) {
  if (request.body.action) {
    var deviceId = request.body.deviceId,
      groupId = request.body.groupId,
      action = request.body.action,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

    this.scheduleManager.toggleJobs(deviceId, groupId, action, socketProvider, function() {
      response.send({error: null, status: 'ok'});
    });
  } else {

    // Missing device id parameters
    next(errors.UPDATE_SCHEDULE_MISSING_PARAMETERS);
  }
};

/**
 * Remove a job for a device or a group of devices
 *
 * Parameters :
 *  - **id** The id of the device or group to update
 *
 * Also expects data in body.
 *
 * @method removeScheduledJobAction
 */
ScheduleController.prototype.removeScheduledJobAction = function(request, response, next) {
  if (request.body) {
    var params = request.body.params,
      schedules = request.body.schedules,
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace);

    this.scheduleManager.removeJob(params, schedules, socketProvider, function() {
      response.send({error: null, status: 'ok'});
    });
  } else {

    // Missing device id parameters
    next(errors.REMOVE_SCHEDULE_MISSING_PARAMETERS);
  }
};
