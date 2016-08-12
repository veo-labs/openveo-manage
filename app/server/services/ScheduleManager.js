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
      if (startJob)
        startJob.cancel();

      if (endJob)
        endJob.cancel();

      if (entityType === 'devices')
        socketProvider.updateDevice(entityId, {schedules: schedules});

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
    startSchedule,
    endSchedule,
    now = new Date();

  // Create the new schedules object to save
  if (device.schedules) {
    device.schedules.map(function(data, index) {
      if (new Date(data.beginDate).getTime() < now.getTime()) {
        startSchedule = schedule.scheduledJobs['start_' + data.scheduleId];
        endSchedule = schedule.scheduledJobs['end_' + data.scheduleId];
        if (startSchedule)
          startSchedule.cancel();
        if (endSchedule)
          endSchedule.cancel();
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

/**
 * Permits to manage (create or remove) the scheduled jobs depending of the user interactions with the devices
 *
 * @param {String | null} deviceId The id of the device to update, null otherwise
 * @param {String | null} groupId The id of the group to update, null otherwise
 * @param {String} action The type of action realised by the user
 * @param {Object} socketProvider
 * @param {Function} [callback] The function to call when it's done
 */
ScheduleManager.prototype.toggleDeviceJobs = function(deviceId, groupId, action, socketProvider, callback) {
  var groupModel = new GroupModel(),
    deviceModel = new DeviceModel(),
    self = this,
    deviceIds = [];

  switch (action) {
    case 'addDeviceToGroup':
      groupModel.getOne(groupId, null, function(error, group) {
        group.devices.map(function(device) {
          deviceIds.push(device.id);

          // Disable device scheduled jobs
          if (device.id === deviceId && device.schedules) {
            device.schedules.map(function(data) {
              schedule.scheduledJobs['start_' + data.scheduleId].cancel();
              schedule.scheduledJobs['end_' + data.scheduleId].cancel();
            });
          }
        });

        // Recreate group scheduled jobs with the new device
        if (group.schedules) {
          clearOldJobs(group, 'groups', function(error, schedules) {
            if (!error)
              schedules.map(function(data) {
                self.createJob(socketProvider, schedules, {
                  scheduleId: data.scheduleId,
                  entityId: group.id,
                  entityType: 'groups',
                  beginDate: data.beginDate,
                  endDate: data.endDate,
                  deviceIds: deviceIds
                }, function() {
                  // Log
                });
              });
          });
        }
      });
      break;

    case 'removeDevice':
    case 'createGroup':
      deviceModel.getOne(deviceId, null, function(error, device) {

        // Disable device scheduled jobs
        if (device.schedules) {
          device.schedules.map(function(data) {
            schedule.scheduledJobs['start_' + data.scheduleId].cancel();
            schedule.scheduledJobs['end_' + data.scheduleId].cancel();
          });
        }
      });
      break;

    case 'removeDeviceFromGroup':

      // Manage group scheduled jobs
      groupModel.getOne(groupId, null, function(error, group) {
        group.devices.map(function(device) {
          deviceIds.push(device.id);
        });

        // Recreate group scheduled jobs without the old device
        if (group.schedules) {
          clearOldJobs(group, 'groups', function(error, schedules) {
            if (!error)
              schedules.map(function(data) {
                self.createJob(socketProvider, schedules, {
                  scheduleId: data.scheduleId,
                  entityId: group.id,
                  entityType: 'groups',
                  beginDate: data.beginDate,
                  endDate: data.endDate,
                  deviceIds: deviceIds
                }, function() {
                  // Log
                });
              });
          });
        }
      });

      // Manage device scheduled jobs
      deviceModel.getOne(deviceId, null, function(error, device) {
        if (device.schedules) {
          clearOldJobs(device, 'devices', function(error, schedules) {
            if (!error)
              schedules.map(function(data) {
                self.createJob(socketProvider, schedules, {
                  scheduleId: data.scheduleId,
                  entityId: device.id,
                  entityType: 'groups',
                  beginDate: data.beginDate,
                  endDate: data.endDate,
                  deviceIds: [device.id]
                }, function() {
                  // Log
                });
              });
          });
        }
      });
      break;

    case 'removeGroup':
      groupModel.getOne(groupId, null, function(error, group) {

        // Remove the group scheduled jobs
        if (group.schedules) {
          group.schedules.map(function(data) {
            schedule.scheduledJobs['start_' + data.scheduleId].cancel();
            schedule.scheduledJobs['end_' + data.scheduleId].cancel();
          });
        }

        // Recreate the jobs for the devices
        group.devices.map(function(device) {
          if (device.schedules) {
            clearOldJobs(device, 'devices', function(error, schedules) {
              if (!error)
                schedules.map(function(data) {
                  self.createJob(socketProvider, schedules, {
                    scheduleId: data.scheduleId,
                    entityId: group.id,
                    entityType: 'groups',
                    beginDate: data.beginDate,
                    endDate: data.endDate,
                    deviceIds: [device.id]
                  }, function() {
                    // Log
                  });
                });
            });
          }
        });
      });
      break;
    default:
      break;
  }

  callback();
};

/*
ScheduleManager.prototype.createRecurrentJob = function() {

};*/
