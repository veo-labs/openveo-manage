'use strict';

/**
 * @module manage/ScheduleManager
 */

var schedule = require('node-schedule');
var nanoid = require('nanoid').nanoid;

/**
 * Manages process dependent scheduled jobs, for session recording, using
 * node-shedule (https://www.npmjs.com/package/node-schedule).
 *
 * Recording a job is process dependent, meaning that jobs have to be recreated if process
 * is restarted.
 *
 * @class ScheduleManager
 * @constructor
 */
function ScheduleManager() {
  Object.defineProperties(this,

    /** @lends module:manage/ScheduleManager~ScheduleManager */
    {

      /**
       * The list of registered jobs in the cron.
       *
       * @type {Array}
       * @instance
       * @readonly
       */
      jobs: {value: []}

    }

  );
}

module.exports = ScheduleManager;

/**
 * Removes a job.
 *
 * @param {String} id The id of the job to remove
 */
ScheduleManager.prototype.removeJob = function(id) {
  var index = this.jobs.findIndex(function(job) {
    if (job.id === id) {
      job.job.cancel();
      return true;
    }

    return false;
  });

  if (index >= 0)
    this.jobs.splice(index, 1);
};

/**
 * Creates a new job.
 *
 * @param {Date} date The date to execute the job
 * @param {Date} [endDate] End date for recurrent jobs
 * @param {String} [recurrent] Either "daily" or "weekly"
 * @param {Function} functionToExecute The function to execute at the specified date
 * @return {String} The job id
 */
ScheduleManager.prototype.addJob = function(date, endDate, recurrent, functionToExecute) {
  if (date && functionToExecute) {
    var job;
    var id = nanoid();

    if (recurrent) {

      // node-schedule restriction :
      // The recurrent time must always be greater than the start time even if the start date is in the future
      var startDate = new Date(date.getTime() + 1000);

      // End date should be greater than the last job or the last job won't run!
      var scheduleEndDate = new Date(endDate.getTime() + 1000);

      // Daily job
      var rule = new schedule.RecurrenceRule();
      rule.hour = startDate.getHours();
      rule.minute = startDate.getMinutes();
      rule.second = startDate.getSeconds();

      if (recurrent === 'weekly') {
        rule.dayOfWeek = startDate.getDay();
      }

      job = schedule.scheduleJob(id, {start: date, end: scheduleEndDate, rule: rule}, functionToExecute);

    } else {

      // One time job
      job = schedule.scheduleJob(date, functionToExecute);

    }

    if (job) {
      this.jobs.push({
        id: id,
        job: job
      });
    }

    return id;
  }

  return null;
};
