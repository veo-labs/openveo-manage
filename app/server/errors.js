'use strict';

/**
 * The list of server errors with, for each error, its associated hexadecimal code
 * and an eventual HTTP return code.
 *
 * @example
 *     var errors = process.require("app/server/errors.js");
 *     console.log(errors.UNKNOWN_ERROR);
 *
 * @module errors
 * @main errors
 */
module.exports = {

  // Server errors
  UNKNOWN_ERROR: {
    code: 0x000,
    httpCode: 500,
    module: 'manage'
  },
  UPDATE_DEVICE_ERROR: {
    code: 0x001,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_ERROR: {
    code: 0x002,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_DEVICE_ERROR: {
    code: 0x003,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_DEVICE_NOT_FOUND_ERROR: {
    code: 0x003,
    httpCode: 404,
    module: 'manage'
  },
  REMOVE_GROUP_ERROR: {
    code: 0x004,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_GROUP_NOT_FOUND_ERROR: {
    code: 0x003,
    httpCode: 404,
    module: 'manage'
  },
  REMOVE_SCHEDULE_ERROR: {
    code: 0x005,
    httpCode: 500,
    module: 'manage'
  },
  UPDATE_GROUP_ERROR: {
    code: 0x006,
    httpCode: 500,
    module: 'manage'
  },
  UPDATE_DEVICE_NAME_ERROR: {
    code: 0x007,
    module: 'manage'
  },
  UPDATE_GROUP_NAME_ERROR: {
    code: 0x008,
    module: 'manage'
  },
  UPDATE_NAME_DEVICE_NOT_FOUND_ERROR: {
    code: 0x009,
    module: 'manage'
  },
  UPDATE_NAME_GROUP_NOT_FOUND_ERROR: {
    code: 0x00a,
    module: 'manage'
  },
  START_DEVICE_SESSION_ERROR: {
    code: 0x00b,
    module: 'manage'
  },
  START_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x00b,
    module: 'manage'
  },
  STOP_DEVICE_SESSION_ERROR: {
    code: 0x00c,
    module: 'manage'
  },
  STOP_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x00c,
    module: 'manage'
  },
  INDEX_DEVICE_SESSION_ERROR: {
    code: 0x00d,
    module: 'manage'
  },
  INDEX_DEVICE_SESSION_NOT_FOUND_ERROR: {
    code: 0x00d,
    module: 'manage'
  },
  UPDATE_DEVICE_STATE_ERROR: {
    code: 0x00e,
    module: 'manage'
  },
  UPDATE_DEVICE_STATE_NOT_FOUND_ERROR: {
    code: 0x00f,
    module: 'manage'
  },
  REMOVE_HISTORIC_ERROR: {
    code: 0x010,
    module: 'manage'
  },
  REMOVE_HISTORIC_NOT_FOUND_ERROR: {
    code: 0x010,
    module: 'manage'
  },
  REMOVE_HISTORY_ERROR: {
    code: 0x011,
    module: 'manage'
  },
  REMOVE_HISTORY_NOT_FOUND_ERROR: {
    code: 0x011,
    module: 'manage'
  },
  REMOVE_GROUP_HISTORIC_ERROR: {
    code: 0x012,
    module: 'manage'
  },
  REMOVE_GROUP_HISTORIC_NOT_FOUND_ERROR: {
    code: 0x012,
    module: 'manage'
  },
  ADD_SCHEDULE_INVALID_ERROR: {
    code: 0x013,
    module: 'manage'
  },
  ADD_SCHEDULE_NOT_FOUND_ERROR: {
    code: 0x014,
    module: 'manage'
  },
  ADD_SCHEDULE_ERROR: {
    code: 0x015,
    module: 'manage'
  },
  REMOVE_SCHEDULE_RUNNING_ERROR: {
    code: 0x016,
    module: 'manage'
  },
  REMOVE_SCHEDULE_NOT_FOUND_ERROR: {
    code: 0x016,
    module: 'manage'
  },
  CREATE_GROUP_ERROR: {
    code: 0x017,
    module: 'manage'
  },
  ADD_DEVICE_TO_GROUP_ERROR: {
    code: 0x018,
    module: 'manage'
  },
  ADD_DEVICE_TO_GROUP_NOT_FOUND_ERROR: {
    code: 0x019,
    module: 'manage'
  },
  REMOVE_NOT_FOUND_ERROR: {
    code: 0x01a,
    module: 'manage'
  },
  REMOVE_DEVICE_FROM_GROUP_NOT_FOUND_ERROR: {
    code: 0x01b,
    module: 'manage'
  },
  REMOVE_DEVICE_FROM_GROUP_ERROR: {
    code: 0x01c,
    module: 'manage'
  },

  // Authentication errors
  UPDATE_DEVICE_FORBIDDEN: {
    code: 0x200,
    httpCode: 403,
    module: 'manage'
  },
  UPDATE_GROUP_FORBIDDEN: {
    code: 0x201,
    httpCode: 403,
    module: 'manage'
  },
  BACK_END_UNAUTHORIZED: {
    code: 0x202,
    module: 'manage'
  },

  // Wrong parameters
  UPDATE_DEVICE_WRONG_PARAMETERS: {
    code: 0x300,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_GROUP_WRONG_PARAMETERS: {
    code: 0x301,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_DEVICE_MISSING_PARAMETERS: {
    code: 0x302,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_GROUP_MISSING_PARAMETERS: {
    code: 0x303,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_NAME_WRONG_PARAMETERS: {
    code: 0x304,
    module: 'manage'
  },
  REMOVE_WRONG_PARAMETERS: {
    code: 0x305,
    module: 'manage'
  },
  UPDATE_DEVICE_STATE_WRONG_PARAMETERS: {
    code: 0x306,
    module: 'manage'
  },
  REMOVE_HISTORIC_WRONG_PARAMETERS: {
    code: 0x307,
    module: 'manage'
  },
  ADD_SCHEDULE_WRONG_PARAMETERS: {
    code: 0x308,
    module: 'manage'
  },
  START_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x309,
    module: 'manage'
  },
  STOP_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x30a,
    module: 'manage'
  },
  INDEX_DEVICE_SESSION_WRONG_PARAMETERS: {
    code: 0x30b,
    module: 'manage'
  },
  REMOVE_SCHEDULE_WRONG_PARAMETERS: {
    code: 0x30c,
    module: 'manage'
  },
  REMOVE_HISTORY_WRONG_PARAMETERS: {
    code: 0x30d,
    module: 'manage'
  },
  ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS: {
    code: 0x30e,
    module: 'manage'
  },
  REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS: {
    code: 0x30f,
    module: 'manage'
  },
  REMOVE_GROUP_WRONG_PARAMETERS: {
    code: 0x30e,
    module: 'manage'
  }
};
