'use strict';

/**
 * @module manage
 */

/**
 * The list of server errors.
 *
 * @class ERRORS
 * @static
 */

var ERRORS = {

  // Server errors

  /**
   * Unidentified error.
   *
   * @property UNKNOWN_ERROR
   * @type Object
   * @final
   */
  UNKNOWN_ERROR: {
    code: 0x000,
    module: 'manage'
  },

  /**
   * Removing a manageable failed.
   *
   * @property REMOVE_ERROR
   * @type Object
   * @final
   */
  REMOVE_ERROR: {
    code: 0x001,
    module: 'manage'
  },

  /**
   * Removing a group failed, group was not found.
   *
   * @property REMOVE_GROUP_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_SCHEDULE_ERROR: {
    code: 0x002,
    module: 'manage'
  },

  /**
   * Updating device's name failed.
   *
   * @property UPDATE_DEVICE_NAME_ERROR
   * @type Object
   * @final
   */
  UPDATE_DEVICE_NAME_ERROR: {
    code: 0x003,
    module: 'manage'
  },

  /**
   * Updating group's name failed.
   *
   * @property UPDATE_GROUP_NAME_ERROR
   * @type Object
   * @final
   */
  UPDATE_GROUP_NAME_ERROR: {
    code: 0x004,
    module: 'manage'
  },

  /**
   * Updating device's name failed, device was not found.
   *
   * @property UPDATE_DEVICE_NAME_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  UPDATE_DEVICE_NAME_NOT_FOUND_ERROR: {
    code: 0x005,
    module: 'manage'
  },

  /**
   * Updating group's name failed, group was not found.
   *
   * @property UPDATE_GROUP_NAME_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  UPDATE_GROUP_NAME_NOT_FOUND_ERROR: {
    code: 0x006,
    module: 'manage'
  },

  /**
   * Starting a device's record failed.
   *
   * @property START_DEVICE_SESSION_ERROR
   * @type Object
   * @final
   */
  START_DEVICE_SESSION_ERROR: {
    code: 0x007,
    module: 'manage'
  },

  /**
   * Starting a device's record failed, device was not found.
   *
   * @property START_DEVICE_SESSION_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  START_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x008,
    module: 'manage'
  },

  /**
   * Stopping a device's record failed.
   *
   * @property STOP_DEVICE_SESSION_ERROR
   * @type Object
   * @final
   */
  STOP_DEVICE_SESSION_ERROR: {
    code: 0x009,
    module: 'manage'
  },

  /**
   * Stopping a device's record failed, device was not found.
   *
   * @property STOP_DEVICE_SESSION_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  STOP_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x00a,
    module: 'manage'
  },

  /**
   * Indexing a device's record failed.
   *
   * @property INDEX_DEVICE_SESSION_ERROR
   * @type Object
   * @final
   */
  INDEX_DEVICE_SESSION_ERROR: {
    code: 0x00b,
    module: 'manage'
  },

  /**
   * Indexing a device's record failed, device was not found.
   *
   * @property INDEX_DEVICE_SESSION_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  INDEX_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x00c,
    module: 'manage'
  },

  /**
   * Updating a device's state failed.
   *
   * @property UPDATE_DEVICE_STATE_ERROR
   * @type Object
   * @final
   */
  UPDATE_DEVICE_STATE_ERROR: {
    code: 0x00d,
    module: 'manage'
  },

  /**
   * Updating a device's state failed, device was not found.
   *
   * @property UPDATE_DEVICE_STATE_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  UPDATE_DEVICE_STATE_NOT_FOUND_ERROR: {
    code: 0x00e,
    module: 'manage'
  },

  /**
   * Removing an historic from a manageable's history failed.
   *
   * @property REMOVE_HISTORIC_ERROR
   * @type Object
   * @final
   */
  REMOVE_HISTORIC_ERROR: {
    code: 0x00f,
    module: 'manage'
  },

  /**
   * Removing an historic from a manageable's history failed, manageable was not found.
   *
   * @property REMOVE_HISTORIC_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_HISTORIC_NOT_FOUND_ERROR: {
    code: 0x010,
    module: 'manage'
  },

  /**
   * Removing a manageable's history failed.
   *
   * @property REMOVE_HISTORY_ERROR
   * @type Object
   * @final
   */
  REMOVE_HISTORY_ERROR: {
    code: 0x011,
    module: 'manage'
  },

  /**
   * Removing a manageable's history failed, manageable was not found.
   *
   * @property REMOVE_HISTORY_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_HISTORY_NOT_FOUND_ERROR: {
    code: 0x012,
    module: 'manage'
  },

  /**
   * Adding a schedule to a manageable failed, schedule is not valid.
   *
   * @property ADD_SCHEDULE_INVALID_ERROR
   * @type Object
   * @final
   */
  ADD_SCHEDULE_INVALID_ERROR: {
    code: 0x013,
    module: 'manage'
  },

  /**
   * Adding a schedule to a manageable failed, manageable was not found.
   *
   * @property ADD_SCHEDULE_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  ADD_SCHEDULE_NOT_FOUND_ERROR: {
    code: 0x014,
    module: 'manage'
  },

  /**
   * Adding a schedule to a manageable failed.
   *
   * @property ADD_SCHEDULE_ERROR
   * @type Object
   * @final
   */
  ADD_SCHEDULE_ERROR: {
    code: 0x015,
    module: 'manage'
  },

  /**
   * Removing a schedule from a manageable failed, schedule is actually running.
   *
   * @property REMOVE_SCHEDULE_RUNNING_ERROR
   * @type Object
   * @final
   */
  REMOVE_SCHEDULE_RUNNING_ERROR: {
    code: 0x016,
    module: 'manage'
  },

  /**
   * Removing a schedule from a manageable failed, manageable or schedule was not found.
   *
   * @property REMOVE_SCHEDULE_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_SCHEDULE_NOT_FOUND_ERROR: {
    code: 0x017,
    module: 'manage'
  },

  /**
   * Creating a group failed.
   *
   * @property CREATE_GROUP_ERROR
   * @type Object
   * @final
   */
  CREATE_GROUP_ERROR: {
    code: 0x018,
    module: 'manage'
  },

  /**
   * Adding a device to a group failed.
   *
   * @property ADD_DEVICE_TO_GROUP_ERROR
   * @type Object
   * @final
   */
  ADD_DEVICE_TO_GROUP_ERROR: {
    code: 0x019,
    module: 'manage'
  },

  /**
   * Adding a device to a group failed, device or group was not found.
   *
   * @property ADD_DEVICE_TO_GROUP_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  ADD_DEVICE_TO_GROUP_NOT_FOUND_ERROR: {
    code: 0x01a,
    module: 'manage'
  },

  /**
   * Adding a device to a group failed, schedules of the device are in conflict with schedules of the group.
   *
   * @property ADD_DEVICE_TO_GROUP_SCHEDULES_COLLISION_ERROR
   * @type Object
   * @final
   */
  ADD_DEVICE_TO_GROUP_SCHEDULES_COLLISION_ERROR: {
    code: 0x01b,
    module: 'manage'
  },

  /**
   * Removing a manageable failed, manageable was not found.
   *
   * @property REMOVE_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_NOT_FOUND_ERROR: {
    code: 0x01c,
    module: 'manage'
  },

  /**
   * Removing a device from a group failed, device or group was not found.
   *
   * @property REMOVE_DEVICE_FROM_GROUP_NOT_FOUND_ERROR
   * @type Object
   * @final
   */
  REMOVE_DEVICE_FROM_GROUP_NOT_FOUND_ERROR: {
    code: 0x01d,
    module: 'manage'
  },

  /**
   * Removing a device from a group failed.
   *
   * @property REMOVE_DEVICE_FROM_GROUP_ERROR
   * @type Object
   * @final
   */
  REMOVE_DEVICE_FROM_GROUP_ERROR: {
    code: 0x01e,
    module: 'manage'
  },

  // Wrong parameters

  /**
   * Updating manageable's name failed, wrong parameters.
   *
   * @property UPDATE_NAME_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  UPDATE_NAME_WRONG_PARAMETERS: {
    code: 0x100,
    module: 'manage'
  },

  /**
   * Removing a manageable failed, wrong parameters.
   *
   * @property REMOVE_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_WRONG_PARAMETERS: {
    code: 0x101,
    module: 'manage'
  },

  /**
   * Updating a device's state failed, wrong parameters.
   *
   * @property UPDATE_DEVICE_STATE_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  UPDATE_DEVICE_STATE_WRONG_PARAMETERS: {
    code: 0x102,
    module: 'manage'
  },

  /**
   * Removing an historic from a manageable's history failed, wrong parameters.
   *
   * @property REMOVE_HISTORIC_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_HISTORIC_WRONG_PARAMETERS: {
    code: 0x103,
    module: 'manage'
  },

  /**
   * Adding a schedule to a manageable failed, wrong parameters.
   *
   * @property ADD_SCHEDULE_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  ADD_SCHEDULE_WRONG_PARAMETERS: {
    code: 0x104,
    module: 'manage'
  },

  /**
   * Starting a device's record failed, wrong parameters.
   *
   * @property START_DEVICE_SESSION_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  START_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x105,
    module: 'manage'
  },

  /**
   * Stopping a device's record failed, wrong parameters.
   *
   * @property STOP_DEVICE_SESSION_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  STOP_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x106,
    module: 'manage'
  },

  /**
   * Indexing a device's record failed, wrong parameters.
   *
   * @property INDEX_DEVICE_SESSION_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  INDEX_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x107,
    module: 'manage'
  },

  /**
   * Removing a schedule from a manageable failed, wrong parameters.
   *
   * @property REMOVE_SCHEDULE_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_SCHEDULE_WRONG_PARAMETERS: {
    code: 0x108,
    module: 'manage'
  },

  /**
   * Removing the whole history of a manageable failed, wrong parameters.
   *
   * @property REMOVE_HISTORY_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_HISTORY_WRONG_PARAMETERS: {
    code: 0x109,
    module: 'manage'
  },

  /**
   * Gettings device's settings failed, wrong parameters.
   *
   * @property GET_DEVICE_SETTINGS_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  GET_DEVICE_SETTINGS_WRONG_PARAMETERS: {
    code: 0x10a,
    module: 'manage'
  },

  /**
   * Adding a device to a group failed, wrong parameters.
   *
   * @property ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS: {
    code: 0x10b,
    module: 'manage'
  },

  /**
   * Removing a device from a group failed, wrong parameters.
   *
   * @property REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS: {
    code: 0x10c,
    module: 'manage'
  },

  /**
   * Removing a group failed, wrong parameters.
   *
   * @property REMOVE_GROUP_WRONG_PARAMETERS
   * @type Object
   * @final
   */
  REMOVE_GROUP_WRONG_PARAMETERS: {
    code: 0x10d,
    module: 'manage'
  }

};

Object.freeze(ERRORS);
module.exports = ERRORS;
