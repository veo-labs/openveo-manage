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
var ScheduleManager = process.requireManage('app/server/services/ScheduleManager.js');

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
  this.deviceListener = new DeviceListener(this.deviceModel);

  /**
   * The client listener
   *
   * @property clientListener
   * @type ClientListener
   */
  this.clientListener = new ClientListener(this.ioClient);

  /**
   * The schedule manager
   *
   * @property scheduleManager
   * @type ScheduleManager
   */
  this.scheduleManager = new ScheduleManager();
}

util.inherits(SocketProvider, events.EventEmitter);
module.exports = SocketProvider;

/**
 * Retrieve a device index with its socket id
 *
 * @method findDeviceIndexById
 * @private
 * @param {String} deviceId The device id
 * @returns {int | -1}
 */
function findDeviceIndexById(deviceId) {
  return this.devices.findIndex(function(value) {
    return value.device.id == deviceId;
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
 * @param {String} ip The address IP of the device
 */
function addDevice(socketId, device, ip) {
  var index = findDeviceIndexById.call(this, device.id);

  device.ip = ip.substring(7);

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
 * @param {Object} The device object
 * @param {String} name The new name for the device
 */
function setDeviceName(device, name) {
  device.name = name;
}

/**
 * Set a percent with the storage data
 *
 * @method setDeviceStorage
 * @param {Object} The device object
 * @param {Object} storage The storage data for the device
 */
function setDeviceStorage(device, storage) {
  device.storage = {
    free: parseInt(storage.free) / 1000000000,
    used: parseInt(storage.used) / 1000000000,
    total: (parseInt(storage.free) + parseInt(storage.used)) / 1000000000,
    percent: (parseInt(storage.used) /
    (parseInt(storage.free) + parseInt(storage.used))) * 100
  };
}

/**
 * Set the inputs of a device
 *
 * @method setDeviceInputs
 * @param {Object} The device object
 * @param {Object} inputs The inputs (camera, slides) connected to the device
 */
function setDeviceInputs(device, inputs) {
  var data = {};

  if (inputs.camera.timings) {
    if (!inputs.camera.timings.supported) {
      data.camera = 'ko';
    } else {
      data.camera = 'ok';
    }
  } else {
    data.camera = 'disconnected';
  }
  if (inputs.slides.timings) {
    if (!inputs.slides.timings.supported) {
      data.desktop = 'ko';
    } else {
      data.desktop = 'ok';
    }
  } else {
    data.desktop = 'disconnected';
  }

  device.inputs = data;
}

/**
 * Set the presets of a device
 *
 * @method setDevicesPresets
 * @param {Object} The device object
 * @param {Object} presets The presets of the device
 */
function setDevicePresets(device, presets) {
  var data = presets;

  if (!Array.isArray(presets)) {
    presets = [];
    presets.push(data);
  }

  device.presets = presets;
}

/**
 * Update the status of a device
 *
 * @method updateDeviceState
 * @param {Object} The device object
 * @param {Object} status The status of the device
 */
function updateDeviceState(device, status) {
  device.status = status;
}

/**
 * Update an in-memory stored device when a device is disconnected
 *
 * @method disconnectDevice
 * @private
 * @param {Object} The device object
 */
function disconnectDevice(device) {
  device.status = 'disconnected';
  delete device.presets;
  delete device.inputs;
  delete device.storage;
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

    // Listening for device needed updating settings (storage, inputs, presets)
    socket.on('settings', function(data) {
      self.devicesSettings(data);
    });

    // Listening for device update name
    socket.on('update.name', function(data) {
      var socket = findSocket.call(self, data.id);

      // Send the new device name
      if (socket)
        self.deviceListener.updateName(socket, data.name);
    });

    // Listening for start a new recording session
    socket.on('session.start', function(data) {
      var sockets = [];

      data.deviceIds.map(function(id) {
        sockets.push(findSocket.call(self, id));
      });

      self.deviceListener.startRecord(sockets, data, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        }
      });
    });

    // Listening for stop the currently running recording session
    socket.on('session.stop', function(data) {
      var sockets = [];

      data.deviceIds.map(function(id) {
        sockets.push(findSocket.call(self, id));
      });

      self.deviceListener.stopRecord(sockets, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        }
      });
    });

    // Listening for tag the currently running recording session
    socket.on('session.index', function(data) {
      var sockets = [];

      data.deviceIds.map(function(id) {
        sockets.push(findSocket.call(self, id));
      });

      self.deviceListener.tagRecord(sockets, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        }
      });
    });

    // Listening for update state on device first connexion
    socket.on('update.state', function(data) {
      self.clientListener.updateState(data);
    });

    // Listening for group creation event
    socket.on('group.addDevice', function(data) {
      self.clientListener.addDeviceToGroup(data);
    });

    // Listening for group remove event
    socket.on('remove.group', function(data) {
      self.clientListener.removeGroup(data);
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

  this.ioDevice.on('connection', function(socket) {

    // Event on device start
    socket.on('hello', function(data) {
      self.deviceListener.hello(data, socket, function(error, device) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else {
          addDevice.call(self, socket.id, device, socket.handshake.address);

          // Update the scheduled jobs
          self.scheduleManager.updateJobs.call(self, device, function(error, schedules) {
            if (error)
              self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
            if (!device.group)
              device.schedules = schedules;
          });
        }
      });
    });

    // Listening for device name
    socket.on('settings.name', function(data) {
      var device = findDevice.call(self, socket.id),
        name = data.name;

      // Verify if the name is defined
      if (!name) {
        name = 'MANAGE.DEVICE.NAME';
      }

      self.deviceListener.setName(name, device.id, function(error) {
        if (error) {
          self.emit('error', new SocketError(error.message, 'TODO ERROR MESSAGE'));
        } else if (device.name.length === 0 && device.state === DeviceModel.STATE_PENDING) {
          setDeviceName.call(self, device, name);
          self.clientListener.hello(device);
        }
      });
    });

    // Listening for device storage
    socket.on('storage', function(data) {
      var device = findDevice.call(self, socket.id);

      setDeviceStorage.call(self, device, data);
      self.clientListener.update('storage', device.storage, device.id);
    });

    // Listening for device inputs
    socket.on('inputs', function(data) {
      var device = findDevice.call(self, socket.id);

      setDeviceInputs.call(self, device, data);
      self.clientListener.update('inputs', device.inputs, device.id);
    });

    // Listening for device equipments
    socket.on('settings.presets', function(data) {
      var device = findDevice.call(self, socket.id);

      setDevicePresets.call(self, device, data);
      self.clientListener.update('presets', device.presets, device.id);
    });

    // Listening for device status change
    socket.on('session.status', function(data) {
      var device = findDevice.call(self, socket.id);

      updateDeviceState.call(self, device, data.status);
      self.clientListener.update('status', data.status, device.id);
    });

    // Disconnect event
    socket.on('disconnect', function() {
      var device = findDevice.call(self, socket.id);

      if (device) {
        disconnectDevice.call(self, device);
        self.clientListener.update('status', 'disconnected', device.id);
      }
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

  // Prepare cache on server start
  this.deviceModel.get(null, function(error, entities) {
    if (error)
      callback(error);

    entities.map(function(device) {
      device.status = 'disconnected';

      self.devices.push({
        socketId: null,
        device: device
      });
    });
    callback();
  });

};

/**
 * Get all devices
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
 * Get a socket with its id
 *
 * @method getSockets
 * @param {String} id The device id
 * @returns {Object} The socket linked to the device id
 */
SocketProvider.prototype.getSocket = function(id) {
  return findSocket.call(this, id);
};

/**
 * Asks for devices storage
 *
 * @method devicesSettings
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
 * @param {String} id the device or group id
 * @param {Object} data The new data of the device
 */
SocketProvider.prototype.updateDevice = function(id, data) {
  var device = findDeviceById.call(this, id),
    self = this,
    key;

  if (!device) {
    for (key in data) {
      self.clientListener.update(key, data[key], id);
    }
  } else {
    for (key in data) {
      device[key] = data[key];
      self.clientListener.update(key, data[key], device.id);
    }
  }
};

/**
 * Remove an in-memory stored device with its id
 *
 * @method removeDeviceById
 * @param {String} deviceId The device id
 */
SocketProvider.prototype.removeDeviceById = function(deviceId) {
  var index = findDeviceIndexById.call(this, deviceId);

  if (index >= 0) {
    this.devices.splice(index, 1);
    this.clientListener.removeDevice(deviceId);
  }
};
