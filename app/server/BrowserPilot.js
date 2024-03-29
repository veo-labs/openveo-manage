'use strict';

/**
 * @module manage/BrowserPilot
 */

var util = require('util');
var openVeoApi = require('@openveo/api');
var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var Pilot = openVeoApi.socket.Pilot;

/**
 * BrowserPilot singleton.
 *
 * @memberof module:manage/BrowserPilot~BrowserPilot
 * @member {module:manage/BrowserPilot~BrowserPilot}
 * @private
 * @const
 */
var pilot = null;

/**
 * Fired when a browser requests a name modification on a manageable.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#UPDATE_NAME
 * @property {String} id The manageable's id
 * @property {String} name The new manageable name
 * @property {String} type The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a manageable to be removed.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#REMOVE
 * @property {String} id The manageable's id
 * @property {String} type The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a schedule to be added to a manageable.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#ADD_SCHEDULE
 * @property {String} manageableId The manageable's id
 * @property {Object} schedule The schedule
 * @property {String} manageableType The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a schedule to be removed from a manageable.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#REMOVE_SCHEDULE
 * @property {String} manageableId The manageable's id
 * @property {String} scheduleId The schedule's id
 * @property {String} manageableType The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests an historic to be removed from a manageable.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#REMOVE_HISTORIC
 * @property {String} manageableId The manageable's id
 * @property {String} historicId The historic id
 * @property {String} manageableType The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a manageable's history to be purged.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#REMOVE_HISTORY
 * @property {String} id The manageable's id
 * @property {Object} type The manageable's type
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when something went wrong on the connection with a browser.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#ERROR
 * @property {String} id The id of the browser's socket
 * @property {Error} error The socket.io error
 */

/**
 * Fired when a browser requests the list of devices.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#GET_DEVICES
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests an update for one or several devices settings.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#GET_DEVICES_SETTINGS
 * @property {Array} ids The list of outdated devices
 */

/**
 * Fired when a browser requests a state modification on a device.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#UPDATE_DEVICE_STATE
 * @property {String} id The device id
 * @property {String} state The new device state
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to start a recording session.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#START_DEVICE_SESSION
 * @property {Array} ids The list of devices ids on which a new recording session must be started
 * @property {String} [recordId] The id of the recording session to start
 * @property {String} [presetId] The id of the preset for the recording session
 * @property {String} [name] The name of the recording session
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to stop a recording session.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#STOP_DEVICE_SESSION
 * @property {Array} ids The list of devices ids on which a current recording session must be stopped
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to add a tag to the recording session.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#INDEX_DEVICE_SESSION
 * @property {Array} ids The list of devices ids on which a current recording session must be tagged
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests the list of groups.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#GET_GROUPS
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests creation of a new group.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#CREATE_GROUP
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests to add a device to a group.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#ADD_DEVICE_TO_GROUP
 * @property {deviceId} deviceId The device id
 * @property {groupId} groupId The group id
 * @property {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests to remove a device from a group.
 *
 * @event module:manage/BrowserPilot~BrowserPilot#REMOVE_DEVICE_FROM_GROUP
 * @param {deviceId} deviceId The device id
 * @param {groupId} groupId The group id
 */

/**
 * Defines Browser's pilot.
 *
 * A BrowserPilot interacts with browsers.
 * It emits events received by the browsers and offers methods to control the browsers.
 *
 * @class BrowserPilot
 * @constructor
 * @param {AdvancedEmitter} browsersEmitter The browsers' emitter
 * @param {SocketNamespace} namespace The socket browsers' namespace
 * @see {@link https://github.com/veo-labs/openveo-api|OpenVeo API documentation} for more information about
 * AdvancedEmitter and SocketNamespace
 */
function BrowserPilot(browsersEmitter, namespace) {
  var self = this;
  BrowserPilot.super_.call(this, browsersEmitter, namespace);

  Object.defineProperties(this,

    /** @lends module:manage/BrowserPilot~BrowserPilot */
    {

      /**
       * Available browsers' messages fired by the pilot.
       *
       * @type {Object}
       * @instance
       * @readonly
       */
      MESSAGES: {value: BROWSERS_MESSAGES}

    }

  );

  // Listen to browser's update name message to update a device's name
  this.clientEmitter.on(BROWSERS_MESSAGES.CONNECTED, function(eventName, socket) {
    self.addClient(socket.id, socket);
    self.emit(BROWSERS_MESSAGES.CONNECTED, socket.id);
  });

  // Listen to device's disconnection
  this.clientEmitter.on(BROWSERS_MESSAGES.DISCONNECTED, function(eventName, socket) {
    var client = self.removeClientBySocketId(socket.id);

    if (client)
      self.emit(BROWSERS_MESSAGES.DISCONNECTED, client.id);
  });

  // Listen to device's connection errors
  this.clientEmitter.on(BROWSERS_MESSAGES.ERROR, function(eventName, error, socket) {
    var client = self.getClientBySocketId(socket.id);

    if (client)
      self.emit(BROWSERS_MESSAGES.ERROR, error, client.id);
  });

  this.clientEmitter.on(BROWSERS_MESSAGES.UPDATE_NAME, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.REMOVE, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.REMOVE_HISTORIC, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.REMOVE_SCHEDULE, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.REMOVE_HISTORY, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.GET_DEVICES, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.START_DEVICE_SESSION, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.STOP_DEVICE_SESSION, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.GET_GROUPS, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.CREATE_GROUP, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, Pilot.prototype.emitMessageAsIs.bind(this));
  this.clientEmitter.on(BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, Pilot.prototype.emitMessageAsIs.bind(this));
}

module.exports = BrowserPilot;
util.inherits(BrowserPilot, openVeoApi.socket.Pilot);

/**
 * Gets BrowserPilot singleton.
 *
 * @param {AdvancedEmitter} browsersEmitter The browsers' emitter
 * @param {SocketNamespace} namespace The socket browsers' namespace
 * @return {module:manage/BrowserPilot~BrowserPilot} The browser's pilot
 */
BrowserPilot.get = function(browsersEmitter, namespace) {
  if (!pilot &&
      browsersEmitter instanceof openVeoApi.emitters.AdvancedEmitter &&
      namespace instanceof openVeoApi.socket.SocketNamespace
  ) {
    pilot = new BrowserPilot(browsersEmitter, namespace);
  }

  return pilot;
};

/**
 * Informs connected browsers about a new connected device.
 *
 * @param {Object} device The new device
 */
BrowserPilot.prototype.connectDevice = function(device) {
  process.logger.debug('Say "device.connected" to browsers', {data: device});
  this.namespace.emit('device.connected', device);
};

/**
 * Informs connected browsers about a manageable's removal.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 */
BrowserPilot.prototype.remove = function(manageable) {
  var data = {
    id: manageable.id,
    type: manageable.type
  };
  process.logger.debug('Say "removed" to browsers', {data: data});
  this.namespace.emit('removed', data);
};

/**
 * Informs connected browsers about an update on a manageable's property.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable to update
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {String} key The manageable property to update
 * @param {*} value The new property value
 */
BrowserPilot.prototype.update = function(manageable, key, value) {
  var data = {
    key: key,
    value: value,
    type: manageable.type,
    id: manageable.id
  };
  process.logger.debug('Say "updated" to browsers', {data: data});
  this.namespace.emit('updated', data);
};

/**
 * Informs connected browsers that a new schedule has been added to a manageable.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {Object} schedule The new schedule
 */
BrowserPilot.prototype.addSchedule = function(manageable, schedule) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    schedule: schedule
  };
  process.logger.debug('Say "newSchedule" to browsers', {data: data});
  this.namespace.emit('newSchedule', data);
};

/**
 * Informs connected browsers that a manageable's schedule has been removed.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {String} scheduleId The schedule's id
 */
BrowserPilot.prototype.removeSchedule = function(manageable, scheduleId) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    scheduleId: scheduleId
  };
  process.logger.debug('Say "removedSchedule" to browsers', {data: data});
  this.namespace.emit('removedSchedule', data);
};

/**
 * Informs connected browsers that an historic has been added to a manageable's history.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {Object} historic The new historic
 */
BrowserPilot.prototype.addHistoric = function(manageable, historic) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    historic: historic
  };
  process.logger.debug('Say "newHistoric" to browsers', {data: data});
  this.namespace.emit('newHistoric', data);
};

/**
 * Informs connected browsers that an historic has been removed from a manageable's history.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {String} historicId The historic id
 */
BrowserPilot.prototype.removeHistoric = function(manageable, historicId) {
  var data = {
    id: manageable.id,
    type: manageable.type,
    historicId: historicId
  };
  process.logger.debug('Say "removedHistoric" to browsers', {data: data});
  this.namespace.emit('removedHistoric', data);
};

/**
 * Informs connected browsers that history of a manageable has been purged.
 *
 * @param {module:manage/manageables/Manageable~Manageable} manageable The manageable
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 */
BrowserPilot.prototype.removeHistory = function(manageable) {
  var data = {
    id: manageable.id,
    type: manageable.type
  };
  process.logger.debug('Say "removedHistory" to browsers', {data: data});
  this.namespace.emit('removedHistory', data);
};

/**
 * Informs connected browsers that a device's state has changed.
 *
 * @param {String} id The device id
 * @param {String} newState The new device state
 */
BrowserPilot.prototype.updateDeviceState = function(id, newState) {
  var data = {
    id: id,
    state: newState
  };
  process.logger.debug('Say "device.updatedState" to browsers', {data: data});
  this.namespace.emit('device.updatedState', data);
};

/**
 * Informs connected browsers that a new group has been created.
 *
 * @param {module:manage/manageables/Group~Group} group The new group
 */
BrowserPilot.prototype.createGroup = function(group) {
  var data = {
    group: group
  };
  process.logger.debug('Say "group.created" to browsers', {data: data});
  this.namespace.emit('group.created', data);
};

/**
 * Informs connected browsers that a new device has been added to a group.
 *
 * @param {String} deviceId The device id
 * @param {String} groupId The group id
 */
BrowserPilot.prototype.addDeviceToGroup = function(deviceId, groupId) {
  var data = {
    deviceId: deviceId,
    groupId: groupId
  };
  process.logger.debug('Say "group.addDevice" to browsers', {data: data});
  this.namespace.emit('group.newDevice', data);
};

/**
 * Informs connected browsers that a device has been removed from a group.
 *
 * @param {Number} id The device id
 */
BrowserPilot.prototype.removeDeviceFromGroup = function(id) {
  var data = {
    id: id
  };
  process.logger.debug('Say "group.removedDevice" to browsers', {data: data});
  this.namespace.emit('group.removedDevice', data);
};
