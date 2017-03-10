'use strict';

(function(app) {

  /**
   * @module ov.manage
   */

  /**
   * Defines a factory to manage manageables.
   *
   * @class ManageManageableFactory
   * @static
   */
  function ManageableFactory($filter) {

    /**
     * Checks if two schedules are in conflict.
     *
     * Conflict examples :
     *
     * schedule1 : [------------]
     * schedule2 : [------------]
     *
     * schedule1 : [------------]
     * schedule2 :              [------------]
     *
     * schedule1 :              [------------]
     * schedule2 : [------------]
     *
     * schedule1 : [------------]
     * schedule2 :   [------------]
     *
     * schedule1 :   [------------]
     * schedule2 : [------------]
     *
     * schedule1 : [------------]
     * schedule2 :   [--------]
     *
     * schedule1 :   [--------]
     * schedule2 : [------------]
     *
     * @method checkSchedulesConflict
     * @private
     * @param {Object} schedule1 Schedule object with :
     * @param {Date} schedule1.beginDate The begin date of the schedule
     * @param {Number} schedule1.duration The schedule duration (in ms)
     * @param {Boolean} [schedule1.recurrent=false] true if this is a daily schedule, false otherwise
     * @param {Date} [schedule1.endDate] The end date of the daily schedule (required if recurrent is set to true)
     * @param {Object} schedule2 Schedule object with :
     * @param {Date} schedule2.beginDate The begin date of the schedule
     * @param {Number} schedule2.duration The schedule duration
     * @param {Boolean} [schedule2.recurrent=false] true if this is a daily schedule, false otherwise
     * @param {Date} [schedule2.endDate] The end date of the daily schedule (required if recurrent is set to true)
     * @return {Boolean} true if there are in conflict, false otherwise
     */
    function checkSchedulesConflict(schedule1, schedule2) {
      var schedule1DateTimeBegin = new Date(schedule1.beginDate);
      var schedule1DateDailyEnd = new Date(schedule1.endDate);
      var schedule1DateTimeEnd = new Date(schedule1DateTimeBegin.getTime() + schedule1.duration);
      var schedule2DateTimeBegin = new Date(schedule2.beginDate);
      var schedule2DateDailyEnd = new Date(schedule2.endDate);
      var schedule2DateTimeEnd = new Date(schedule2DateTimeBegin.getTime() + schedule2.duration);

      if ((schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateTimeEnd) ||
        (schedule2DateTimeEnd >= schedule1DateTimeBegin && schedule2DateTimeEnd <= schedule1DateTimeEnd) ||
        (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateTimeEnd >= schedule1DateTimeEnd)) {

        // Conflict between schedules' dates
        return true;
      }

      if (((schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateDailyEnd) ||
        (schedule1DateTimeBegin >= schedule2DateTimeBegin && schedule1DateTimeBegin <= schedule2DateDailyEnd) ||
        (schedule2DateDailyEnd >= schedule1DateTimeBegin && schedule2DateDailyEnd <= schedule1DateDailyEnd) ||
        (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateDailyEnd >= schedule1DateDailyEnd)) &&
         (schedule1.recurrent || schedule2.recurrent)) {

        // Daily schedule with conflicting dates
        // Compare only time

        var schedule1TimeBegin = (schedule1DateTimeBegin.getHours() * 3600000) +
            (schedule1DateTimeBegin.getMinutes() * 60000) +
            schedule1DateTimeBegin.getSeconds() * 1000;
        var schedule1TimeEnd = (schedule1DateTimeEnd.getHours() * 3600000) +
            (schedule1DateTimeEnd.getMinutes() * 60000) +
            schedule1DateTimeEnd.getSeconds() * 1000;
        var schedule2TimeBegin = (schedule2DateTimeBegin.getHours() * 3600000) +
            (schedule2DateTimeBegin.getMinutes() * 60000) +
            schedule2DateTimeBegin.getSeconds();
        var schedule2TimeEnd = (schedule2DateTimeEnd.getHours() * 3600000) +
            (schedule2DateTimeEnd.getMinutes() * 60000) +
            schedule2DateTimeEnd.getSeconds() * 1000;

        if ((schedule2TimeBegin >= schedule1TimeBegin && schedule2TimeBegin <= schedule1TimeEnd) ||
          (schedule2TimeEnd >= schedule1TimeBegin && schedule2TimeEnd <= schedule1TimeEnd) ||
          (schedule2TimeBegin <= schedule1TimeBegin && schedule2TimeEnd >= schedule1TimeEnd)) {

          // Conflict between schedules' times
          return true;
        }
      }

      return false;
    }

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
      if (manageable && presetId && manageable.presets) {
        for (var i = 0; i < manageable.presets.length; i++) {
          if (manageable.presets[i].id === presetId)
            return manageable.presets[i];
        }
      }

      return null;
    }

    /**
     * Checks if a schedule is not in collision with other schedules.
     *
     * @method isValidSchedule
     * @param {Object} schedule The schedule to validate
     * @param {Array} schedules The list of schedules
     * @return {Error|Null} The error if validation failed, null otherwise
     */
    function isValidSchedule(schedule, schedules) {

      // Start date is after end date
      if (schedule.endDate && schedule.beginDate >= schedule.endDate)
        return new Error($filter('translate')('MANAGE.MANAGEABLE.BEGIN_END_DATES_ERROR'));

      // Start date is before actual date
      if (schedule.beginDate <= new Date())
        return new Error($filter('translate')('MANAGE.MANAGEABLE.BEGIN_DATE_ERROR'));

      if (schedules) {

        // Validates that the schedule is not in conflict with one of the schedules
        for (var i = 0; i < schedules.length; i++) {
          if (checkSchedulesConflict(schedules[i], schedule))
            return new Error($filter('translate')('MANAGE.MANAGEABLE.CONFLICT_ERROR'));
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
      getPreset: getPreset,
      checkSchedulesConflict: checkSchedulesConflict,
      isValidSchedule: isValidSchedule
    };

  }

  app.factory('ManageManageableFactory', ManageableFactory);
  ManageableFactory.$inject = [
    '$filter'
  ];

})(angular.module('ov.manage'));
