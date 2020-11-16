'use strict';

/**
 * @module manageables
 */

/**
 * Defines a Manageable which is an element with an history and a planning.
 *
 * @class Manageable
 * @constructor
 * @param {Object} manageable A device description object
 * @param {String} manageable.id The manageable id
 * @param {String} [manageable.name] The manageable name
 * @param {String} [manageable.state] The manageable state
 * @param {Array} [manageable.history] The list of history events related to the manageable
 * @param {Array} [manageable.schedules] The list of manageable's schedules
 */
function Manageable(manageable) {
  Object.defineProperties(this, {

    /**
     * The manageable's id.
     *
     * @property id
     * @type String
     * @final
     */
    id: {value: manageable.id, enumerable: true},

    /**
     * The manageable's name.
     *
     * @property name
     * @type String
     * @final
     */
    name: {value: manageable.name, writable: true, enumerable: true},

    /**
     * The manageable's history.
     *
     * @property history
     * @type Array
     */
    history: {value: manageable.history || [], writable: true, enumerable: true},

    /**
     * The manageable's schedules.
     *
     * @property schedules
     * @type Array
     */
    schedules: {value: manageable.schedules || [], writable: true, enumerable: true}

  });
}

module.exports = Manageable;

/**
 * Gets all ranges of time a schedule occupies for each day of the week.
 *
 * A schedule may start on a day and terminates another one or it may also start on a day and terminates the same day
 * one week later.
 *
 * @method getScheduleOccupiedTimePerDay
 * @param {Object} schedule Schedule object with:
 * @param {Date} schedule.beginDate The begin date of the schedule
 * @param {Number} schedule.duration The schedule duration (in ms)
 * @param {String} [schedule.recurrent] Either 'daily' or 'weekly' if recurrent
 * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is specified)
 */
Manageable.prototype.getScheduleOccupiedTimePerDay = function(schedule) {

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
};

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
Manageable.prototype.checkSchedulesConflict = function(schedule1, schedule2) {
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
    var schedule1OccupiedTimePerDay = this.getScheduleOccupiedTimePerDay(schedule1);
    var schedule2OccupiedTimePerDay = this.getScheduleOccupiedTimePerDay(schedule2);

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
};

/**
 * Adds an historic to manageable's history.
 *
 * @method addHistoric
 * @param {Object} historic The historic
 * @param {String} historic.id The historic id
 */
Manageable.prototype.addHistoric = function(historic) {
  this.history.push(historic);
};

/**
 * Removes an historic from manageable's history.
 *
 * @method removeHistoric
 * @param {String} historicId The historic id
 * @return {Object|Null} The removed historic or null if not found
 */
Manageable.prototype.removeHistoric = function(historicId) {
  var index = this.history.findIndex(function(historic) {
    return historic.id === historicId;
  });

  if (index > -1)
    return this.history.splice(index, 1)[0];

  return null;
};

/**
 * Removes manageable's history.
 *
 * @method removeHistory
 */
Manageable.prototype.removeHistory = function() {
  this.history = [];
};

/**
 * Adds a schedule to manageable's schedules.
 *
 * @method addSchedule
 * @param {Object} schedule The schedule
 * @param {String} schedule.id The schedule id
 */
Manageable.prototype.addSchedule = function(schedule) {
  this.schedules.push(schedule);
};

/**
 * Removes a schedule from manageable's schedules.
 *
 * @method removeSchedule
 * @param {String} scheduleId The schedule id
 * @return {Object|Null} The removed schedule or null if not found
 */
Manageable.prototype.removeSchedule = function(scheduleId) {
  var index = this.schedules.findIndex(function(schedule) {
    return schedule.id === scheduleId;
  });

  if (index > -1)
    return this.schedules.splice(index, 1)[0];

  return null;
};

/**
 * Gets a schedule.
 *
 * @method getSchedule
 * @param {String} id The schedule id
 * @return {Object|Undefined} The schedule or null if not found
 */
Manageable.prototype.getSchedule = function(id) {
  return this.schedules.find(function(schedule) {
    return (schedule.id === id);
  });
};

/**
 * Checks if a schedule is not in collision with other schedules.
 *
 * @method isValidSchedule
 * @param {Object} schedule The schedule description object
 * @param {Date} schedule.beginDate The begin date of the schedule
 * @param {Number} schedule.duration The schedule duration (in ms)
 * @param {Boolean} [schedule.recurrent=false] true if this is a daily schedule, false otherwise
 * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is set to true)
 * @return {Boolean} true if the schedule is not in collision with other schedules
 * false otherwise
 */
Manageable.prototype.isValidSchedule = function(schedule) {
  var i = 0;

  // Start date is after end date or start date is before now
  if ((schedule.endDate && schedule.beginDate >= schedule.endDate) || schedule.beginDate <= new Date())
    return false;


  // Validates that the schedule is not in conflict with one of the existing schedules
  for (i = 0; i < this.schedules.length; i++) {
    if (this.checkSchedulesConflict(this.schedules[i], schedule))
      return false;
  }

  return true;
};

/**
 * Checks if a schedule is actually running.
 *
 * @method isScheduleRunning
 * @param {Object} schedule The schedule description object
 * @param {Date} schedule.beginDate The begin date of the schedule
 * @param {Number} schedule.duration The schedule duration (in ms)
 * @param {Boolean} [schedule.recurrent=false] true if this is a daily schedule, false otherwise
 * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is set to true)
 * @return {Boolean} true if the schedule is running, false otherwise
 */
Manageable.prototype.isScheduleRunning = function(schedule) {
  var now = new Date();
  var firstOccurrenceEndDate = new Date(schedule.beginDate.getTime() + schedule.duration);

  if (schedule.beginDate <= now && firstOccurrenceEndDate >= now) return true;

  var scheduleOccupiedTimePerDay = this.getScheduleOccupiedTimePerDay(schedule);
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
};

/**
 * Checks if a schedule has expired.
 *
 * Schedule is considered expired if one of the following condition is filled :
 *   - Schedule is not recurrent and schedule has finished
 *   - Schedule is recurrent and this is the end date and day schedule has finished
 *
 * @method isScheduleExpired
 * @param {Object} schedule The schedule description object
 * @param {Date} schedule.beginDate The begin date of the schedule
 * @param {Number} schedule.duration The schedule duration (in ms)
 * @param {Boolean} [schedule.recurrent=false] true if this is a daily schedule, false otherwise
 * @param {Date} [schedule.endDate] The end date of the daily schedule (required if recurrent is set to true)
 * @return {Boolean} true if the schedule has expired, false otherwise
 */
Manageable.prototype.isScheduleExpired = function(schedule) {
  var beginDate = new Date(schedule.beginDate);
  var endDate = new Date(schedule.beginDate.getTime() + schedule.duration);
  var now = new Date();

  return (
    (
      beginDate < now &&
      endDate < now &&
      !schedule.recurrent
    ) ||
    (
      schedule.recurrent &&
      schedule.endDate &&
      schedule.endDate < now
    )
  );
};
