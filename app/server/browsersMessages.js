'use strict';

/**
 * @module manage/browsersMessages
 */

/**
 * Defines the list of socket messages sent by browsers.
 *
 * @namespace
 */

var BROWSERS_MESSAGES = {

  /**
   * A socket connection has been established with the browser.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  CONNECTED: 'connection',

  /**
   * Browser asks for the modification of a manageable's name.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  UPDATE_NAME: 'updateName',

  /**
   * Browser asks to remove a manageable.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  REMOVE: 'remove',

  /**
   * Browser asks to remove a manageable's historic.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  REMOVE_HISTORIC: 'removeHistoric',

  /**
   * Browser asks to add a schedule to a manageable.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  ADD_SCHEDULE: 'addSchedule',

  /**
   * Browser asks to remove a schedule from a manageable.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  REMOVE_SCHEDULE: 'removeSchedule',

  /**
   * Browser asks to remove the whole history from a manageable.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  REMOVE_HISTORY: 'removeHistory',

  /**
   * Browser asks the list of devices.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  GET_DEVICES: 'devices',

  /**
   * Browser asks devices' settings.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  GET_DEVICE_SETTINGS: 'device.settings',

  /**
   * Browser asks a device's state.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  UPDATE_DEVICE_STATE: 'device.updateState',

  /**
   * Browser asks devices' to start a recording session.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  START_DEVICE_SESSION: 'device.startSession',

  /**
   * Browser asks devices' to stop a recording session.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  STOP_DEVICE_SESSION: 'device.stopSession',

  /**
   * Browser asks devices' to index a recording session.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  INDEX_DEVICE_SESSION: 'device.indexSession',

  /**
   * Browser asks the list of groups.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  GET_GROUPS: 'groups',

  /**
   * Browser asks to create a new group.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  CREATE_GROUP: 'group.create',

  /**
   * Browser asks to add a device to a group.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  ADD_DEVICE_TO_GROUP: 'group.addDevice',

  /**
   * Browser asks to remove a device from a group.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  REMOVE_DEVICE_FROM_GROUP: 'group.removeDevice',

  /**
   * Socket connection with a browser has been lost.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  DISCONNECTED: 'disconnect',

  /**
   * Socket connection with a browser encountered an error.
   *
   * @const
   * @type String
   * @default
   * @inner
   */
  ERROR: 'error'

};

Object.freeze(BROWSERS_MESSAGES);
module.exports = BROWSERS_MESSAGES;
