'use strict';

var schedule = require('node-schedule');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var errors = process.requireManage('app/server/httpErrors.js');
var AccessError = openVeoAPI.errors.AccessError;

/**
 * Manage the scheduled jobs
 *
 * @class ScheduleManager
 * @constructor
 */
function ScheduleManager() {
}

module.exports = ScheduleManager;

/**
 * Remove the stored start and end jobs with their name
 *
 * @private
 * @method removeJob
 * @param {String} name The name of the searched jobs
 */
function removeJob(name) {
  var startJob = schedule.scheduledJobs['start_' + name],
    endJob = schedule.scheduledJobs['end_' + name];

  startJob.cancel();
  endJob.cancel();
}

/**
 *
 * @param data
 * @param params
 * @param entityId
 * @param socketProvider
 * @param callback
 */
ScheduleManager.prototype.createJob = function(schedules, params, entityId, socketProvider, callback) {
  if (params.beginDate && params.endDate && params.deviceIds) {
    var startTime = params.beginDate,
      endTime = params.endDate,
      deviceModel = new DeviceModel(),
      sockets = [],
      scheduleIndex;

    // Retrieve sockets from device ids
    params.deviceIds.map(function(id) {
      sockets.push(socketProvider.getSocket(id));
    });

    // Create the start job to launch a record
    schedule.scheduleJob('start_' + params.scheduleId, startTime, function() {
      socketProvider.deviceListener.startRecord(sockets, params, function(error) {
        if (error) {
          process.logger.error(error, {error: error, method: 'createJob:startJob'});
        }
      });
    });

    // Create the end job to stop a record
    schedule.scheduleJob('end_' + params.scheduleId, endTime, function() {

      socketProvider.deviceListener.stopRecord(sockets, function(error) {
        if (error) {
          process.logger.error(error, {error: error, method: 'createJob:endJob'});
        } else {

          // Suppression du job pour le device
          scheduleIndex = schedules.findIndex(function(value) {
            return value.id == params.scheduleId;
          });
          schedules.splice(scheduleIndex, 1);

          deviceModel.update(entityId, {schedules: schedules}, function(error, updateCount) {
            if (error && (error instanceof AccessError))
              callback(errors.UPDATE_DEVICE_FORBIDDEN);
            else if (error) {
              process.logger.error((error && error.message) || 'Fail updating',
                {method: 'updateEntityAction', entity: entityId});
              callback(errors.UPDATE_DEVICE_ERROR);
            } else {
              removeJob(params.scheduleId);
            }
          });
        }
      });
    });

    callback();
  } else {

    // Missing params for the schedule
    callback(errors.ADD_SCHEDULE_MISSING_PARAMETERS);
  }
};

/*
ScheduleManager.prototype.createRecurrentJob = function() {

};

ScheduleManager.prototype.loadJobs = function() {

};*/
