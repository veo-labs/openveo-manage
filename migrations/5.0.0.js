'use strict';

var async = require('async');
var openVeoApi = require('@openveo/api');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var ResourceFilter = openVeoApi.storages.ResourceFilter;

module.exports.update = function(callback) {
  process.logger.info('Manage 5.0.0 migration launched.');
  var groupProvider = new GroupProvider(process.api.getCoreApi().getDatabase());
  var deviceProvider = new DeviceProvider(process.api.getCoreApi().getDatabase());

  async.series([

    /**
     * Changes manageable schedules "recurrent" property value to string instead of boolean.
     *
     * Schedules can now be either "daily" or "weekly" but true isn't a valid recurrent value anymore.
     * Update documents property "recurrent" with value "daily" when true.
     */
    function(callback) {
      async.parallel([

        function(callback) {
          groupProvider.getAll(null, {include: ['id', 'schedules']}, {id: 'desc'}, function(error, groups) {
            if (error) return callback(error);
            callback(null, groups);
          });
        },

        function(callback) {
          deviceProvider.getAll(null, {include: ['id', 'schedules']}, {id: 'desc'}, function(error, devices) {
            if (error) return callback(error);
            callback(null, devices);
          });
        }

      ], function(error, result) {
        if (error) return callback(error);
        var groups = result[0];
        var devices = result[1];
        var asyncActions = [];

        ['devices', 'groups'].forEach(function(type) {
          var provider = type === 'devices' ? deviceProvider : groupProvider;
          var manageables = type === 'devices' ? devices : groups;

          if (!manageables || !manageables.length) return;

          manageables.forEach(function(manageable) {
            if (!manageable.schedules || !manageable.schedules.length) return;
            var isUpdateNeeded = false;

            manageable.schedules.forEach(function(schedule) {
              if (schedule.recurrent) {
                schedule.recurrent = 'daily';
                isUpdateNeeded = true;
              }
            });

            if (isUpdateNeeded) {
              asyncActions.push(function(callback) {
                provider.updateOne(
                  new ResourceFilter().equal('id', manageable.id),
                  {
                    schedules: manageable.schedules
                  },
                  callback
                );
              });
            }
          });
        });

        async.parallel(asyncActions, callback);
      });
    }

  ], function(error, results) {
    if (error) return callback(error);
    process.logger.info('Manage 5.0.0 migration done.');
    callback();
  });
};
