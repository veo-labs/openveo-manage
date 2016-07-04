'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($http, $q, entityService, manageName) {

    // Mock
    var groups = [

      {
        id: 21,
        name: 'Groupe 1',
        devices: [1, 2]
      }
    ];

    var devices = null;

    /**
     * Ordering devices from its state
     *
     * @param devices
     * @private
     * @returns {{devices: Array, pendingDevices: Array, refusedDevices: Array}}
     */
    function orderDevices(devices) {
      var filteredDevices = {
        acceptedDevices: [],
        pendingDevices: [],
        refusedDevices: []
      };

      devices.map(function(device) {
        if (!device.groups) {
          switch (device.state) {
            case 'accepted':
              filteredDevices.acceptedDevices.push(device);
              break;
            case 'pending':
              filteredDevices.pendingDevices.push(device);
              break;
            case 'refused':
              filteredDevices.refusedDevices.push(device);
              break;
            default:
          }
        }
      });

      return filteredDevices;
    }

    /**
     * Loads devices from server
     *
     * @return {Promise} The promise used to retrieve devices from server
     * @method loadDevices
     */
    function loadDevices() {
      if (!devices) {
        var results = entityService.getAllEntities('devices', manageName).then(function(workingDevices) {
          devices = orderDevices(workingDevices.data.entities);
          devices.groups = groups; // TODO : Manage groups

          return devices;
        });

        return results;
      }

      return $q.when({
        groups: groups,
        acceptedDevices: devices.acceptedDevices,
        refusedDevices: devices.refusedDevices,
        pendingDevices: devices.pendingDevices
      });
    }

    /**
     * group devices together
     *
     * @param {int} draggableId Id of the dragged element
     * @param {int} dropzoneId Id of the dropzone element
     * @return {Promise} The promise used to return updated devices
     * @method groupDevices
     */
    function groupDevices(draggableId, dropzoneId) {

      // var deferred = $q.defer();

      // TODO : $http.post

      // Add devices to group
      groups.push({
        id: parseInt(draggableId + dropzoneId),
        name: 'Groupe ' + draggableId + '_' + dropzoneId,
        devices: [draggableId, dropzoneId]
      });

      // Remove devices
      devices = devices.filter(function(device) {
        return (device.id != draggableId && device.id != dropzoneId);
      });

      return $q.when({
        groups: groups,
        acceptedDevices: devices.acceptedDevices
      });

    }

    /**
     * Update the lists of devices after an update device state
     *
     * @param {Object} device The updated device
     * @param {String} state The initial state of the updated device
     * @param {Boolean} accepted The updated device go to the accepted or refused list
     * @returns {*}
     */
    function updateDevicesList(device, state, accepted) {
      var index = devices[state].findIndex(function(workingDevice) {
        return workingDevice.id == device.id;
      });

      devices[state].splice(index, 1);

      if (accepted) {
        devices.acceptedDevices.push(device);
      } else {
        devices.refusedDevices.push(device);
      }

      return $q.when(devices);
    }

    return {
      loadDevices: loadDevices,
      groupDevices: groupDevices,
      updateDevicesList: updateDevicesList
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = ['$http', '$q', 'entityService', 'manageName'];

})(angular.module('ov.manage'));
