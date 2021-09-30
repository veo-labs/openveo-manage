'use strict';

/**
 * @module manage/manageables/Device
 */

var util = require('util');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');

/**
 * Defines a Device.
 *
 * A Device is a Manageable structure holding information about a device.
 *
 * @class Device
 * @extends module:manage/manageables/Manageable~Manageable
 * @constructor
 * @param {Object} device A device description object
 * @param {String} device.id The device id
 * @param {String} [device.name] The device name
 * @param {String} [device.state] The device state
 * @param {Array} [device.history] The list of history events related to the device
 * @param {Array} [device.schedules] The list of device's schedules
 * @param {Object} [device.storage] The device's storage information
 * @param {Object} [device.inputs] The device's inputs information
 * @param {Array} [device.presets] The list of device's presets
 * @param {String} [device.group] The device's group
 * @param {String} [device.ip] The device's ip
 * @param {String} [device.url] The device's web interface url
 */
function Device(device) {
  Device.super_.call(this, device);

  Object.defineProperties(this,

    /** @lends module:manage/manageables/Device~Device */
    {

      /**
       * The device's type.
       *
       * @type {String}
       * @default Device.TYPE
       * @instance
       * @readonly
       */
      type: {value: Device.TYPE, enumerable: true},

      /**
       * The device's state.
       *
       * @type {String}
       * @instance
       */
      state: {value: device.state, writable: true, enumerable: true},

      /**
       * The device's storage information.
       *
       * @type {Object}
       * @instance
       */
      storage: {value: device.storage, writable: true, enumerable: true},

      /**
       * The device's inputs information.
       *
       * @type {Object}
       * @instance
       */
      inputs: {value: device.inputs, writable: true, enumerable: true},

      /**
       * The device's presets.
       *
       * @type {Array}
       * @instance
       */
      presets: {value: device.presets, writable: true, enumerable: true},

      /**
       * The device's group.
       *
       * @type {String}
       * @instance
       */
      group: {value: device.group, writable: true, enumerable: true},

      /**
       * The device's ip address.
       *
       * @type {String}
       * @instance
       */
      ip: {value: device.ip, writable: true, enumerable: true},

      /**
       * The device's web interface url.
       *
       * @type {String}
       * @instance
       */
      url: {value: device.url, writable: true, enumerable: true},

      /**
       * The device's status.
       *
       * @type {String}
       * @instance
       */
      status: {value: device.status, writable: true, enumerable: true}

    }

  );

  this.setInputs();
  this.setPresets();
}

module.exports = Device;
util.inherits(Device, Manageable);

/**
 * Device type.
 *
 * @memberof module:manage/manageables/Device~Device
 * @member {String} TYPE
 * @private
 * @const
 * @default 'device'
 */
Object.defineProperty(Device, 'TYPE', {value: 'device'});

/**
 * Sets device's storage information.
 *
 * @param {Number} free Number of free Bytes
 * @param {Number} used Number of used Bytes
 */
Device.prototype.setStorage = function(free, used) {
  free = parseInt(free);
  used = parseInt(used);

  if (free || used) {
    var bytesToGbytes = Math.pow(1024, 3);
    this.storage = {
      free: free / bytesToGbytes,
      used: used / bytesToGbytes,
      total: (free + used) / bytesToGbytes,
      percent: (used / (free + used)) * 100
    };
  }
};

/**
 * Sets device's inputs information.
 *
 * @param {Object} [camera Information] about the video camera connected to the device
 * @param {Object} [camera.timings] Information about video camera's configuration
 * @param {Boolean} [camera.timings.supported] true if the connected video camera is supported, false otherwise
 * @param {Object} [slides Information] about the slides connected to the device
 * @param {Object} [slides.timings] Information about the slides' input configuration
 * @param {Boolean} [slides.timings.supported] true if the connected slides' input is supported, false otherwise
 */
Device.prototype.setInputs = function(camera, slides) {
  this.inputs = {
    camera: 'disconnected',
    desktop: 'disconnected'
  };

  if (camera && camera.timings)
    this.inputs.camera = (!camera.timings.supported) ? 'ko' : 'ok';

  if (slides && slides.timings)
    this.inputs.desktop = (!slides.timings.supported) ? 'ko' : 'ok';
};

/**
 * Sets device's presets.
 *
 * @param {Object} [presets] The list of presets referenced by ids
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
 */
Device.prototype.disconnect = function() {
  this.presets = null;
  this.inputs = null;
  this.storage = null;
};

/**
 * Checks if a schedule is not in collision with schedules of a group.
 *
 * Device schedule should not be in collision with group's schedules.
 *
 * @param {Object} schedule The schedule description object
 * @param {Object} [group] The group to test the schedule with
 * @return {Boolean} true if the schedule is not in collision with other schedules
 * false otherwise
 */
Device.prototype.isValidSchedule = function(schedule, group) {
  if (!Device.super_.prototype.isValidSchedule.call(this, schedule))
    return false;

  if (group) {

    // Validates that the schedule is not in conflict with one of the
    // schedules in device's group
    for (var i = 0; i < group.schedules.length; i++) {
      if (this.checkSchedulesConflict(group.schedules[i], schedule))
        return false;
    }

  }

  return true;
};

/**
 * Checks if there are collisions between device's schedules and group's schedules.
 *
 * @param {Object} group The group
 * @return {Boolean} true if there is at least one collision, false otherwise
 */
Device.prototype.isGroupSchedulesCollision = function(group) {
  if (group) {
    for (var i = 0; i < this.schedules.length; i++) {
      var schedule = this.schedules[i];

      // Validate that the schedule is not in conflict with one of the schedules in the group
      for (var j = 0; j < group.schedules.length; j++) {
        if (this.checkSchedulesConflict(group.schedules[j], schedule))
          return true;
      }

    }
  }

  return false;
};
