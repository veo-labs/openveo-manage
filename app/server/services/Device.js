'use strict';

var util = require('util');
var Manageable = process.requireManage('app/server/services/Manageable.js');

/**
 * Creates a Device.
 *
 * @class Device
 * @extends Manageable
 * @constructor
 * @param {Object} device A device description object with :
 *   - **String** id The device id
 *   - **String** name The device name
 *   - **String** state The device state
 *   - **Array** history The list of history events related to the device
 *   - **Array** schedules The list of device's schedules
 *   - **Object** storage The device's storage information
 *   - **Object** inputs The device's inputs information
 *   - **Array** presets The list of device's presets
 *   - **String** [group] The device's group
 */
function Device(device) {
  Device.super_.call(this, device);

  /**
   * The device's type.
   *
   * @property type
   * @type {String}
   */
  this.type = Device.TYPE;

  /**
   * The device's state.
   *
   * @property state
   * @type {String}
   */
  this.state = device.state;

  /**
   * The device's storage information.
   *
   * @property storage
   * @type {Object}
   */
  this.storage = device.storage;

  /**
   * The device's inputs information.
   *
   * @property inputs
   * @type {Object}
   */
  this.inputs = device.inputs;

  /**
   * The device's presets.
   *
   * @property presets
   * @type {Array}
   */
  this.presets = device.presets;

  /**
   * The device's group.
   *
   * @property group
   * @type {String}
   */
  this.group = device.group;

}

module.exports = Device;
util.inherits(Device, Manageable);

Device.TYPE = 'device';

/**
 * Sets device's storage information.
 *
 * @method setStorage
 * @param {Number} free Number of free Bytes
 * @param {Number} used Number of free Bytes
 */
Device.prototype.setStorage = function(free, used) {
  free = parseInt(free);
  used = parseInt(used);
  this.storage = {
    free: free / 1000000000,
    used: used / 1000000000,
    total: (free + used) / 1000000000,
    percent: (used / (free + used)) * 100
  };
};

/**
 * Sets device's inputs information.
 *
 * @method setInputs
 * @param {Object} camera Information about the camera connected to the device
 * @param {Object} slides Information about the slides connected to the device
 */
Device.prototype.setInputs = function(camera, slides) {
  this.inputs = {
    camera: 'disconnected',
    desktop: 'disconnected'
  };

  if (camera.timings)
    this.inputs.camera = (!camera.timings.supported) ? 'ko' : 'ok';

  if (slides.timings)
    this.inputs.desktop = (!slides.timings.supported) ? 'ko' : 'ok';
};

/**
 * Sets device's presets.
 *
 * @method setPresets
 * @param {Object} presets The list of presets referenced by ids
 */
Device.prototype.setPresets = function(presets) {
  this.presets = [];

  for (var id in presets) {
    presets[id].id = id;
    this.presets.push(presets[id]);
  }
};

/**
 * Disconnects the device which removes all volatile information.
 *
 * @method disconnect
 */
Device.prototype.disconnect = function() {
  this.presets = null;
  this.inputs = null;
  this.storage = null;
};

/**
 * Checks if a schedule is not in collision with other schedules.
 *
 * Device schedule should not be in collision with device's group schedules if inside the group.
 *
 * @method isValidSchedule
 * @param {Object} schedule The schedule description object
 * @param {Object} group Device's group
 * @return {Boolean} true if the schedule is not in collision with other schedules
 * false otherwise
 */
Device.prototype.isValidSchedule = function(schedule, group) {
  if (!Device.super_.prototype.isValidSchedule.call(this, schedule))
    return false;

  if (group && this.group) {

    // Validates that the schedule is not in conflict with one of the
    // schedules in device's group
    for (var i = 0; i < group.schedules.length; i++) {
      if (this.checkSchedulesConflict(group.schedules[i], schedule))
        return false;
    }

  }

  return true;
};
