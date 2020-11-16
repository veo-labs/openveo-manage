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
     * Gets all ranges of time a schedule occupies for each day of the week.
     *
     * A schedule may start on a day and terminates another one or it may also start on a day and terminates the same
     * day one week later.
     *
     * @method getScheduleOccupiedTimePerDay
     * @private
     * @param {Object} schedule Schedule object with:
     * @param {Date} schedule.beginDate The begin date of the schedule
     * @param {Number} schedule.duration The schedule duration (in ms)
     * @param {String} [schedule.recurrent] Either 'daily' or 'weekly' if recurrent
     * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is specified)
     */
    function getScheduleOccupiedTimePerDay(schedule) {

      // Calculate schedules start and end times without caring about days
      var scheduleDateTimeBegin = new Date(schedule.beginDate);
      var scheduleDateTimeEnd = new Date(scheduleDateTimeBegin.getTime() + schedule.duration);
      var scheduleTimeBegin = (scheduleDateTimeBegin.getHours() * 3600000) +
          (scheduleDateTimeBegin.getMinutes() * 60000) +
          scheduleDateTimeBegin.getSeconds() * 1000;
      var scheduleTimeEnd = (scheduleDateTimeEnd.getHours() * 3600000) +
          (scheduleDateTimeEnd.getMinutes() * 60000) +
          scheduleDateTimeEnd.getSeconds() * 1000;

      var completeDayTime = (23 * 3600000) + (59 * 60000) + (59 * 1000);
      var completeDayOccupiedTime = {
        start: 0,
        end: completeDayTime
      };

      // Build an array to hold the occupied time of schedule in each day of the week
      var scheduleOccupiedTimePerDay = new Array(7);

      if (scheduleDateTimeBegin.getDay() === scheduleDateTimeEnd.getDay()) {

        // Schedule starts and terminates the same day of the week but it doesn't mean this is the same week
        // If this is the same day of the same week then the begin time should be lesser than the end time

        if (scheduleTimeBegin > scheduleTimeEnd) {

          // Schedule range covers almost a whole week (remember we assumed it can't be a whole week)
          // Same day but different week

          // Start by marking all days of the week as occupied at full time
          scheduleOccupiedTimePerDay.fill([completeDayOccupiedTime]);

          // Override precise day occupied time with two ranges of occupied time (for the day it starts and the
          // day it ends)
          // The first occupied range goes from the start time to the end of the day as it continues until next week
          // The second occupied range goes from the beginning of the day to the end time
          scheduleOccupiedTimePerDay[scheduleDateTimeBegin.getDay()] = [{
            start: scheduleTimeBegin,
            end: completeDayTime
          }, {
            start: 0,
            end: scheduleTimeEnd
          }];

        } else {

          // Schedule is on a single day
          // Same day, same week
          // If schedule is daily add occupied time for each day of the week

          scheduleOccupiedTimePerDay.fill(
            [
              {
                start: scheduleTimeBegin,
                end: scheduleTimeEnd
              }
            ],
            (schedule.recurrent === 'daily') ? 0 : scheduleDateTimeBegin.getDay(),
            (schedule.recurrent === 'daily') ? 7 : scheduleDateTimeBegin.getDay() + 1
          );
        }

      } else {

        // Schedule starts on a day an terminates on another
        // If schedule is daily add an occupied time for each day of the week

        // Mark days between start day and end day as occupied at full time excluding start day and end day
        if (scheduleDateTimeBegin.getDay() < scheduleDateTimeEnd.getDay()) {
          scheduleOccupiedTimePerDay.fill(
            [completeDayOccupiedTime],
            scheduleDateTimeBegin.getDay() + 2,
            scheduleDateTimeEnd.getDay()
          );
        } else {
          scheduleOccupiedTimePerDay.fill(
            [completeDayOccupiedTime],
            scheduleDateTimeBegin.getDay() + 2
          );
          scheduleOccupiedTimePerDay.fill(
            [completeDayOccupiedTime],
            0,
            scheduleDateTimeEnd.getDay()
          );
        }

        // Set day occupied time with two ranges of occupied time (for the day it starts and the day it ends)
        // The first occupied range goes from the start time to the end of the day as it continues until next week
        // The second occupied range goes from the beginning of the day to the end time
        var startDayOccupiedTime = {
          start: scheduleTimeBegin,
          end: completeDayTime
        };
        var endDayOccupiedTime = {
          start: 0,
          end: scheduleTimeEnd
        };

        if (schedule.recurrent === 'daily') {

          // Schedule is daily
          // Add occupied time for the start day and end day for all days of the week

          scheduleOccupiedTimePerDay.fill([startDayOccupiedTime, endDayOccupiedTime]);
        } else {

          // Schedule is not daily
          // Set occupied time for begin day and end day

          // Start day
          scheduleOccupiedTimePerDay[scheduleDateTimeBegin.getDay()] = [startDayOccupiedTime];

          // End day
          scheduleOccupiedTimePerDay[scheduleDateTimeEnd.getDay()] = [endDayOccupiedTime];

        }

      }

      return scheduleOccupiedTimePerDay;
    }

    /**
     * Checks if a schedule is actually running.
     *
     * @method isScheduleRunning
     * @param {Object} schedule The schedule description object
     * @param {Date} schedule.beginDate The begin date of the schedule
     * @param {Number} schedule.duration The schedule duration (in ms)
     * @param {String} [schedule.recurrent] Either "daily" or "weekly"
     * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is specified)
     * @return {Boolean} true if the schedule is running, false otherwise
     */
    function isScheduleRunning(schedule) {
      var now = new Date();
      var firstOccurrenceEndDate = new Date(schedule.beginDate.getTime() + schedule.duration);

      if (schedule.beginDate <= now && firstOccurrenceEndDate >= now) return true;

      var scheduleOccupiedTimePerDay = getScheduleOccupiedTimePerDay(schedule);
      if (!scheduleOccupiedTimePerDay[now.getDay()]) return false;

      if (schedule.recurrent && schedule.beginDate <= now && schedule.endDate >= now) {

        var nowTime = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;

        // Iterate on schedule occupied times for the day
        for (var i = 0; i < scheduleOccupiedTimePerDay[now.getDay()].length; i++) {
          var scheduleOccupiedTime = scheduleOccupiedTimePerDay[now.getDay()][i];
          if (!scheduleOccupiedTime) continue;

          if (scheduleOccupiedTime.start <= nowTime && scheduleOccupiedTime.end >= nowTime) {
            return true;
          }
        }

      }
      return false;
    }

    /**
     * Checks if two schedules are in conflict.
     *
     * Conflict examples without recurrence:
     *
     * Example 1:
     * [------------]
     * [------------]
     *
     * Example 2:
     * [------------]
     *              [------------]
     *
     * Example 3:
     *              [------------]
     * [------------]
     *
     * Example 4:
     * [------------]
     *   [------------]
     *
     * Example 5:
     *   [------------]
     * [------------]
     *
     * Example 6:
     * [------------]
     *   [--------]
     *
     * Example 7:
     *   [--------]
     * [------------]
     *
     *
     * Additional conflict examples with daily recurrence:
     *
     * ############################################## EXAMPLE 1 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *
     *             [DAILY]                              [DAILY]                              [DAILY]
     *                                                  [-----]
     *
     *                                                  [-----]
     *             [DAILY]                              [DAILY]                              [DAILY]
     *
     * ############################################## EXAMPLE 2 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [DAILY]                              [DAILY]                              [DAILY]
     *                                           [-----]
     *
     *                                           [-----]
     *             [DAILY]                              [DAILY]                              [DAILY]
     *
     * ############################################## EXAMPLE 3 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [DAILY]                              [DAILY]                              [DAILY]
     *                                                        [-----]
     *
     *                                                        [-----]
     *             [DAILY]                              [DAILY]                              [DAILY]
     *
     * ############################################## EXAMPLE 4 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [DAILY]                              [DAILY]                              [DAILY]
     *                                                   [---]
     *
     *                                                   [---]
     *             [DAILY]                              [DAILY]                              [DAILY]
     *
     * ############################################## EXAMPLE 5 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [DAILY]                              [DAILY]                              [DAILY]
     *                                              [-------------]
     *
     *                                              [-------------]
     *             [DAILY]                              [DAILY]                              [DAILY]
     *
     * ############################################## EXAMPLE 6 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *                                                  [-----]
     *          [------------ DAILY -----------]     [------------ DAILY -----------]     [------------ DAILY --------
     *
     *          [------------ DAILY -----------]     [------------ DAILY -----------]     [------------ DAILY --------
     *                                                  [-----]
     *
     * ############################################## EXAMPLE 7 ######################################################
     * | ------------ SUNDAY ------------- || ------------ MONDAY ------------- || ----------- THUESDAY ------------ |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *                                                  [-----]
     *                               [---------- DAILY ----------]        [---------- DAILY ----------]        [------
     *
     *                               [---------- DAILY ----------]        [---------- DAILY ----------]        [------
     *                                                  [-----]
     *
     * Additional conflict examples with weekly recurrence:
     *
     * ############################################## EXAMPLE 1 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                                                       [-----]
     *
     *                                                                                       [-----]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 2 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                                                 [-----]
     *
     *                                                                                 [-----]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 3 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                                                             [-----]
     *
     *                                                                                             [-----]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 4 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                                                        [---]
     *
     *                                                                                        [---]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 5 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                                                    [-----------]
     *
     *                                                                                    [-----------]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 6 ######################################################
     * | --------- [... SUNDAY] ---------- || ------------ SUNDAY ------------- || ------------ MONDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                              [WEEKL]
     *                                               [------------------------------]
     *
     *                                               [------------------------------]
     *             [WEEKL]                              [WEEKL]
     *
     *
     * Additional conflict examples with both daily and weekly recurrences:
     *
     * ############################################## EXAMPLE 1 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                  [DAILY]                              [DAILY]
     *
     *                                                  [DAILY]                              [DAILY]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 2 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                                        [DAILY]                              [DAILY]
     *
     *                                                        [DAILY]                              [DAILY]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 3 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                            [DAILY]                              [DAILY]
     *
     *                                            [DAILY]                              [DAILY]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 4 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *             [WEEKL]                                                                   [WEEKL]
     *                                               [---DAILY---]                        [---DAILY---]
     *
     *                                               [---DAILY---]                        [---DAILY---]
     *             [WEEKL]                                                                   [WEEKL]
     *
     * ############################################## EXAMPLE 5 ######################################################
     * | ------------ SUNDAY ------------- || ------------- [..] -------------- || ------------ SUNDAY ------------- |
     * |02|04|06|08|10|12|14|16|18|20|22|24||                                   ||02|04|06|08|10|12|14|16|18|20|22|24|
     *
     *          [---WEEKL---]                                                                [---WEEKL---]
     *                                                     [DAILY]                              [DAILY]
     *
     *                                                     [DAILY]                              [DAILY]
     *          [---WEEKL---]                                                                [---WEEKL---]
     *
     * @method checkSchedulesConflict
     * @private
     * @param {Object} schedule1 Schedule object with:
     * @param {Date} schedule1.beginDate The begin date of the schedule
     * @param {Number} schedule1.duration The schedule duration (in ms)
     * @param {String} [schedule1.recurrent] Either 'daily' or 'weekly' if recurrent
     * @param {Date} [schedule1.endDate] The end date of the daily schedule (required if recurrent is set to true)
     * @param {Object} schedule2 Schedule object with:
     * @param {Date} schedule2.beginDate The begin date of the schedule
     * @param {Number} schedule2.duration The schedule duration
     * @param {String} [schedule2.recurrent] Either 'daily' or 'weekly' if recurrent
     * @param {Date} [schedule2.endDate] The end date of the daily schedule (required if recurrent is set to true)
     * @return {Boolean} true if there are in conflict, false otherwise
     */
    function checkSchedulesConflict(schedule1, schedule2) {
      var schedule1DateTimeBegin = new Date(schedule1.beginDate);
      var schedule1DateTimeEnd = new Date(schedule1DateTimeBegin.getTime() + schedule1.duration);
      var schedule1DateRecurrenceEnd = new Date(schedule1.recurrent ? schedule1.endDate : schedule1DateTimeEnd);
      var schedule2DateTimeBegin = new Date(schedule2.beginDate);
      var schedule2DateTimeEnd = new Date(schedule2DateTimeBegin.getTime() + schedule2.duration);
      var schedule2DateRecurrenceEnd = new Date(schedule2.recurrent ? schedule2.endDate : schedule2DateTimeEnd);

      if (

        // Schedule 2 begin date / time inside schedule 1 date / time
        (schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateTimeEnd) ||

        // Schedule 2 end date / time inside schedule 1 date / time
        (schedule2DateTimeEnd >= schedule1DateTimeBegin && schedule2DateTimeEnd <= schedule1DateTimeEnd) ||

        // Schedule 1 date / time inside schedule 2 date / time
        (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateTimeEnd >= schedule1DateTimeEnd)

      ) {

        // Conflict between schedules' dates first occurences
        return true;
      }

      // Recurrence
      if (
        (

          // Schedule 2 range begin inside schedule 1 range
          (schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateRecurrenceEnd) ||

          // Schedule 2 range end inside schedule 1 range
          (
            schedule2DateRecurrenceEnd >= schedule1DateTimeBegin &&
            schedule2DateRecurrenceEnd <= schedule1DateRecurrenceEnd
          ) ||

          //  Schedule 1 range inside schedule 2 range
          (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateRecurrenceEnd >= schedule1DateRecurrenceEnd)

        ) &&
        (schedule1.recurrent || schedule2.recurrent)
      ) {

        // Recurrent schedule with conflicting ranges
        // We know that at least one schedule is recurrent, daily or weekly which means that the days and times must
        // be considered

        // Build one array per schedules to hold the occupied time of schedules in each day of the week
        var schedule1OccupiedTimePerDay = getScheduleOccupiedTimePerDay(schedule1);
        var schedule2OccupiedTimePerDay = getScheduleOccupiedTimePerDay(schedule2);

        // We have the list of occupied times for each day of the week and for each schedule
        // Check if there are conflicts in occupied times

        // Iterate on days
        for (var day = 0; day < 7; day++) {

          // Iterate on schedule 1 occupied times for the day
          for (var i = 0; i < schedule1OccupiedTimePerDay.length; i++) {
            if (!schedule1OccupiedTimePerDay[day] || !schedule1OccupiedTimePerDay[day][i]) continue;
            var schedule1OccupiedTime = schedule1OccupiedTimePerDay[day][i];
            if (!schedule1OccupiedTime) continue;

            // Iterate on schedule 2 occupied times for the day
            for (var j = 0; j < schedule2OccupiedTimePerDay.length; j++) {
              if (!schedule2OccupiedTimePerDay[day] || !schedule2OccupiedTimePerDay[day][j]) continue;
              var schedule2OccupiedTime = schedule2OccupiedTimePerDay[day][j];

              if (

                // Schedule 2 begin time inside schedule 1 time
                (
                  schedule2OccupiedTime.start >= schedule1OccupiedTime.start &&
                  schedule2OccupiedTime.start <= schedule1OccupiedTime.end
                ) ||

                // Schedule 2 end time inside schedule 1 time
                (
                  schedule2OccupiedTime.end >= schedule1OccupiedTime.start &&
                  schedule2OccupiedTime.end <= schedule1OccupiedTime.end
                ) ||

                // Schedule 1 time inside schedule 2 time
                (
                  schedule2OccupiedTime.start <= schedule1OccupiedTime.start &&
                  schedule2OccupiedTime.end >= schedule1OccupiedTime.end
                )

              ) {

                // Conflict between schedules' times
                return true;

              }
            }
          }
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
      getScheduleOccupiedTimePerDay: getScheduleOccupiedTimePerDay,
      isValidSchedule: isValidSchedule,
      isScheduleRunning: isScheduleRunning
    };

  }

  app.factory('ManageManageableFactory', ManageableFactory);
  ManageableFactory.$inject = [
    '$filter'
  ];

})(angular.module('ov.manage'));
