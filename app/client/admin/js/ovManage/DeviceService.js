'use strict';

(function(app) {

  /**
   * Defines a device service.
   *
   * @module ov.manage
   * @class DeviceService
   */
  function DeviceService($q, $rootScope, manageService, entityService, manageName) {

    var selectedDevice = null;

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
        selectedDevice = angular.copy(manageService.getDevice(deviceId));
      } else {
        selectedDevice = angular.copy(manageService.getGroupWithFullDevices(deviceId));
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

    return {
      manageDeviceDetails: manageDeviceDetails,
      getSelectedDevice: getSelectedDevice,
      clearSelectedDevice: clearSelectedDevice
    };

  }

  app.factory('deviceService', DeviceService);
  DeviceService.$inject = [
    '$q',
    '$rootScope',
    'manageService',
    'entityService',
    'manageName'];

})(angular.module('ov.manage'));
