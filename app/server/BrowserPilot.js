'use strict';

/**
 * @module manage
 */

var util = require('util');
var openVeoApi = require('@openveo/api');
var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var Pilot = openVeoApi.socket.Pilot;

/**
 * BrowserPilot singleton.
 *
 * @property pilot
 * @type BrowserPilot
 * @private
 */
var pilot = null;

/**
 * Fired when a browser requests a name modification on a manageable.
 *
 * @event UPDATE_NAME
 * @param {String} id The manageable's id
 * @param {String} name The new manageable name
 * @param {String} type The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a manageable to be removed.
 *
 * @event REMOVE
 * @param {String} id The manageable's id
 * @param {String} type The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a schedule to be added to a manageable.
 *
 * @event ADD_SCHEDULE
 * @param {String} manageableId The manageable's id
 * @param {Object} schedule The schedule
 * @param {String} manageableType The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a schedule to be removed from a manageable.
 *
 * @event REMOVE_SCHEDULE
 * @param {String} manageableId The manageable's id
 * @param {String} scheduleId The schedule's id
 * @param {String} manageableType The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests an historic to be removed from a manageable.
 *
 * @event REMOVE_HISTORIC
 * @param {String} manageableId The manageable's id
 * @param {String} historicId The historic id
 * @param {String} manageableType The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests a manageable's history to be purged.
 *
 * @event REMOVE_HISTORY
 * @param {String} id The manageable's id
 * @param {Object} type The manageable's type
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when something went wrong on the connection with a browser.
 *
 * @event ERROR
 * @param {String} id The id of the browser's socket
 * @param {Error} error The socket.io error
 */

/**
 * Fired when a browser requests the list of devices.
 *
 * @event GET_DEVICES
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests an update for one or several devices settings.
 *
 * @event GET_DEVICE_SETTINGS
 * @param {Array} ids The list of outdated devices
 */

/**
 * Fired when a browser requests a state modification on a device.
 *
 * @event UPDATE_DEVICE_STATE
 * @param {String} id The device id
 * @param {String} state The new device state
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to start a recording session.
 *
 * @event START_DEVICE_SESSION
 * @param {Array} ids The list of devices ids on which a new recording session must be started
 * @param {String} [recordId] The id of the recording session to start
 * @param {String} [presetId] The id of the preset for the recording session
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to stop a recording session.
 *
 * @event STOP_DEVICE_SESSION
 * @param {Array} ids The list of devices ids on which a current recording session must be stopped
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests one or several devices to add a tag to the recording session.
 *
 * @event INDEX_DEVICE_SESSION
 * @param {Array} ids The list of devices ids on which a current recording session must be tagged
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests the list of groups.
 *
 * @event GET_GROUPS
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests creation of a new group.
 *
 * @event CREATE_GROUP
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests to add a device to a group.
 *
 * @event ADD_DEVICE_TO_GROUP
 * @param {deviceId} deviceId The device id
 * @param {groupId} groupId The group id
 * @param {Function} callback The function to respond to the browser
 */

/**
 * Fired when a browser requests to remove a device from a group.
 *
 * @event REMOVE_DEVICE_FROM_GROUP
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
 */
function BrowserPilot(browsersEmitter, namespace) {
  var self = this;
  BrowserPilot.super_.call(this, browsersEmitter, namespace);

  Object.defineProperties(this, {

    /**
     * Available browsers' messages fired by the pilot.
     *
     * @property MESSAGES
     * @type Object
     * @final
     */
    MESSAGES: {value: BROWSERS_MESSAGES}

  });

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
 * @method get
 * @param {AdvancedEmitter} browsersEmitter The browsers' emitter
 * @param {SocketNamespace} namespace The socket browsers' namespace
 * @return {BrowserPilot} The browser's pilot
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
 * @method connect
 * @param {Object} device The new device
 */
BrowserPilot.prototype.connectDevice = function(device) {
  process.logger.debug('Say "device.connected" to browsers', {data: device});
  this.namespace.emit('device.connected', device);
};

/**
 * Informs connected browsers about a manageable's removal.
 *
 * @method remove
 * @param {Manageable} manageable The manageable
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
 * @method update
 * @param {Manageable} manageable The manageable to update
 * @param {String} manageable.id The manageable's id
 * @param {String} manageable.type The manageable's type
 * @param {String} key The manageable property to update
 * @param {Mixed} value The new property value
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
 * @method addSchedule
 * @param {Manageable} manageable The manageable
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
 * @method removeSchedule
 * @param {Manageable} manageable The manageable
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
 * @method addHistoric
 * @param {Manageable} manageable The manageable
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
 * @method removeHistoric
 * @param {Manageable} manageable The manageable
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
 * @method removeHistory
 * @param {Manageable} manageable The manageable
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
 * @method updateDeviceState
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
 * @method createGroup
 * @param {Group} group The new group
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
 * @method addDeviceToGroup
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
 * @method removeDeviceFromGroup
 * @param {Number} id The device id
 */
BrowserPilot.prototype.removeDeviceFromGroup = function(id) {
  var data = {
    id: id
  };
  process.logger.debug('Say "group.removedDevice" to browsers', {data: data});
  this.namespace.emit('group.removedDevice', data);
};
