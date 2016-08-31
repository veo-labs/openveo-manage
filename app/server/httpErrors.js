'use strict';

/**
 * The list of HTTP errors with, for each error, its associated hexadecimal code and HTTP return code.
 * HTTP errors are sent by {{#crossLinkModule "controllers"}}{{/crossLinkModule}}.
 *
 * @example
 *     var httpErrors = process.require("app/server/httpErrors.js");
 *     console.log(httpErrors.UNKNOWN_ERROR);
 *
 * @module http-errors
 * @main http-errors
 */
module.exports = {

  // General errors
  UNKNOWN_ERROR: {
    code: 0x000,
    httpCode: 500,
    module: 'manage'
  },
  PATH_NOT_FOUND: {
    code: 0x001,
    httpCode: 404,
    module: 'manage'
  },
  NOT_ALLOWED: {
    code: 0x002,
    httpCode: 403,
    module: 'manage'
  },
  GET_DEVICES_ERROR: {
    code: 0x003,
    httpCode: 500,
    module: 'manage'
  },
  UPDATE_DEVICE_ERROR: {
    code: 0x004,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_DEVICE_ERROR: {
    code: 0x005,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_GROUP_ERROR: {
    code: 0x006,
    httpCode: 500,
    module: 'manage'
  },
  ADD_HISTORY_ERROR: {
    code: 0x007,
    httpCode: 500,
    module: 'manage'
  },
  REMOVE_SCHEDULE_ERROR: {
    code: 0x008,
    httpCode: 500,
    module: 'manage'
  },

  // Authentication errors
  UPDATE_DEVICE_FORBIDDEN: {
    code: 0x200,
    httpCode: 403,
    module: 'manage'
  },
  UPDATE_HISTORY_FORBIDDEN: {
    code: 0x201,
    httpCode: 403,
    module: 'manage'
  },

  // Wrong parameters
  GET_DEVICES_WRONG_PARAMETERS: {
    code: 0x300,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_DEVICE_MISSING_PARAMETERS: {
    code: 0x301,
    httpCode: 400
  },
  UPDATE_DEVICE_WRONG_PARAMETERS: {
    code: 0x302,
    httpCode: 400,
    module: 'manage'
  },
  ADD_HISTORY_MISSING_PARAMETERS: {
    code: 0x303,
    httpCode: 400,
    module: 'manage'
  },
  ADD_SCHEDULE_MISSING_PARAMETERS: {
    code: 0x304,
    httpCode: 400,
    module: 'manage'
  },
  UPDATE_SCHEDULE_MISSING_PARAMETERS: {
    code: 0x305,
    httpCode: 400,
    module: 'manage'
  },
  REMOVE_SCHEDULE_MISSING_PARAMETERS: {
    code: 0x306,
    httpCode: 400,
    module: 'manage'
  },
};
