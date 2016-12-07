'use strict';

(function(app) {

  /**
   * Defines a factory to manage manageables.
   *
   * @module ov.manage
   * @class ManageManageableFactory
   */
  function ManageableFactory($filter) {

    /**
     * Adds a manageable historic.
     *
     * @method addHistoric
     * @param {Object} manageable The manageable
     * @param {Object} historic The historic to add
     */
    function addHistoric(manageable, historic) {
      if (manageable) {

        if (historic.message.params && historic.message.params.groupName)
          historic.message.params.groupName = $filter('translate')(historic.message.params.groupName);

        // Make sure historic does not already exist
        var found = false;
        for (var i = 0; i < manageable.history.length; i++) {
          if (manageable.history[i].id === historic.id) {
            found = true;
            break;
          }
        }

        if (!found)
          manageable.history.push(historic);
      }
    }

    /**
     * Removes a manageable historic.
     *
     * @method removeHistoric
     * @param {Object} manageable The manageable
     * @param {String} historicId The historic id
     */
    function removeHistoric(manageable, historicId) {
      if (manageable) {
        var index = -1;
        for (var i = 0; i < manageable.history.length; i++) {
          if (manageable.history[i].id === historicId) {
            index = i;
            break;
          }
        }

        if (index > -1)
          manageable.history.splice(index, 1);
      }
    }

    /**
     * Removes a manageable's history.
     *
     * @method removeHistory
     * @param {Object} manageable The manageable
     */
    function removeHistory(manageable) {
      if (manageable)
        manageable.history.splice(0, manageable.history.length);
    }

    /**
     * Adds a manageable schedule.
     *
     * @method addSchedule
     * @param {Object} manageable The manageable
     * @param {Object} schedule The schedule
     */
    function addSchedule(manageable, schedule) {
      if (manageable) {

        // Make sure schedule does not already exist
        var found = false;
        for (var i = 0; i < manageable.schedules.length; i++) {
          if (manageable.schedules[i].id === schedule.id) {
            found = true;
            break;
          }
        }

        if (!found)
          manageable.schedules.push(schedule);
      }
    }

    /**
     * Removes a manageable's schedule.
     *
     * @method removeSchedule
     * @param {Object} manageable The manageable
     * @param {String} scheduleId The schedule id
     */
    function removeSchedule(manageable, scheduleId) {
      if (manageable) {
        var index = -1;
        for (var i = 0; i < manageable.schedules.length; i++) {
          if (manageable.schedules[i].id === scheduleId) {
            index = i;
            break;
          }
        }

        if (index > -1)
          manageable.schedules.splice(index, 1);
      }
    }

    /**
     * Gets a manageable's preset.
     *
     * @method getPreset
     * @param {Object} manageable The manageable
     * @param {String} presetId The manageable's preset to look for
     * @return {Object|Null} The preset's configuration or null if not found
     */
    function getPreset(manageable, presetId) {
      if (manageable && presetId) {
        for (var i = 0; i < manageable.presets.length; i++) {
          if (manageable.presets[i].id === presetId)
            return manageable.presets[i];
        }
      }

      return null;
    }

    return {
      addHistoric: addHistoric,
      removeHistoric: removeHistoric,
      removeHistory: removeHistory,
      addSchedule: addSchedule,
      removeSchedule: removeSchedule,
      getPreset: getPreset
    };

  }

  app.factory('ManageManageableFactory', ManageableFactory);
  ManageableFactory.$inject = [
    '$filter'
  ];

})(angular.module('ov.manage'));
