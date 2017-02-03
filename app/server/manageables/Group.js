'use strict';

/**
 * @module manageables
 */

var util = require('util');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');

/**
 * Defines a Group.
 *
 * @class Group
 * @extends Manageable
 * @constructor
 * @param {Object} group A group description object
 * @param {String} group.id The group's id
 * @param {String} [group.name] The group's name
 * @param {String} [group.state] The group's state
 * @param {Array} [group.history] The list of history events related to the group
 * @param {Array} [group.schedules] The list of group's schedules
 */
function Group(group) {
  Group.super_.call(this, group);

  Object.defineProperties(this, {

    /**
     * The group type.
     *
     * @property type
     * @type String
     * @final
     */
    type: {value: Group.TYPE, enumerable: true}

  });
}

module.exports = Group;
util.inherits(Group, Manageable);

/**
 * Group type.
 *
 * @property TYPE
 * @type String
 * @private
 * @final
 * @default 'group'
 */
Object.defineProperty(Group, 'TYPE', {value: 'group'});

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
