'use strict';

/**
 * Creates a Manageable which is an element with an history and a planning.
 *
 * @class Manageable
 * @constructor
 * @param {Object} manageable A device description object with :
 *   - **String** id The manageable id
 *   - **String** name The manageable name
 *   - **String** state The manageable state
 *   - **Array** history The list of history events related to the manageable
 *   - **Array** schedules The list of manageable's schedules
 */
function Manageable(manageable) {

  /**
   * The manageable's id.
   *
   * @property id
   * @type {String}
   */
  this.id = manageable.id;

  /**
   * The manageable's name.
   *
   * @property name
   * @type {String}
   */
  this.name = manageable.name;

  /**
   * The manageable's history.
   *
   * @property history
   * @type {Array}
   */
  this.history = manageable.history || [];

  /**
   * The manageable's schedules.
   *
   * @property schedules
   * @type {Array}
   */
  this.schedules = manageable.schedules || [];

  /**
   * The manageable's type.
   *
   * @property type
   * @type {String}
   */
  this.type = null;

}

module.exports = Manageable;

/**
 * Checks if two schedules are in conflict.
 *
 * @param {Object} schedule1 Schedule object with :
 *   - **Date** beginDate : The begin date of the schedule
 *   - **Date** duration : The schedule duration
 *   - **Boolean** recurrent : true is this is a daily schedule, false otherwise
 * @param {Object} schedule2 Schedule object with :
 *   - **Date** beginDate : The begin date of the schedule
 *   - **Date** duration : The schedule duration
 *   - **Boolean** recurrent : true is this is a daily schedule, false otherwise
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

    // Conflict between schedules' dates :

    // Schedule2 start date is in schedule1 date interval
    // schedule1 : [------------]
    // schedule2 :   [------------]

    // schedule1 : [------------]
    // schedule2 :   [--------]

    // Schedule2 end date is in schedule1 date interval
    // schedule1 :   [------------]
    // schedule2 : [------------]

    // Schedule2 date interval cover the schedule1 date interval
    // schedule1 :   [------------]
    // schedule2 : [----------------]

    return true;
  }

  if (((schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateDailyEnd) ||
    (schedule2DateDailyEnd >= schedule1DateTimeBegin && schedule2DateDailyEnd <= schedule1DateDailyEnd) ||
    (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateDailyEnd >= schedule1DateDailyEnd)) &&
     (schedule1.recurrent || schedule2.recurrent)) {

    // Daily schedule with conflicting dates
    // Compare only time

    var schedule1TimeBegin = schedule1DateTimeBegin.getHours() + ':' + schedule1DateTimeBegin.getMinutes();
    var schedule1TimeEnd = schedule1DateTimeEnd.getHours() + ':' + schedule1DateTimeEnd.getMinutes();
    var schedule2TimeBegin = schedule2DateTimeBegin.getHours() + ':' + schedule2DateTimeBegin.getMinutes();
    var schedule2TimeEnd = schedule2DateTimeEnd.getHours() + ':' + schedule2DateTimeEnd.getMinutes();

    if ((schedule2TimeBegin >= schedule1TimeBegin && schedule2TimeBegin <= schedule1TimeEnd) ||
      (schedule2TimeEnd >= schedule1TimeBegin && schedule2TimeEnd <= schedule1TimeEnd) ||
      (schedule2TimeBegin <= schedule1TimeBegin && schedule2TimeEnd >= schedule1TimeEnd)) {

      // Conflict between schedules' times :

      // Schedule2 start time is in schedule1 time interval
      // schedule1 : [------------]
      // schedule2 :   [------------]

      // schedule1 : [------------]
      // schedule2 :   [--------]

      // Schedule2 end time is in schedule1 time interval
      // schedule1 :   [------------]
      // schedule2 : [------------]

      // Schedule2 time interval cover the schedule1 time interval
      // schedule1 :   [------------]
      // schedule2 : [----------------]

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
 */
Manageable.prototype.addHistoric = function(historic) {
  if (historic)
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
 */
Manageable.prototype.addSchedule = function(schedule) {
  if (schedule)
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
 * @return {Object|Null} The schedule or null if not found
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
 * @return {Boolean} true if the schedule is not in collision with other schedules
 * false otherwise
 */
Manageable.prototype.isValidSchedule = function(schedule) {
  var i = 0;

  // Start date is after end date or start date is before now
  if (schedule.beginDate >= schedule.endDate || schedule.beginDate <= new Date())
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
 * @return {Boolean} true if the schedule is running, false otherwise
 */
Manageable.prototype.isScheduleRunning = function(schedule) {
  var beginDate = new Date(schedule.beginDate);
  var endDate = new Date(schedule.beginDate.getTime() + schedule.duration);
  var beginTime = beginDate.getHours() + ':' + beginDate.getMinutes();
  var endTime = endDate.getHours() + ':' + endDate.getMinutes();
  var now = new Date();
  var nowTime = now.getHours() + ':' + now.getMinutes();

  if ((beginDate <= now && endDate >= now) ||
     (schedule.recurrent && beginTime <= nowTime && endTime >= nowTime && beginDate <= now)
  ) {
    return false;
  }

  return true;
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
 * @return {Boolean} true if the schedule has expired, false otherwise
 */
Manageable.prototype.isScheduleExpired = function(schedule) {
  var beginDate = new Date(schedule.beginDate);
  var endDate = new Date(schedule.beginDate.getTime() + schedule.duration);
  var beginTime = beginDate.getHours() + ':' + beginDate.getMinutes();
  var endTime = endDate.getHours() + ':' + endDate.getMinutes();
  var now = new Date();
  var nowTime = now.getHours() + ':' + now.getMinutes();

  return ((!schedule.recurrent && beginDate < now && endDate < now) ||
         (schedule.recurrent && schedule.endDate <= now && beginTime <= nowTime && endTime <= nowTime));
};
