'use strict';

var schedule = require('node-schedule');
var shortid = require('shortid');

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

  /**
   * The list of registered jobs in the cron.
   *
   * @property jobs
   * @type {Array}
   */
  this.jobs = [];

}

module.exports = ScheduleManager;

/**
 * Removes a job.
 *
 * @method removeJob
 * @param {String} id The id of the job
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
    this.jobs.slice(index, 1);
};

/**
 * Creates a new job.
 *
 * @method addJob
 * @param {Date} date The date to execute the job
 * @param {Date} [endDate] End date for daily jobs
 * @param {Boolean} isDaily true if the job must be daily, false otherwise
 * @param {Function} functionToExecute The function to execute at the specified date
 * @return {String} The job id
 */
ScheduleManager.prototype.addJob = function(date, endDate, isDaily, functionToExecute) {
  if (date && functionToExecute) {
    var job;
    var id = shortid.generate();

    if (isDaily) {

      // Daily job
      var rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = [new schedule.Range(0, 6)];
      rule.hour = date.getHours();
      rule.minute = date.getMinutes();
      job = schedule.scheduleJob(id, {start: date, end: endDate, rule: rule}, functionToExecute);

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
