'use strict';

var schedule = require('node-schedule');
var path = require('path');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;
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
 * Remove the stored start and end jobs with their name and update the device
 *
 * @private
 * @method removeJob
 * @param {String} name The name of the searched jobs
 * @param {Array} schedules The schedules to keep the device up to date
 * @param {String} entityId The id of the device or group of devices to update
 * @param {Object} socketProvider
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 */
function removeJob(name, schedules, entityId, socketProvider, callback) {
  var deviceModel = new DeviceModel(),
    startJob = schedule.scheduledJobs['start_' + name],
    endJob = schedule.scheduledJobs['end_' + name],
    scheduleIndex;

  // Create the new schedules object to save
  scheduleIndex = schedules.findIndex(function(value) {
    return value.id == name;
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
      startJob.cancel();
      endJob.cancel();
      socketProvider.updateDevice(entityId, {schedules: schedules});
      callback();
    }
  });
}

/**
 * Create a new start and end job for a specified schedule
 *
 * @method createJob
 * @param {Array} schedules The schedules to keep the device up to date
 * @param {Object} params All parameters needed to create the new job
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 */
ScheduleManager.prototype.createJob = function(schedules, params, callback) {

  var startTime = params.beginDate,
    endTime = params.endDate,
    socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace),
    sockets = [];

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

        // Remove the scheduled job when it's done
        removeJob(params.scheduleId, schedules, params.entityId, socketProvider, function(error) {
          if (error) {
            process.logger.error(error, {error: error, method: 'removeJob'});
          }
        });
      }
    });
  });

  callback();
};

/*
ScheduleManager.prototype.createRecurrentJob = function() {

};*/

/**
 * Call on plugin start to remove the old jobs and recreate the next jobs
 *
 * @method manageJobs
 */
/* ScheduleManager.prototype.manageJobs = function() {
  var deviceModel = new DeviceModel();
};*/
