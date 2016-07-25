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
 * @param {String} socketId The socket id
 * @returns {Object | undefined}
 */
function findDeviceIndex(socketId) {
  return this.devices.findIndex(function(value) {
    return value.socketId == socketId;
  });
}

/**
 * Retrieve a device with its socket id
 *
 * @method findDevice
 * @private
 * @param {String} socketId The socket id
 * @returns {Object | null}
 */
function findDevice(socketId) {
  var device;
  var data = this.devices.find(function(value) {
    return value.socketId == socketId;
  });

  if (typeof data !== 'undefined') {
    device = data.device;
  }

  return device;
}

/**
 * Retrieve a device with its id
 *
 * @method findDeviceById
 * @private
 * @param {String} deviceId The device id
 * @returns {Object | null}
 */
function findDeviceById(deviceId) {
  var device;
  var data = this.devices.find(function(value) {
    return value.device.id == deviceId;
  });

  if (typeof data !== 'undefined') {
    device = data.device;
  }

  return device;
}

/**
 * Retrieve a socket with a device id
 *
 * @method findSocket
 * @private
 * @param {String} deviceId The device id
 * @returns {Object | null}
 */
function findSocket(deviceId) {
  var data = this.devices.find(function(value) {
    return value.device.id == deviceId;
  });

  if (typeof data !== 'undefined') {
    return this.ioDevice.sockets[data.socketId];
  }

  return null;
}

/**
 * Store a new device in-memory
 *
 * @method addDevice
 * @private
 * @param {String} socketId the socket id
 * @param {Object} device The new device
 */
function addDevice(socketId, device) {
  var index = findDeviceIndex.call(this, socketId);

  if (index === -1) {
    this.devices.push({
      socketId: socketId,
      device: device
    });
  } else {
    this.devices[index] = {
      socketId: socketId,
      device: device
    };
  }
}

/**
 * Set the name of a device
 *
 * @method setDeviceName
 * @param {String} socketId the socket id
 * @param {String} name The new name for the device
 */
function setDeviceName(socketId, name) {
  var index = findDeviceIndex.call(this, socketId);

  if (index >= 0) {
    this.devices[index].device.name = name;
  }
}

/**
 * Set a percent with the storage data
 *
 * @method setDeviceStorage
 * @param {String} socketId The socket id
 * @param {Object} storage The storage data for the device
 */
function setDeviceStorage(socketId, storage) {
  var index = findDeviceIndex.call(this, socketId);

  if (index >= 0) {
    this.devices[index].device.storage = (parseInt(storage.used) /
      (parseInt(storage.free) + parseInt(storage.used))) * 100;
  }
}

/**
 * Remove an in-memory stored device when a device is disconnected
 *
 * @method removeDevice
 * @private
 * @param {String} socketId The socket id
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
  var self = this;

  this.ioClient.on('connection', function(socket) {

    // Listening for device needed updating settings (storage/presets)
    socket.on('settings', function(data) {
      self.devicesSettings(data);
    });
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
      self.deviceListener.hello(data, socket, function(error, device) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else {
          addDevice.call(self, socket.id, device);
        }
      });
    });

    // Listening for device name
    socket.on('settings.name', function(data) {
      var device = findDevice.call(self, socket.id);

      self.deviceListener.settingsName(data, device.id, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else if (device.name.length === 0 && device.state === DeviceModel.STATE_PENDING) {
          setDeviceName.call(self, socket.id, data.name);
          self.clientListener.hello(device);
        }
      });
    });

    // Listening for device storage
    socket.on('settings.storage', function(data) {
      var device;

      setDeviceStorage.call(self, socket.id, data);
      device = findDevice.call(self, socket.id);
      self.clientListener.storage(device);
    });

    // Listening for device equipments
    socket.on('settings.presets', function(data) {

      // var device = findDevice.call(self, socket.id);
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
  var self = this;

  deviceConnect.call(this);
  clientConnect.call(this);

  // Prepare cache on data start
  this.deviceModel.get(null, function(error, entities) {
    if (error)
      callback(error);

    entities.map(function(device) {
      self.devices.push({
        socketId: null,
        device: device
      });
    });
    callback();
  });

};

/**
 * Get all connected devices
 *
 * @method getDevices
 * @returns {Array} An array of devices
 */
SocketProvider.prototype.getDevices = function() {
  var devices = [];

  this.devices.map(function(data) {
    devices.push(data.device);
  });

  return devices;
};

/**
 * Asks for devices settings
 *
 * @method deviceSettings
 * @param {Array} deviceIds An array of device ids
 */
SocketProvider.prototype.devicesSettings = function(deviceIds) {
  var self = this,
    socket;

  deviceIds.map(function(id) {
    socket = findSocket.call(self, id);

    // Asks for device settings
    if (socket)
      self.deviceListener.settings(socket);
  });
};

/**
 * Update a device with the given data
 *
 * @method updateDevice
 * @param {String} deviceId the device id
 * @param {Object} data The new data of the device
 */
SocketProvider.prototype.updateDevice = function(deviceId, data) {
  var device = findDeviceById.call(this, deviceId);

  for (var key in data) {
    device[key] = data[key];
  }
};
