'use strict';

/**
 * @module manage
 */

/**
 * Defines the list of socket messages sent by browsers.
 *
 * @class BROWSERS_MESSAGES
 * @static
 */

var BROWSERS_MESSAGES = {

  /**
   * A socket connection has been established with the browser.
   *
   * @property CONNECTED
   * @type String
   * @default 'connection'
   * @final
   */
  CONNECTED: 'connection',

  /**
   * Browser asks for the modification of a manageable's name.
   *
   * @property UPDATE_NAME
   * @type String
   * @default 'updateName'
   * @final
   */
  UPDATE_NAME: 'updateName',

  /**
   * Browser asks to remove a manageable.
   *
   * @property REMOVE
   * @type String
   * @default 'remove'
   * @final
   */
  REMOVE: 'remove',

  /**
   * Browser asks to remove a manageable's historic.
   *
   * @property REMOVE_HISTORIC
   * @type String
   * @default 'removeHistoric'
   * @final
   */
  REMOVE_HISTORIC: 'removeHistoric',

  /**
   * Browser asks to add a schedule to a manageable.
   *
   * @property ADD_SCHEDULE
   * @type String
   * @default 'addSchedule'
   * @final
   */
  ADD_SCHEDULE: 'addSchedule',

  /**
   * Browser asks to remove a schedule from a manageable.
   *
   * @property REMOVE_SCHEDULE
   * @type String
   * @default 'removeSchedule'
   * @final
   */
  REMOVE_SCHEDULE: 'removeSchedule',

  /**
   * Browser asks to remove the whole history from a manageable.
   *
   * @property REMOVE_HISTORY
   * @type String
   * @default 'removeHistory'
   * @final
   */
  REMOVE_HISTORY: 'removeHistory',

  /**
   * Browser asks the list of devices.
   *
   * @property GET_DEVICES
   * @type String
   * @default 'devices'
   * @final
   */
  GET_DEVICES: 'devices',

  /**
   * Browser asks devices' settings.
   *
   * @property GET_DEVICE_SETTINGS
   * @type String
   * @default 'devices.settings'
   * @final
   */
  GET_DEVICE_SETTINGS: 'device.settings',

  /**
   * Browser asks a device's state.
   *
   * @property UPDATE_DEVICE_STATE
   * @type String
   * @default 'devices.updateState'
   * @final
   */
  UPDATE_DEVICE_STATE: 'device.updateState',

  /**
   * Browser asks devices' to start a recording session.
   *
   * @property START_DEVICE_SESSION
   * @type String
   * @default 'devices.startSession'
   * @final
   */
  START_DEVICE_SESSION: 'device.startSession',

  /**
   * Browser asks devices' to stop a recording session.
   *
   * @property STOP_DEVICE_SESSION
   * @type String
   * @default 'devices.stopSession'
   * @final
   */
  STOP_DEVICE_SESSION: 'device.stopSession',

  /**
   * Browser asks devices' to index a recording session.
   *
   * @property INDEX_DEVICE_SESSION
   * @type String
   * @default 'devices.indexSession'
   * @final
   */
  INDEX_DEVICE_SESSION: 'device.indexSession',

  /**
   * Browser asks the list of groups.
   *
   * @property GET_GROUPS
   * @type String
   * @default 'groups'
   * @final
   */
  GET_GROUPS: 'groups',

  /**
   * Browser asks to create a new group.
   *
   * @property CREATE_GROUP
   * @type String
   * @default 'group.create'
   * @final
   */
  CREATE_GROUP: 'group.create',

  /**
   * Browser asks to add a device to a group.
   *
   * @property ADD_DEVICE_TO_GROUP
   * @type String
   * @default 'group.addDevice'
   * @final
   */
  ADD_DEVICE_TO_GROUP: 'group.addDevice',

  /**
   * Browser asks to remove a device from a group.
   *
   * @property REMOVE_DEVICE_FROM_GROUP
   * @type String
   * @default 'group.removeDevice'
   * @final
   */
  REMOVE_DEVICE_FROM_GROUP: 'group.removeDevice',

  /**
   * Socket connection with a browser has been lost.
   *
   * @property DISCONNECTED
   * @type String
   * @default 'disconnect'
   * @final
   */
  DISCONNECTED: 'disconnect',

  /**
   * Socket connection with a browser encountered an error.
   *
   * @property ERROR
   * @type String
   * @default 'error'
   * @final
   */
  ERROR: 'error'

};

Object.freeze(BROWSERS_MESSAGES);
module.exports = BROWSERS_MESSAGES;
