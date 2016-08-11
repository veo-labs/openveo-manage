'use strict';

var schedule = require('node-schedule');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
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
 * @param {String} entityType The type [groups/devices] of the model to update
 * @param {Object} socketProvider
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 */
function removeJob(name, schedules, entityId, entityType, socketProvider, callback) {
  var model = (entityType === 'devices') ? new DeviceModel() : new GroupModel(),
    startJob = schedule.scheduledJobs['start_' + name],
    endJob = schedule.scheduledJobs['end_' + name],
    scheduleIndex;

  // Create the new schedules object to save
  scheduleIndex = schedules.findIndex(function(value) {
    return value.id == name;
  });
  schedules.splice(scheduleIndex, 1);

  model.update(entityId, {schedules: schedules}, function(error, updateCount) {
    if (error && (error instanceof AccessError))
      callback(errors.UPDATE_DEVICE_FORBIDDEN);
    else if (error) {
      process.logger.error((error && error.message) || 'Fail updating',
        {method: 'updateEntityAction', entity: entityId});
      callback(errors.UPDATE_DEVICE_ERROR);
    } else {
      startJob.cancel();
      endJob.cancel();
      if (entityType === 'devices') {
        socketProvider.updateDevice(entityId, {schedules: schedules});
      }
      callback();
    }
  });
}

/**
 * Create a new start and end job for a specified schedule
 *
 * @method createJob
 * @param {Object} socketProvider
 * @param {Array} schedules The schedules to keep the device up to date
 * @param {Object} params All parameters needed to create the new job
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 */
ScheduleManager.prototype.createJob = function(socketProvider, schedules, params, callback) {
  var startTime = params.beginDate,
    endTime = params.endDate,
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
        removeJob(params.scheduleId, schedules, params.entityId, params.entityType, socketProvider, function(error) {
          if (error) {
            process.logger.error(error, {error: error, method: 'removeJob'});
          }
        });
      }
    });
  });

  callback();
};

/**
 * Clear the scheduled jobs for a device witch have a start date < now
 *
 * @method clearOldJobs
 * @param {Object} device The device to update
 * @param {String} entityType The type of entity [devices/groups]
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Schedules** The updated schedules job of the device
 */
function clearOldJobs(device, entityType, callback) {
  var model = (entityType === 'devices') ? new DeviceModel() : new GroupModel(),
    entityId = (entityType === 'devices') ? device.id : device.group,
    schedules = device.schedules,
    now = new Date();

  // Create the new schedules object to save
  if (device.schedules) {
    device.schedules.map(function(schedule, index) {
      if (new Date(schedule.beginDate).getTime() < now.getTime()) {
        schedules.splice(index, 1);
      }
    });
  } else {
    schedules = [];
  }

  model.update(entityId, {schedules: schedules}, function(error, updateCount) {
    if (error && (error instanceof AccessError))
      callback(errors.UPDATE_DEVICE_FORBIDDEN);
    else if (error) {
      process.logger.error((error && error.message) || 'Fail updating',
        {method: 'updateEntityAction', entity: entityId});
      callback(errors.UPDATE_DEVICE_ERROR);
    } else {
      callback(error, schedules);
    }
  });
}

/**
 * Permits to update or create the scheduled jobs for a device on new socket connection
 *
 * @param {Object} device The device to update
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Schedules** The updated schedules job of the device
 */
ScheduleManager.prototype.updateDeviceJobs = function(device, callback) {

  var self = this,
    groupModel,
    deviceIds = [],
    entityType = (device.group) ? 'groups' : 'devices';

  // Verify if job already exist
  clearOldJobs(device, entityType, function(error, schedules) {
    if (!error) {
      // Do not recreate jobs for a device belonging to a group
      if (!device.group) {
        schedules.map(function(schedule) {
          self.scheduleManager.createJob(self, schedules, {
            scheduleId: schedule.scheduleId,
            entityId: device.id,
            entityType: entityType,
            beginDate: schedule.beginDate,
            endDate: schedule.endDate,
            deviceIds: [device.id]
          }, function() {
            // Log
          });
        });
      } else {
        groupModel = new GroupModel();

        groupModel.getOne(device.group, null, function(error, group) {
          if (!error && group.schedules) {
            group.devices.map(function(device) {
              deviceIds.push(device.id);
            });
            group.schedules.map(function(schedule) {
              self.scheduleManager.createJob(self, schedules, {
                scheduleId: schedule.scheduleId,
                entityId: group.id,
                entityType: entityType,
                beginDate: schedule.beginDate,
                endDate: schedule.endDate,
                deviceIds: deviceIds
              }, function() {
                // Log
              });
            });
          } else {
            callback(error);
          }
        });
      }
    } else {
      callback(error);
    }

    callback(error, schedules);
  });
};

/*
ScheduleManager.prototype.createRecurrentJob = function() {

};*/
