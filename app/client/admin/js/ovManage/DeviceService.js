'use strict';

(function(app) {

  /**
   * Defines a device service.
   *
   * @module ov.manage
   * @class DeviceService
   */
  function DeviceService($q, $http, $rootScope, manageService, entityService, manageName) {

    var selectedDevice = null,
      basePath = '/be/manage/';

    /**
     * Define the selected device to display in the detail window
     *
     * @param {String} deviceId the device or group id
     * @param {Boolean} isGroup True if the id sent is a group id
     * @returns {promise|r.promise|*}
     * @method setSelectedDevice
     */
    function setSelectedDevice(deviceId, isGroup) {
      var deferred = $q.defer();

      if (!isGroup) {
        selectedDevice = manageService.getDevice(deviceId);
      } else {
        selectedDevice = manageService.getGroup(deviceId);
      }

      deferred.resolve();

      return deferred.promise;
    }

    /**
     * Return the selected device
     *
     * @returns {*}
     * @method getSelectedDevice
     */
    function getSelectedDevice() {
      return selectedDevice;
    }

    /**
     * Clear the selected device
     */
    function clearSelectedDevice() {
      selectedDevice = null;
    }

    /**
     * Manage the state of a device or a group of devices
     *
     * @returns {boolean}
     */
    function updateState() {
      var isGroup = selectedDevice.devices,
        groupReady = false;

      if (isGroup) {
        selectedDevice.devices.map(function(device) {
          switch (device.status) {
            case 'error':
              selectedDevice.state = 'MANAGE.DEVICE.ERROR';
              return false;
            case 'recording':
              selectedDevice.state = 'MANAGE.DEVICE.RECORDING';
              return false;
            case 'starting':
              selectedDevice.state = 'MANAGE.DEVICE.STARTING';
              return false;
            default:
              if (device.status == 'stopped') {
                groupReady = true;
              }
          }
        });
        if (groupReady) {
          selectedDevice.state = 'MANAGE.DEVICE.READY';
        } else {
          selectedDevice.state = 'MANAGE.DEVICE.DISCONNECTED';
        }
      }

      switch (selectedDevice.status) {
        case 'stopped':
          selectedDevice.state = 'MANAGE.DEVICE.READY';
          break;
        case 'error':
          selectedDevice.state = 'MANAGE.DEVICE.ERROR';
          break;
        case 'recording':
          selectedDevice.state = 'MANAGE.DEVICE.RECORDING';
          break;
        case 'starting':
          selectedDevice.state = 'MANAGE.DEVICE.STARTING';
          break;
        default:
          selectedDevice.state = 'MANAGE.DEVICE.DISCONNECTED';
      }
      return false;
    }

    /**
     * Define the selected device and send event to inform the device detail window
     *
     * @param {String | null} deviceId the device or group id
     * @param {Boolean | null} isGroup True if the id sent is a group id
     * @returns {Object | null}
     * @method manageDeviceDetails
     */
    function manageDeviceDetails(deviceId, isGroup) {

      // if device id is not defined clear the selected device
      if (deviceId) {
        setSelectedDevice(deviceId, isGroup).then(function() {

          // Send an event to load the selected device from controller
          $rootScope.$broadcast('device.details');
        });
      } else {
        clearSelectedDevice();

        // Send an event to clear the selected device from controller
        $rootScope.$broadcast('closeDeviceDetails');
      }

      return selectedDevice;
    }

    /**
     *  Create a record's schedule
     *
     * @param {Object} params Contains all data needed to create the record's schedule
     * @returns {*}
     */
    function addCronSchedule(params) {
      return $http.post(basePath + 'addCronSchedule/' + params);
    }

    return {
      manageDeviceDetails: manageDeviceDetails,
      getSelectedDevice: getSelectedDevice,
      clearSelectedDevice: clearSelectedDevice,
      updateState: updateState,
      addCronSchedule: addCronSchedule
    };

  }

  app.factory('deviceService', DeviceService);
  DeviceService.$inject = [
    '$q',
    '$http',
    '$rootScope',
    'manageService',
    'entityService',
    'manageName'];

})(angular.module('ov.manage'));
