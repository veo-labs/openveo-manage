'use strict';

// Module dependencies
var util = require('util');
var shortid = require('shortid');
var async = require('async');
var openVeoAPI = require('@openveo/api');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');

/**
 * Creates a GroupModel.
 */
function GroupModel() {
  openVeoAPI.EntityModel.call(this, new GroupProvider(openVeoAPI.applicationStorage.getDatabase()));

  /**
   * Device provider.
   *
   * @property deviceProvider
   * @type DeviceProvider
   */
  this.deviceProvider = new DeviceProvider(openVeoAPI.applicationStorage.getDatabase());
}

module.exports = GroupModel;
util.inherits(GroupModel, openVeoAPI.EntityModel);

/**
 * Adds a new group of devices to the manage groups' collection.
 *
 * @example
 *     var GroupModel = new process.require("app/server/models/GroupModel.js");
 *     var group = new GroupModel();
 *     group.add({
 *       id : "Group id",
 *       name : "Name of the group devices"
 *     }, callback);
 *
 * @method add
 * @async
 * @param {Object} data A group object
 * @param {Function} [callback] The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Number** The total amount of items inserted
 *   - **Object** The inserted group
 */
GroupModel.prototype.add = function(data, callback) {

  var group = {
    id: data.id || shortid.generate(),
    name: data.name || 'Groupe',
    schedules: [],
    history: [
      {
        id: shortid.generate(),
        date: new Date(),
        message: {
          data: 'MANAGE.HISTORY.CREATE_GROUP',
          groupName: null
        }
      }
    ]
  };

  this.provider.add(group, function(error, addedCount, groups) {
    if (callback)
      callback(error, addedCount, groups && groups[0]);
  });
};

/**
 * Gets the list of groups with devices details.
 *
 * @method get
 * @async
 * @param {Object} filter A MongoDB filter
 * @param {Function} callback The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Array** The list of groups
 */
GroupModel.prototype.get = function(filter, callback) {
  var self = this,
    groups = [],
    devices = [];

  async.parallel([

    // Get the list of groups
    function(callback) {
      self.provider.get(filter, function(error, groupList) {
        groups = groupList;
        callback(error);
      });
    },

    // Get the list of devices
    function(callback) {
      self.deviceProvider.get(null, function(error, deviceList) {
        devices = deviceList;
        callback(error);
      });
    }

  ], function(error) {
    if (error) {
      callback(error);
    } else {
      if (groups && devices) {

        // Devices
        for (var i in devices) {
          var groupId = devices[i].group;

          // Groups
          for (var j in groups) {
            if (groups[j].id === groupId) {

              if (!groups[j].devices) {
                groups[j].devices = [];
              }

              groups[j].devices.push(devices[i]);
              break;
            }
          }
        }
      }

      callback(null, groups);
    }
  });
};

/**
 * Gets a specific group with devices details.
 *
 * @method getOne
 * @async
 * @parma {String} The searched group id
 * @param {Object} filter A MongoDB filter
 * @param {Function} callback The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Object** The group with its devices
 */
GroupModel.prototype.getOne = function(id, filter, callback) {
  var self = this,
    group,
    devices = [];

  async.parallel([

    // Get the list of groups
    function(callback) {
      self.provider.getOne(id, filter, function(error, searchedGroup) {
        group = searchedGroup || {};
        callback(error);
      });
    },

    // Get the list of devices
    function(callback) {
      self.deviceProvider.get({group: {$eq: id}}, function(error, deviceList) {
        devices = deviceList;
        callback(error);
      });
    }

  ], function(error) {
    if (error) {
      callback(error);
    } else {
      if (group)
        group.devices = devices;

      callback(null, group);
    }
  });
};
