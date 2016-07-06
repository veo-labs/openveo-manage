'use strict';

(function(app) {
  /**
   * Defines a group service.
   *
   * @module ov.manage
   * @class GroupService
   */
  function GroupService($http, $q, manageService, entityService, manageName) {

    /**
     * Load group detail with its devices
     *
     * @param {int} id The id of the group
     * @return {Promise} The promise containing the group details
     * @method loadGroupDetails
     */
    function loadGroupDetails(id) {

      var promises = {
        workingGroup: manageService.getGroup(id),
        workingDevices: manageService.getDevicesByGroup(id)
      };
      return $q.all(promises).then(function(values) {
        return {
          group: values.workingGroup,
          devices: values.workingDevices
        };
      });
    }

    return {
      loadGroupDetails: loadGroupDetails
    };
  }

  app.factory('groupService', GroupService);
  GroupService.$inject = ['$http', '$q', 'manageService', 'entityService', 'manageName'];

})(angular.module('ov.manage'));
