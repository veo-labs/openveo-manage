'use strict';

var util = require('util');
var Manageable = process.requireManage('app/server/services/Manageable.js');

/**
 * Creates a Group.
 *
 * @class Group
 * @extends Manageable
 * @constructor
 * @param {Object} group A device description object with :
 *   - **String** id The group id
 *   - **String** name The group name
 *   - **String** state The group state
 *   - **Array** history The list of history events related to the group
 *   - **Array** schedules The list of group's schedules
 */
function Group(group) {
  Group.super_.call(this, group);

  /**
   * The group type.
   *
   * @property type
   * @type {String}
   */
  this.type = Group.TYPE;

}

module.exports = Group;
util.inherits(Group, Manageable);

Group.TYPE = 'group';

/**
 * Checks if a schedule is not in collision with other schedules.
 *
 * Group schedule should not be in collision with devices inside the group.
 *
 * @method isValidSchedule
 * @param {Object} schedule The schedule description object
 * @param {Array} devices Group devices
 * @return {Boolean} true if the schedule is not in collision with other schedules
 * false otherwise
 */
Group.prototype.isValidSchedule = function(schedule, devices) {
  if (!Group.super_.prototype.isValidSchedule.call(this, schedule))
    return false;

  if (devices) {

    // Validates that the schedule is not in conflict with one of the
    // schedules in group's devices
    for (var i = 0; i < devices.length; i++) {
      var device = devices[i];

      for (var j = 0; j < device.schedules.length; j++) {
        if (this.checkSchedulesConflict(device.schedules[j], schedule))
          return false;
      }

    }

  }

  return true;
};
