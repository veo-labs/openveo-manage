'use strict';

(function(app) {

  /**
   * Defines a factory to manage communications with the server.
   *
   * @module ov.manage
   * @class ManageFactory
   */
  function ManageFactory($http, $q, entityService, SocketService, MANAGE_NAME) {
    var configuration = null, basePath = '/be/manage/';

    /**
     * Gets Manage plugin configuration.
     *
     * @method getConfiguration
     * @return {Promise} A promise resolving with manage's configuration
     */
    function getConfiguration() {
      var p = $q.defer();

      if (!configuration)
        $http.get(basePath + 'configuration/').then(function(response) {
          p.resolve(response.data);
        }).catch(function(error) {
          p.reject(error);
        });
      else
        p.resolve(configuration);

      return p.promise;
    }

    /**
     * Gets all groups devices from server.
     *
     * @method getGroups
     * @return {Promise} A promise resolving with the list of groups
     */
    function getGroups() {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.emit('groups', null, function(response) {
          if (response.error)
            p.reject(response.error.message);
          else
            p.resolve(response.data);
        });
      });

      return p.promise;
    }

    /**
     * Gets all devices from server.
     *
     * @method getDevices
     * @return {Promise} A promise resolving with the list of devices categorized
     * by state (either "pending", "accepted" or "refused")
     */
    function getDevices() {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.emit('devices', null, function(response) {
          if (response.error)
            p.reject(response.error.message);
          else
            p.resolve(response.data);
        });
      });

      return p.promise;
    }

    /**
     * Creates a new group.
     *
     * @method createGroup
     * @return {Promise} Promise resolving with the new created group
     */
    function createGroup() {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('group.create', null, function(response) {
          if (response.error)
            p.reject(response.error);
          else
            p.resolve(response.group);
        });
      });


      return p.promise;
    }

    /**
     * Adds a device to a group.
     *
     * @method addDeviceToGroup
     * @param {String} deviceId The id of the device to add to the group
     * @param {String} groupId The id of group
     * @return {Promise} Promise resolving when device has been added
     */
    function addDeviceToGroup(deviceId, groupId) {
      var p = $q.defer();
      var data = {
        deviceId: deviceId,
        groupId: groupId
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('group.addDevice', data, function(response) {
          if (response && response.error)
            p.reject(response.error);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Removes a device from its group.
     *
     * @method removeDeviceFromGroup
     * @param {String} id The id of the device to remove from its group
     * @return {Promise} Promise resolving when device has been removed from its group
     */
    function removeDeviceFromGroup(id) {
      var p = $q.defer();
      var data = {
        id: id
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('group.removeDevice', data, function(response) {
          if (response && response.error)
            p.reject(response.error);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Updates the state of a device.
     *
     * @method updateDeviceState
     * @param {String} id The device id
     * @param {String} state The new device state
     * @return {Promise} Promise resolving when state has been changed
     */
    function updateDeviceState(id, state) {
      var p = $q.defer();
      var data = {
        id: id,
        state: state
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('device.updateState', data, function(response) {
          if (response && response.error)
            p.reject(response.error);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Asks server for devices' settings.
     *
     * @method askForDevicesSettings
     * @param {Array} ids The devices' ids
     * @return {Promise} Promise resolving when request to devices have been sent
     */
    function askForDevicesSettings(ids) {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('device.settings', {
          ids: ids
        }, function(response) {
          if (response && response.error)
            p.reject(response.error);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Updates a manageable's name.
     *
     * @method updateName
     * @param {String} id The manageable id
     * @param {String} name The manageable name
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when name has been updated
     */
    function updateName(id, name, type) {
      var p = $q.defer();
      var data = {
        id: id,
        name: name,
        type: type
      };

      var handleResponse = function(response) {
        if (response && response.error)
          p.reject(response.error);
        else if (response && response.id === data.id)
          p.resolve();
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.once('update', handleResponse);
        socket.emit('updateName', data, handleResponse);
      });

      return p.promise;
    }

    /**
     * Adds a manageable's schedule.
     *
     * @method addSchedule
     * @param {String} id The manageable id
     * @param {Object} schedule The schedule to add
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when schedule has been added
     */
    function addSchedule(id, schedule, type) {
      var p = $q.defer();
      var data = {
        id: id,
        schedule: schedule,
        type: type
      };

      var handleResponse = function(response) {
        if (response && response.error)
          p.reject(response.error);
        else if (response && response.id === data.id)
          p.resolve();
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.once('addSchedule', handleResponse);
        socket.emit('addSchedule', data, handleResponse);
      });

      return p.promise;
    }

    /**
     * Removes a manageable's schedule.
     *
     * @method removeSchedule
     * @param {String} id The manageable id
     * @param {String} scheduleId The schedule id
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when schedule has been removed
     */
    function removeSchedule(id, scheduleId, type) {
      var p = $q.defer();
      var data = {
        id: id,
        scheduleId: scheduleId,
        type: type
      };

      var handleResponse = function(response) {
        if (response && response.error)
          p.reject(response.error);
        else if (response && response.id === data.id)
          p.resolve();
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.once('removeSchedule', handleResponse);
        socket.emit('removeSchedule', data, handleResponse);
      });

      return p.promise;
    }

    /**
     * Removes a manageable's historic.
     *
     * @method removeHistoric
     * @param {String} id The manageable id
     * @param {String} historicId The historic id
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when historic has been removed
     */
    function removeHistoric(id, historicId, type) {
      var p = $q.defer();
      var data = {
        id: id,
        historicId: historicId,
        type: type
      };

      var handleResponse = function(response) {
        if (response && response.error)
          p.reject(response.error);
        else if (response && response.id === data.id)
          p.resolve();
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.once('removeHistoric', handleResponse);
        socket.emit('removeHistoric', data, handleResponse);
      });

      return p.promise;
    }

    /**
     * Removes the whole manageable's history.
     *
     * @method removeHistory
     * @param {String} id The manageable id
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when history has been removed
     */
    function removeHistory(id, type) {
      var p = $q.defer();
      var data = {
        id: id,
        type: type
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);
        socket.emit('removeHistory', data, function(response) {
          if (response && response.error)
            p.reject(response.error);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Starts a new record session on devices.
     *
     * @method startRecord
     * @param {Array} ids The list of devices' ids
     * @param {String} presetId The record session preset id
     * @return {Promise} Promise resolving when a start request has been sent to devices
     */
    function startRecord(ids, presetId) {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('device.startSession', {
          ids: ids,
          presetId: presetId
        }, function(response) {
          if (response && response.errors)
            p.reject(response.errors);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Stops a recording session on devices.
     *
     * @method stopRecord
     * @param {Array} ids The list of devices' ids
     * @return {Promise} Promise resolving when a stop request has been sent to devices
     */
    function stopRecord(ids) {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('device.stopSession', {
          ids: ids
        }, function(response) {
          if (response && response.errors)
            p.reject(response.errors);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Tags a recording session on devices.
     *
     * @method tagRecord
     * @param {Array} ids The list of devices' ids
     * @return {Promise} Promise resolving when a tag request has been sent to devices
     */
    function tagRecord(ids) {
      var p = $q.defer();

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('device.indexSession', {
          ids: ids
        }, function(response) {
          if (response && response.errors)
            p.reject(response.errors);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    /**
     * Removes a manageable.
     *
     * @method remove
     * @param {String} id The manageable id
     * @param {String} type The manageable type
     * @return {Promise} Promise resolving when the manageable has been removed
     */
    function remove(id, type) {
      var p = $q.defer();
      var data = {
        id: id,
        type: type
      };

      getConfiguration().then(function(configuration) {
        var socket = SocketService.initSocket(configuration.browsersNamespace, configuration.frontalPort);

        socket.emit('remove', data, function(response) {
          if (response && response.errors)
            p.reject(response.errors);
          else
            p.resolve();
        });
      });

      return p.promise;
    }

    return {
      getGroups: getGroups,
      getDevices: getDevices,
      getConfiguration: getConfiguration,
      createGroup: createGroup,
      addDeviceToGroup: addDeviceToGroup,
      removeDeviceFromGroup: removeDeviceFromGroup,
      updateDeviceState: updateDeviceState,
      askForDevicesSettings: askForDevicesSettings,
      updateName: updateName,
      addSchedule: addSchedule,
      removeSchedule: removeSchedule,
      removeHistoric: removeHistoric,
      removeHistory: removeHistory,
      startRecord: startRecord,
      stopRecord: stopRecord,
      tagRecord: tagRecord,
      remove: remove
    };

  }

  app.factory('ManageFactory', ManageFactory);
  ManageFactory.$inject = [
    '$http',
    '$q',
    'entityService',
    'ManageSocketService',
    'MANAGE_NAME'
  ];

})(angular.module('ov.manage'));
