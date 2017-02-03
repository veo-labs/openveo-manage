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
 * Checks if two schedules are in conflict.
 *
 * @example
 *
 *      Conflict examples :
 *
 *       schedule1 : [------------]
 *       schedule2 : [------------]
 *
 *       schedule1 : [------------]
 *       schedule2 :              [------------]
 *
 *       schedule1 :              [------------]
 *       schedule2 : [------------]
 *
 *       schedule1 : [------------]
 *       schedule2 :   [------------]
 *
 *       schedule1 :   [------------]
 *       schedule2 : [------------]
 *
 *       schedule1 : [------------]
 *       schedule2 :   [--------]
 *
 *       schedule1 :   [--------]
 *       schedule2 : [------------]
 *
 * @method checkSchedulesConflict
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
Manageable.prototype.checkSchedulesConflict = function(schedule1, schedule2) {
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
  var beginDate = new Date(schedule.beginDate);
  var endDate = new Date(schedule.beginDate.getTime() + schedule.duration);
  var beginTime = beginDate.getHours() * 3600000 + beginDate.getMinutes() * 60000 + beginDate.getSeconds() * 1000;
  var endTime = endDate.getHours() * 3600000 + endDate.getMinutes() * 60000 + endDate.getSeconds() * 1000;
  var now = new Date();
  var nowTime = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;

  return (
    (
      beginDate <= now &&
      endDate >= now &&
      !schedule.recurrent
    ) ||
    (
      schedule.recurrent &&
      schedule.endDate &&
      schedule.endDate >= now &&
      beginTime <= nowTime &&
      endTime >= nowTime &&
      beginDate <= now
    )
  );
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
