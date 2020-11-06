'use strict';

/**
 * @module controllers
 */

var util = require('util');
var openVeoApi = require('@openveo/api');
var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');
var ERRORS = process.requireManage('app/server/errors.js');
var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var SocketController = openVeoApi.controllers.SocketController;
var AdvancedEvent = openVeoApi.emitters.AdvancedEvent;

/**
 * Defines a BrowserSocketController to Handle messages sent by browsers through socket namespace.
 *
 * @class BrowserSocketController
 * @extends SocketController
 * @constructor
 * @param {SocketNamespace} namespace The browser's namespace
 */
function BrowserSocketController(namespace) {
  BrowserSocketController.super_.call(this, namespace);

  Object.defineProperties(this, {

    /**
     * The browsers' pilot.
     *
     * @property pilot
     * @type BrowserPilot
     * @final
     */
    pilot: {value: BrowserPilot.get(this.emitter, this.namespace)}

  });
}

module.exports = BrowserSocketController;
util.inherits(BrowserSocketController, SocketController);

/**
 * Handles message informing about a browser requesting a device's name update.
 *
 * @method updateNameAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {String} data.name The new manageable's name
 * @param {String} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.updateNameAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.UPDATE_NAME, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      name: {type: 'string', required: true},
      type: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.UPDATE_NAME});
    return callback({
      error: ERRORS.UPDATE_NAME_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.UPDATE_NAME, data.id, data.name, data.type, callback)
  );
};

/**
 * Handles message informing about a browser requesting a manageable's to be removed.
 *
 * @method removeAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {String} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.removeAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.REMOVE, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      type: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.REMOVE});
    return callback({
      error: ERRORS.REMOVE_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.REMOVE, data.id, data.type, callback));
};

/**
 * Handles message informing about a browser requesting a manageable's historic to be removed.
 *
 * @method removeHistoricAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {String} data.historicId The historic id
 * @param {String} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.removeHistoricAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.REMOVE_HISTORIC, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      historicId: {type: 'string', required: true},
      type: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.REMOVE_HISTORIC});
    return callback({
      error: ERRORS.REMOVE_HISTORIC_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.REMOVE_HISTORIC, data.id, data.historicId, data.type, callback)
  );
};

/**
 * Handles message informing about a browser requesting a schedule to be added to a manageable.
 *
 * @method addScheduleAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {Object} data.schedule The schedule
 * @param {String} data.schedule.name The name of the record
 * @param {Date|String} data.schedule.beginDate The begin date, can be either a date or a date literal
 * @param {Number} data.schedule.duration The duration of the record (in ms)
 * @param {String} data.schedule.preset The id of the record
 * @param {Date|String} [data.schedule.endDate] The end date, can be either a date or a date literal
 * @param {Boolean} [data.schedule.recurrent=false] true to execute the schedule every day
 * @param {Object} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.addScheduleAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.ADD_SCHEDULE, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      schedule: {type: 'object', required: true},
      type: {type: 'string', required: true}
    });

    // duration should be lesser than 24 hours
    data.schedule = openVeoApi.util.shallowValidateObject(data.schedule, {
      name: {type: 'string'},
      beginDate: {type: 'date', required: true, gt: new Date()},
      duration: {type: 'number', required: true, lt: 86400000},
      preset: {type: 'string', required: true},
      endDate: {type: 'date', gt: new Date(data.schedule.beginDate)},
      recurrent: {type: 'boolean', default: false}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.ADD_SCHEDULE});
    return callback({
      error: ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS
    });
  }

  // Transform timestamp into JavaScript Date objects
  if (data.schedule.endDate) {
    data.schedule.endDate = new Date(data.schedule.endDate);
    data.schedule.endDate.setSeconds(0);
  }

  data.schedule.beginDate = new Date(data.schedule.beginDate);
  data.schedule.beginDate.setSeconds(0);

  // If daily end time occurs when scheduling is running, set the daily end time to one second later
  if (data.schedule.recurrent && data.schedule.endDate) {
    var beginDateEndTime = new Date(data.schedule.beginDate.getTime() + data.schedule.duration);

    if (beginDateEndTime >= data.schedule.endDate)
      data.schedule.endDate = new Date(beginDateEndTime.getTime() + 1000);
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.ADD_SCHEDULE, data.id, data.schedule, data.type, callback)
  );
};

/**
 * Handles message informing about a browser requesting a schedule to be removed from a manageable.
 *
 * @method removeScheduleAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {String} data.scheduleId The schedule id
 * @param {String} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.removeScheduleAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.REMOVE_SCHEDULE, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      scheduleId: {type: 'string', required: true},
      type: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.REMOVE_SCHEDULE});
    return callback({
      error: ERRORS.REMOVE_SCHEDULE_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.REMOVE_SCHEDULE, data.id, data.scheduleId, data.type, callback)
  );
};

/**
 * Handles message informing about a browser requesting manageable's history to be purged.
 *
 * @method removeHistoryAction
 * @param {Object} data Message's datas
 * @param {String} data.id The manageable id
 * @param {String} data.type The manageable's type
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.removeHistoryAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.REMOVE_HISTORY, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      type: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.REMOVE_HISTORY});
    return callback({
      error: ERRORS.REMOVE_HISTORY_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.REMOVE_HISTORY, data.id, data.type, callback));
};

/**
 * Handles message informing about a browser requesting the list of devices.
 *
 * @method getDevicesAction
 * @param {Null} data Nothing
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.getDevicesAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.GET_DEVICES);
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.GET_DEVICES, callback));
};

/**
 * Handles message informing about a browser requesting one or several devices' settings.
 *
 * @method getDeviceSettingsAction
 * @param {Object} data Message's datas
 * @param {Array} data.ids The list of devices ids which need settings information
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.getDeviceSettingsAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      ids: {type: 'array<string>', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.GET_DEVICE_SETTINGS});
    return callback({
      error: ERRORS.GET_DEVICE_SETTINGS_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, data.ids, callback));
};

/**
 * Handles message informing about a browser requesting a device state update.
 *
 * @method updateDeviceStateAction
 * @param {Object} data Message's datas
 * @param {String} data.id The device id
 * @param {String} data.state The new device state
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.updateDeviceStateAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true},
      state: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.UPDATE_DEVICE_STATE});
    return callback({
      error: ERRORS.UPDATE_DEVICE_STATE_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, data.id, data.state, callback)
  );
};

/**
 * Handles message informing about a browser requesting one or several devices to start a new recording session.
 *
 * @method startDeviceSessionAction
 * @param {Object} data Message's datas
 * @param {Array} data.ids The list of devices ids on which a new recording session must be started
 * @param {String} [data.presetId] The id of the preset for the recording session
 * @param {String} [data.name] The name of the recording session
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.startDeviceSessionAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.START_DEVICE_SESSION, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      ids: {type: 'array<string>', required: true},
      presetId: {type: 'string', required: true},
      name: {type: 'string'}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.START_DEVICE_SESSION});
    return callback({
      error: ERRORS.START_DEVICE_SESSION_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.START_DEVICE_SESSION, data.ids, data.presetId, data.name, callback)
  );
};

/**
 * Handles message informing about a browser requesting one or several devices to stop a recording session.
 *
 * @method stopDeviceSessionAction
 * @param {Object} data Message's datas
 * @param {Array} data.ids The list of devices ids on which a new recording session must be stopped
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.stopDeviceSessionAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.STOP_DEVICE_SESSION, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      ids: {type: 'array<string>', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.STOP_DEVICE_SESSION});
    return callback({
      error: ERRORS.STOP_DEVICE_SESSION_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.STOP_DEVICE_SESSION, data.ids, callback));
};

/**
 * Handles message informing about a browser requesting one or several devices to tag their current recording sessions.
 *
 * @method indexDeviceSessionAction
 * @param {Object} data Message's datas
 * @param {Array} data.ids The list of devices ids on which a current recording session must be tagged
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.indexDeviceSessionAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      ids: {type: 'array<string>', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.INDEX_DEVICE_SESSION});
    return callback({
      error: ERRORS.INDEX_DEVICE_SESSION_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, data.ids, callback));
};

/**
 * Handles message informing about a browser requesting the list of groups.
 *
 * @method getGroupsAction
 * @param {Null} data Nothing
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.getGroupsAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.GET_GROUPS);
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.GET_GROUPS, callback));
};

/**
 * Handles message informing about a browser requesting the creation of a new group.
 *
 * @method createGroupAction
 * @param {Null} data Nothing
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.createGroupAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.CREATE_GROUP);
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.CREATE_GROUP, callback));
};

/**
 * Handles message informing about a browser requesting a device to be added to a group.
 *
 * @method addDeviceToGroupAction
 * @param {Object} data Message's datas
 * @param {String} data.deviceId The device id
 * @param {String} data.groupId The group id
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.addDeviceToGroupAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      deviceId: {type: 'string', required: true},
      groupId: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP});
    return callback({
      error: ERRORS.ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(
    new AdvancedEvent(BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, data.deviceId, data.groupId, callback)
  );
};

/**
 * Handles message informing about a browser requesting a device to be removed from its group.
 *
 * @method removeDeviceFromGroupAction
 * @param {Object} data Message's datas
 * @param {String} data.id The id of the device
 * @param {Socket} socket The opened socket
 * @param {Function} callback The callback to respond to the browser
 */
BrowserSocketController.prototype.removeDeviceFromGroupAction = function(data, socket, callback) {
  process.logger.debug('Browser says : ' + BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, {data: data});

  // Validate data
  try {
    data = openVeoApi.util.shallowValidateObject(data, {
      id: {type: 'string', required: true}
    });
  } catch (error) {
    process.logger.warn(error.message, {error: error, event: BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP});
    return callback({
      error: ERRORS.REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS
    });
  }

  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, data.id, callback));
};

/**
 * Handles socket's connection.
 *
 * Socket's connection has been established with a browser.
 *
 * @method connectAction
 * @param {Socket} socket The socket
 */
BrowserSocketController.prototype.connectAction = function(socket) {
  process.logger.info('Browser connected', {socketId: socket.id});
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.CONNECTED, socket));
};

/**
 * Handles socket's disconnection.
 *
 * Connection with a browser has been lost.
 *
 * @method disconnectAction
 * @param {Socket} socket The socket
 */
BrowserSocketController.prototype.disconnectAction = function(socket) {
  process.logger.info('Browser disconnected', {socketId: socket.id});
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.DISCONNECTED, socket));
};

/**
 * Handles socket's connection errors.
 *
 * An error occurred on socket's communication.
 *
 * @method errorAction
 * @param {Error} error The error
 * @param {Socket} socket The socket
 */
BrowserSocketController.prototype.errorAction = function(error, socket) {
  process.logger.error('Error in browser communication', {socketId: socket.id, error: error});
  this.emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.ERROR, error, socket));
};
