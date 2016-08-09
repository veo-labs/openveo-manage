'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var errors = process.requireManage('app/server/httpErrors.js');
var ScheduleManager = process.requireManage('app/server/services/ScheduleManager.js');
var Controller = openVeoAPI.controllers.Controller;

/**
 * Creates a ScheduleController
 *
 * @class ScheduleController
 * @constructor
 * @extends Controller
 */
function ScheduleController() {
  Controller.call(this);
}

module.exports = ScheduleController;
util.inherits(ScheduleController, Controller);

/**
 * Create the new job for a device or a group of device
 *
 * @method addScheduledJobAction
 *
 * Also expects data in body.
 */
ScheduleController.prototype.addScheduledJobAction = function(request, response, next) {
  var schedules = request.body.schedules,
    params = request.body.params,
    scheduleManager = new ScheduleManager();

  if (params.beginDate && params.endDate && params.deviceIds) {
    scheduleManager.createJob(schedules, params, function(error) {
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
