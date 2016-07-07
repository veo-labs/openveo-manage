'use strict';

/**
 * Define the SocketManager which manage connexions between
 * clients and devices
 */
var util = require('util');
var events = require('events');
var socket = require('socket.io');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var DeviceListener = process.requireManage('app/server/eventListeners/DeviceListener');
var ClientListener = process.requireManage('app/server/eventListeners/ClientListener');

/**
 * Defines a custom error with an error code.
 *
 * @class SocketError
 * @constructor
 * @extends Error
 * @param {String} message The error message
 * @param {String} code The error code
 */
function SocketError(message, code) {
  this.name = 'SocketError';
  this.message = message || '';
  this.code = code;
}

util.inherits(SocketError, Error);

/**
 * Initialize a socket.io connexions between client and devices
 *
 * @class SocketProvider
 * @constructor
 * @param {namespace} namespace The namespace for the socket device
 */
function SocketProvider(namespace) {

  /**
   * Start a socket.io server on port 3002
   *
   * @property io
   * @type Object
   */
  this.io = socket('3002');

  /**
   * The client socket
   *
   * @property ioClient
   * @type Object
   */
  this.ioClient = this.io.of('/client');

  /**
   * The device socket
   *
   * @property ioDevice
   * @type Object
   */
  this.ioDevice = this.io.of(namespace);

  /**
   * Device model
   *
   * @property deviceModel
   * @type DeviceModel
   */
  this.deviceModel = new DeviceModel();

  /**
   * devices connected
   *
   * @property devices
   * @type Array
   */
  this.devices = [];

  /**
   * The device listener
   *
   * @property deviceListener
   * @type DeviceListener
   */
  this.deviceListener = new DeviceListener(this.ioDevice, this.ioClient, this.deviceModel);

  /**
   * The client listener
   *
   * @property clientListener
   * @type ClientListener
   */
  this.clientListener = new ClientListener(this.ioDevice, this.ioClient, this.deviceModel);
}

util.inherits(SocketProvider, events.EventEmitter);
module.exports = SocketProvider;

/**
 * Retrieve a device index with its socket id
 *
 * @method findDeviceIndex
 * @private
 * @param socketId
 * @returns {Object | undefined}
 */
function findDeviceIndex(socketId) {
  var self = this;

  return self.devices.findIndex(function(value) {
    return value.socketId == socketId;
  });
}

/**
 * Store a new device in-memory
 *
 * @method addDevice
 * @private
 * @param socketId
 * @param device
 */
function addDevice(socketId, device) {
  var index = findDeviceIndex.call(this, socketId);

  if (index === -1) {
    this.devices.push({
      socketId: socketId,
      device: device
    });
  }
}

/**
 * Set the name of a device
 *
 * @method setDeviceName
 * @param socketId
 * @param name
 */
function setDeviceName(socketId, name) {
  var index = findDeviceIndex.call(this, socketId);

  if (index >= 0) {
    this.devices[index].device.name = name;
  }
}

/**
 * Remove an in-memory stored device when a device is disconnected
 *
 * @method removeDevice
 * @private
 * @param socketId
 */
function removeDevice(socketId) {
  var index = findDeviceIndex.call(this, socketId);

  if (index >= 0) {
    this.devices.splice(index, 1);
  }
}

/**
 * Initialize a socket.io client connexion
 *
 * @method clientConnect
 * @private
 */
function clientConnect() {

  // var self = this;

  this.ioClient.on('connection', function(socket) {

    /* socket.on('storage', function(data) {
      console.log(self.devices);
      self.clientListener.storage(data, self.devices);
    });*/
  });
}

/**
 * Initialize a socket.io device connexion
 *
 * @method deviceConnect
 * @private
 */
function deviceConnect() {

  var self = this;

  // Connected clients
  // console.log(Object.keys(self.ioClient.sockets).length);

  this.ioDevice.on('connection', function(socket) {

    // Event on device start
    socket.on('hello', function(data) {
      self.deviceListener.hello(data, function(error, device) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else {
          addDevice.call(self, socket.id, device);

          // Asks for device name
          socket.emit('get', 'settings.name');
        }
      });
    });

    // Listen device name
    socket.on('settings.name', function(data) {
      var index = findDeviceIndex.call(self, socket.id),
        device = self.devices[index].device;

      self.deviceListener.settingsName(data, device.id, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else {
          setDeviceName.call(self, socket.id, data.name);

          if (device.state === DeviceModel.STATE_PENDING) {
            self.ioClient.emit('hello', device);
          }
        }
      });
    });

    // Disconnect event
    socket.on('disconnect', function() {
      removeDevice.call(self, socket.id);

      // TODO : Send event to client to inform it
    });

  });
}

/**
 * Instantiate all socket.io connexions
 *
 * @method connect
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
SocketProvider.prototype.connect = function(callback) {
  deviceConnect.call(this);
  clientConnect.call(this);
  callback();
};

/**
 * Get all connected devices
 *
 * @returns {Array} An array of devices
 */
SocketProvider.prototype.getDevices = function() {
  return this.devices;
};
