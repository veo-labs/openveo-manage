'use strict';

(function(app) {

  /**
   * Defines a manage service.
   *
   * @module ov.manage
   * @class ManageService
   */
  function ManageService($http, $q) {
    var basePath = '/be/';

    // Mock
    var groups = [

      {
        id: 21,
        name: 'Groupe 1',
        devices: [1, 2]
      }
    ];

    var devices = [

      /* {
        id: 1,
        name: 'Veobox 1'
      },
      {
        id: 2,
        name: 'Veobox 2'
      },*/
      {
        id: 3,
        name: 'Veobox 3'
      },
      {
        id: 4,
        name: 'Veobox 4'
      },
      {
        id: 5,
        name: 'Veobox 5'
      },
      {
        id: 6,
        name: 'Veobox 6'
      },
      {
        id: 7,
        name: 'Veobox 7'
      },
      {
        id: 8,
        name: 'Veobox 8'
      }
    ];

    var refusedDevices = [
      {
        id: 44,
        name: 'Veobox refused 44'
      },
      {
        id: 45,
        name: 'Veobox refused 45'
      }
    ];

    /**
     * Loads devices from server
     *
     * @return {Promise} The promise used to retrieve devices from server
     * @method loadDevices
     */
    function loadDevices() {
      if (!devices) {
        return $http.get(basePath + 'devices').then(function(results) {
          devices = results.devices;
          groups = results.groups;
          refusedDevices = results.refusedDevices;
        });
      }

      return $q.when({
        groups: groups,
        devices: devices,
        refusedDevices: refusedDevices
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
        devices: devices
      });

    }

    /**
     * Add a refused device to the accepted list of devices
     *
     * @param device
     * @returns {*}
     */
    function acceptDevice(device) {

      refusedDevices = refusedDevices.filter(function(refusedDevice) {
        return (refusedDevice.id != device.id);
      });

      devices.push(device);

      return $q.when({
        refusedDevices: refusedDevices,
        devices: devices
      });
    }

    return {
      loadDevices: loadDevices,
      groupDevices: groupDevices,
      acceptDevice: acceptDevice
    };

  }

  app.factory('manageService', ManageService);
  ManageService.$inject = ['$http', '$q'];

})(angular.module('ov.manage'));
