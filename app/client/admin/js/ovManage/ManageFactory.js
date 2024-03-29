'use strict';

(function(app) {

  /**
   * Defines a factory to manage communications with the server.
   *
   * @class ManageFactory
   * @memberof module:ov.manage
   * @inner
   */
  function ManageFactory($http, $q, entityService, SocketFactory, MANAGE_NAME) {
    var socketNamespace = '/manage/browser';

    /**
     * Gets all groups from server.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @return {Promise} A promise resolving with the list of groups
     */
    function getGroups() {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('groups', null, function(response) {
        if (response.error)
          p.reject(response.error.message);
        else
          p.resolve(response.data);
      });

      return p.promise;
    }

    /**
     * Gets all devices from server.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @return {Promise} A promise resolving with the list of devices categorized
     * by state (either "pending", "accepted" or "refused")
     */
    function getDevices() {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('devices', null, function(response) {
        if (response.error)
          p.reject(response.error.message);
        else
          p.resolve(response.data);
      });

      return p.promise;
    }

    /**
     * Creates a new group.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @return {Promise} Promise resolving with the new created group
     */
    function createGroup() {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('group.create', null, function(response) {
        if (response.error)
          p.reject(response.error);
        else
          p.resolve(response.group);
      });

      return p.promise;
    }

    /**
     * Adds a device to a group.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('group.addDevice', data, function(response) {
        if (response && response.error)
          p.reject(response.error);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Removes a device from its group.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @param {String} id The id of the device to remove from its group
     * @return {Promise} Promise resolving when device has been removed from its group
     */
    function removeDeviceFromGroup(id) {
      var p = $q.defer();
      var data = {
        id: id
      };
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('group.removeDevice', data, function(response) {
        if (response && response.error)
          p.reject(response.error);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Updates the state of a device.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('device.updateState', data, function(response) {
        if (response && response.error)
          p.reject(response.error);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Asks server for devices' settings.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @param {Array} ids The devices' ids
     * @return {Promise} Promise resolving when request to devices have been sent
     */
    function askForDevicesSettings(ids) {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('device.settings', {
        ids: ids
      }, function(response) {
        if (response && response.error)
          p.reject(response.error);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Updates a manageable's name.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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

      var socket = SocketFactory.initSocket(socketNamespace);
      socket.once('updated', handleResponse);
      socket.emit('updateName', data, handleResponse);

      return p.promise;
    }

    /**
     * Adds a manageable's schedule.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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

      var socket = SocketFactory.initSocket(socketNamespace);
      socket.once('newSchedule', handleResponse);
      socket.emit('addSchedule', data, handleResponse);

      return p.promise;
    }

    /**
     * Removes a manageable's schedule.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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

      var socket = SocketFactory.initSocket(socketNamespace);
      socket.once('removedSchedule', handleResponse);
      socket.emit('removeSchedule', data, handleResponse);

      return p.promise;
    }

    /**
     * Removes a manageable's historic.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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

      var socket = SocketFactory.initSocket(socketNamespace);
      socket.once('removedHistoric', handleResponse);
      socket.emit('removeHistoric', data, handleResponse);

      return p.promise;
    }

    /**
     * Removes the whole manageable's history.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('removeHistory', data, function(response) {
        if (response && response.error)
          p.reject(response.error);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Starts a new record session on devices.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @param {Array} ids The list of devices' ids
     * @param {String} presetId The record session preset id
     * @param {String} [name] The record name
     * @return {Promise} Promise resolving when a start request has been sent to devices
     */
    function startRecord(ids, presetId, name) {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('device.startSession', {
        ids: ids,
        presetId: presetId,
        name: name
      }, function(response) {
        if (response && response.errors)
          p.reject(response.errors);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Stops a recording session on devices.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @param {Array} ids The list of devices' ids
     * @return {Promise} Promise resolving when a stop request has been sent to devices
     */
    function stopRecord(ids) {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('device.stopSession', {
        ids: ids
      }, function(response) {
        if (response && response.errors)
          p.reject(response.errors);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Tags recording sessions on devices.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
     * @param {Array} ids The list of devices' ids
     * @return {Promise} Promise resolving when a tag request has been sent to devices
     */
    function tagRecord(ids) {
      var p = $q.defer();
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('device.indexSession', {
        ids: ids
      }, function(response) {
        if (response && response.errors)
          p.reject(response.errors);
        else
          p.resolve();
      });

      return p.promise;
    }

    /**
     * Removes a manageable.
     *
     * @memberof module:ov.manage~ManageFactory
     * @instance
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
      var socket = SocketFactory.initSocket(socketNamespace);

      socket.emit('remove', data, function(response) {
        if (response && response.errors)
          p.reject(response.errors);
        else
          p.resolve();
      });

      return p.promise;
    }

    return {
      getGroups: getGroups,
      getDevices: getDevices,
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
    'SocketFactory',
    'MANAGE_NAME'
  ];

})(angular.module('ov.manage'));
