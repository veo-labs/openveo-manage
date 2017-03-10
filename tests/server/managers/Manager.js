'use strict';

var util = require('util');
var events = require('events');
var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var Manager = process.requireManage('app/server/Manager.js');
var Device = process.requireManage('app/server/manageables/Device.js');
var Group = process.requireManage('app/server/manageables/Group.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// Manager.js
describe('Manager', function() {
  var DevicePilot;
  var BrowserPilot;
  var manager;
  var devicesPilot;
  var browsersPilot;
  var deviceModel;
  var groupModel;
  var scheduleManager;

  // Mocks
  beforeEach(function() {
    DevicePilot = function() {

    };

    DevicePilot.prototype.MESSAGES = {
      CONNECTED: 'connected',
      AUTHENTICATED: 'hello',
      NAME_UPDATED: 'nameUpdated',
      STORAGE_UPDATED: 'storageUpdated',
      INPUTS_UPDATED: 'inputsUpdated',
      PRESETS_UPDATED: 'presetsUpdated',
      SESSION_STATUS_UPDATED: 'sessionStatusUpdated',
      DISCONNECTED: 'disconnected',
      ERROR: 'error'
    };


    DevicePilot.prototype.STATUSES = {
      STOPPED: 'stopped',
      ERROR: 'error',
      STARTED: 'started',
      STARTING: 'starting',
      STOPPING: 'stopping',
      DISCONNECTED: 'disconnected',
      UNKNOWN: 'unknown'
    };

    BrowserPilot = function() {

    };

    BrowserPilot.prototype.MESSAGES = {
      GET_DEVICES: 'getDevices',
      GET_DEVICE_SETTINGS: 'getDeviceSettings',
      UPDATE_NAME: 'updateName',
      START_DEVICE_SESSION: 'startDeviceSession',
      STOP_DEVICE_SESSION: 'stopDeviceSession',
      INDEX_DEVICE_SESSION: 'indexDeviceSession',
      UPDATE_DEVICE_STATE: 'updateDeviceState',
      REMOVE: 'remove',
      REMOVE_HISTORIC: 'removeHistoric',
      ADD_SCHEDULE: 'addSchedule',
      REMOVE_SCHEDULE: 'removeSchedule',
      REMOVE_HISTORY: 'removeHistory',
      GET_GROUPS: 'getGroups',
      CREATE_GROUP: 'createGroup',
      ADD_DEVICE_TO_GROUP: 'addDeviceToGroup',
      REMOVE_DEVICE_FROM_GROUP: 'removeDeviceFromGroup',
      ERROR: 'error'
    };

    deviceModel = {
      get: function(filter, callback) {
        callback(null, []);
      },
      STATES: {
        ACCEPTED: 'accepted',
        PENDING: 'pending',
        REFUSED: 'refused'
      },
      addHistoric: function() {

      }
    };
    deviceModel.AVAILABLE_STATES = [
      deviceModel.STATES.ACCEPTED,
      deviceModel.STATES.PENDING,
      deviceModel.STATES.REFUSED
    ];
    groupModel = {
      get: function(filter, callback) {
        callback(null, []);
      },
      addHistoric: function() {

      }
    };
    scheduleManager = {};

    util.inherits(DevicePilot, events.EventEmitter);
    util.inherits(BrowserPilot, events.EventEmitter);
  });

  // Prepare tests
  beforeEach(function() {
    devicesPilot = new DevicePilot();
    browsersPilot = new BrowserPilot();
    manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
    manager.start();
  });

  beforeEach(function() {
    browsersPilot.update = function() {

    };
  });

  // Properties
  describe('properties', function() {

    it('should not be editable', function() {
      var properties = ['browsersPilot', 'devicesPilot', 'cache', 'scheduleManager', 'groupModel', 'deviceModel'];

      properties.forEach(function(property) {
        assert.throws(function() {
          manager[property] = null;
        }, null, null, 'Expected property "' + property + '" to be unalterable');
      });
    });

  });

  // Devices' event listeners
  describe('devices\' event', function() {
    var deviceGroup;

    // AUTHENTICATED event
    describe('AUTHENTICATED', function() {

      beforeEach(function() {
        devicesPilot.askForName = function() {

        };

        browsersPilot.connectDevice = function() {

        };

        deviceGroup = new Group({id: '42'});
        manager.cache.add(deviceGroup);
      });

      it('should register the new connected device into the database and cache', function() {
        var expectedDeviceId = '42';
        var deviceIp = '::ffff:192.168.1.42';
        var expectedDevice = {id: expectedDeviceId};

        deviceModel.add = function(data, callback) {
          assert.strictEqual(data.id, expectedDeviceId, 'Wrong device id');
          callback(null, 1, expectedDevice);
        };

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, deviceIp, expectedDeviceId);

        var device = manager.cache.get(expectedDeviceId);
        assert.strictEqual(device.id, expectedDevice.id, 'Wrong device id');
      });

      it('should find device\'s ip v4 address and build web interface url', function() {
        var expectedDeviceId = '42';
        var expectedDeviceIp = '192.168.1.42';

        deviceModel.add = function(data, callback) {
          callback(null, 1, data);
        };

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, '::ffff:' + expectedDeviceIp, expectedDeviceId);

        var device = manager.cache.get(expectedDeviceId);
        assert.strictEqual(device.ip, expectedDeviceIp, 'Wrong ip');
        assert.strictEqual(device.url, 'http://' + expectedDeviceIp, 'Wrong url');
      });

      it('should find device\'s ip v6 address and build web interface url', function() {
        var expectedDeviceId = '42';
        var expectedDeviceIp = '2001:0db8:0000:85a3:0000:0000:ac1f:8001';

        deviceModel.add = function(data, callback) {
          callback(null, 1, data);
        };

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, expectedDeviceIp, expectedDeviceId);

        var device = manager.cache.get(expectedDeviceId);
        assert.strictEqual(device.ip, expectedDeviceIp, 'Wrong ip');
        assert.strictEqual(device.url, 'http://[' + expectedDeviceIp + ']', 'Wrong url');
      });

      it('should ask for device\'s settings if it has already been accepted', function() {
        var expectedDeviceId = '42';
        var deviceIp = '::ffff:192.168.1.42';
        var expectedDevice = new Device({id: expectedDeviceId, state: deviceModel.STATES.ACCEPTED});

        manager.cache.add(expectedDevice);

        devicesPilot.askForSettings = chai.spy(function() {
        });

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, deviceIp, expectedDeviceId);

        devicesPilot.askForSettings.should.have.been.called.exactly(1);
      });

      it('should inform browsers about the new connected device', function() {
        var expectedDeviceId = '42';
        var deviceIp = '::ffff:192.168.1.42';
        var expectedDevice = new Device({id: expectedDeviceId});

        manager.cache.add(expectedDevice);

        browsersPilot.connectDevice = chai.spy(function() {
        });

        devicesPilot.askForSettings = function() {
        };

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, deviceIp, expectedDeviceId);

        browsersPilot.connectDevice.should.have.been.called.with.exactly(expectedDevice);
      });

      it('should not register device if already registered', function() {
        var expectedDeviceId = '42';
        var deviceIp = '::ffff:192.168.1.42';
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);

        deviceModel.add = chai.spy(function(data, callback) {

        });

        devicesPilot.emit(devicesPilot.MESSAGES.AUTHENTICATED, deviceIp, expectedDeviceId);

        deviceModel.add.should.have.been.called.exactly(0);
      });

    });

    // NAME_UPDATED event
    describe('NAME_UPDATED', function() {

      it('should update name in database and cache', function() {
        var expectedDeviceName = 'new name';
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, name: 'old name'});
        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedDeviceId, 'Wrong id');
          assert.strictEqual(data.name, expectedDeviceName, 'Wrong name');
          callback();
        };

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);

        assert.strictEqual(manager.cache.get(expectedDeviceId).name, expectedDeviceName, 'Wrong name');
      });

      it('should add an historic and inform browsers', function() {
        var expectedDeviceName = 'new name';
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, name: 'name'});
        expectedDevice.group = deviceGroup.id;
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);
        browsersPilot.update = chai.spy(browsersPilot.update);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);
        deviceModel.addHistoric.should.have.been.called.exactly(1);
        groupModel.addHistoric.should.have.been.called.exactly(1);
        browsersPilot.update.should.have.been.called.exactly(1);
      });

      it('should not do anything if device is not found in cache', function() {
        var expectedDeviceName = 'new name';
        var expectedDeviceId = '42';
        deviceModel.update = chai.spy(deviceModel.update);

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);
        deviceModel.update.should.have.been.called.exactly(0);

      });

      it('should not inform browsers if update failed', function() {
        var expectedDeviceName = 'new name';
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, name: 'old name'});
        browsersPilot.update = chai.spy(browsersPilot.update);

        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          callback(new Error('Message'));
        };

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);
        browsersPilot.update.should.have.been.called.exactly(0);
      });

      it('should not inform browsers if name is the same as before', function() {
        var expectedDeviceName = 'name';
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, name: 'name'});
        manager.cache.add(expectedDevice);
        browsersPilot.update = chai.spy(browsersPilot.update);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);
        browsersPilot.update.should.have.been.called.exactly(0);
        deviceModel.addHistoric.should.have.been.called.exactly(0);
      });

      it('should not add historic if this is the first known name of the device', function() {
        var expectedDeviceName = 'name';
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        devicesPilot.emit(devicesPilot.MESSAGES.NAME_UPDATED, expectedDeviceName, expectedDeviceId);
        deviceModel.addHistoric.should.have.been.called.exactly(0);
      });
    });

    // STORAGE_UPDATED event
    describe('STORAGE_UPDATED', function() {

      it('should update device storage into cache', function() {
        var expectedFreeBytes = 42;
        var expectedUsedBytes = 43;
        var expectedDeviceId = '42';
        var expectedStorage = {free: expectedFreeBytes, used: expectedUsedBytes};
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);
        browsersPilot.update = chai.spy(browsersPilot.update);

        expectedDevice.setStorage = function(free, used) {
          assert.strictEqual(free, expectedFreeBytes, 'Wrong free Bytes');
          assert.strictEqual(used, expectedUsedBytes, 'Wrong used Bytes');
          this.storage = expectedStorage;
        };

        devicesPilot.emit(
          devicesPilot.MESSAGES.STORAGE_UPDATED,
          expectedFreeBytes,
          expectedUsedBytes,
          expectedDeviceId
        );

        assert.strictEqual(manager.cache.get(expectedDeviceId).storage, expectedStorage, 'Wrong storage');
        browsersPilot.update.should.have.been.called.with.exactly(expectedDevice, 'storage', expectedDevice.storage);
      });

      it('should not do anything if device is not found', function() {
        var expectedFreeBytes = 42;
        var expectedUsedBytes = 43;
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(devicesPilot.MESSAGES.STORAGE_UPDATED, expectedFreeBytes, expectedUsedBytes);

        browsersPilot.update.should.have.been.called.exactly(0, 'Unexpected message sent to browsers');
      });

    });

    // INPUTS_UPDATED event
    describe('INPUTS_UPDATED', function() {

      it('should update device inputs into cache', function() {
        var expectedCamera = {};
        var expectedSlides = {};
        var expectedDeviceId = '42';
        var expectedInputs = {camera: expectedCamera, slides: expectedSlides};
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);
        browsersPilot.update = chai.spy(browsersPilot.update);

        expectedDevice.setInputs = function(camera, slides) {
          assert.strictEqual(camera, expectedCamera, 'Wrong camera information');
          assert.strictEqual(slides, expectedSlides, 'Wrong slides information');
          this.inputs = expectedInputs;
        };

        devicesPilot.emit(devicesPilot.MESSAGES.INPUTS_UPDATED, expectedCamera, expectedSlides, expectedDeviceId);

        assert.strictEqual(manager.cache.get(expectedDeviceId).inputs, expectedInputs, 'Wrong inputs');
        browsersPilot.update.should.have.been.called.with.exactly(expectedDevice, 'inputs', expectedDevice.inputs);
      });

      it('should not do anything if device is not found', function() {
        var expectedCamera = {};
        var expectedSlides = {};
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(devicesPilot.MESSAGES.INPUTS_UPDATED, expectedCamera, expectedSlides);

        browsersPilot.update.should.have.been.called.exactly(0, 'Unexpected message sent to browsers');
      });

    });

    // PRESETS_UPDATED event
    describe('PRESETS_UPDATED', function() {

      it('should update device presets into cache', function() {
        var expectedPresets = {};
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);
        browsersPilot.update = chai.spy(browsersPilot.update);

        expectedDevice.setPresets = function(presets) {
          assert.strictEqual(presets, expectedPresets, 'Wrong presets information');
          this.presets = expectedPresets;
        };

        devicesPilot.emit(devicesPilot.MESSAGES.PRESETS_UPDATED, expectedPresets, expectedDeviceId);

        assert.strictEqual(manager.cache.get(expectedDeviceId).presets, expectedPresets, 'Wrong presets');
        browsersPilot.update.should.have.been.called.with.exactly(expectedDevice, 'presets', expectedDevice.presets);
      });

      it('should not do anything if device is not found', function() {
        var expectedPresets = {};
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(devicesPilot.MESSAGES.PRESETS_UPDATED, expectedPresets);

        browsersPilot.update.should.have.been.called.exactly(0, 'Unexpected message sent to browsers');
      });

    });

    // SESSION_STATUS_UPDATED event
    describe('SESSION_STATUS_UPDATED', function() {

      it('should update recording session status into cache', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, status: devicesPilot.STATUSES.STOPPED});
        var expectedStatus = devicesPilot.STATUSES.STARTED;
        manager.cache.add(expectedDevice);
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(devicesPilot.MESSAGES.SESSION_STATUS_UPDATED, expectedStatus, expectedDeviceId);

        assert.strictEqual(manager.cache.get(expectedDevice.status, expectedStatus));
        browsersPilot.update.should.have.been.called.with.exactly(expectedDevice, 'status', expectedStatus);
      });

      it('should add an historic only if status becomes started, error or stopped', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, status: devicesPilot.STATUSES.STOPPED});
        var message = devicesPilot.MESSAGES.SESSION_STATUS_UPDATED;
        expectedDevice.group = deviceGroup.id;
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        devicesPilot.emit(message, devicesPilot.STATUSES.ERROR, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STARTED, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STOPPED, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STARTING, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STOPPING, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.DISCONNECTED, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.UNKNOWN, expectedDeviceId);

        deviceModel.addHistoric.should.have.been.called.exactly(3);
        groupModel.addHistoric.should.have.been.called.exactly(3);
      });

      it('should not add an historic if old status was not defined, DISCONNECTED or if the same', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        var message = devicesPilot.MESSAGES.SESSION_STATUS_UPDATED;
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        devicesPilot.emit(message, devicesPilot.STATUSES.STARTED, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STOPPED, expectedDeviceId);
        devicesPilot.emit(message, devicesPilot.STATUSES.STOPPED, expectedDeviceId);

        deviceModel.addHistoric.should.have.been.called.exactly(1);
      });

      it('should ignore UNKNOWN status', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId, status: devicesPilot.STATUSES.STOPPED});
        var message = devicesPilot.MESSAGES.SESSION_STATUS_UPDATED;
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(message, devicesPilot.STATUSES.UNKNOWN, expectedDeviceId);

        deviceModel.addHistoric.should.have.been.called.exactly(0);
        browsersPilot.update.should.have.been.called.exactly(0);

        assert.strictEqual(manager.cache.get(expectedDeviceId).status, devicesPilot.STATUSES.STOPPED);
      });

      it('should not do anything if device is not found', function() {
        var message = devicesPilot.MESSAGES.SESSION_STATUS_UPDATED;
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(message, devicesPilot.STATUSES.UNKNOWN, '42');

        deviceModel.addHistoric.should.have.been.called.exactly(0);
        browsersPilot.update.should.have.been.called.exactly(0);
      });
    });

    // DISCONNECTED event
    describe('DISCONNECTED', function() {

      it('should disconnect the device', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);
        expectedDevice.disconnect = chai.spy(expectedDevice.disconnect);
        browsersPilot.update = chai.spy(browsersPilot.update);

        devicesPilot.emit(devicesPilot.MESSAGES.DISCONNECTED, expectedDeviceId);

        expectedDevice.disconnect.should.have.been.called.exactly(1);
        assert.strictEqual(manager.cache.get(expectedDeviceId).status, devicesPilot.STATUSES.DISCONNECTED);
        browsersPilot.update.should.have.been.called.with.exactly(
          expectedDevice,
          'status',
          devicesPilot.MESSAGES.DISCONNECTED
        );
      });

      it('should add an historic', function() {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        expectedDevice.group = deviceGroup.id;
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        devicesPilot.emit(devicesPilot.MESSAGES.DISCONNECTED, expectedDeviceId);

        deviceModel.addHistoric.should.have.been.called.exactly(1);
        groupModel.addHistoric.should.have.been.called.exactly(1);
      });

      it('should not do anything if device is not found', function() {
        browsersPilot.update = chai.spy(browsersPilot.update);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        devicesPilot.emit(devicesPilot.MESSAGES.DISCONNECTED, '42');

        deviceModel.addHistoric.should.have.been.called.exactly(0);
        browsersPilot.update.should.have.been.called.exactly(0);
      });

    });

  });

  // Browsers' event listeners
  describe('browsers\' event', function() {

    // GET_DEVICES event
    describe('GET_DEVICES', function() {

      it('should execute callback with the list of devices in cache', function(done) {
        var expectedDevice = new Device({id: '42'});
        manager.cache.add(expectedDevice);

        browsersPilot.emit(browsersPilot.MESSAGES.GET_DEVICES, function(results) {
          assert.strictEqual(results.data[0], expectedDevice);
          done();
        });
      });

      it('should execute callback with an empty array if no device in cache', function(done) {
        browsersPilot.emit(browsersPilot.MESSAGES.GET_DEVICES, function(results) {
          assert.equal(results.data.length, 0);
          done();
        });
      });
    });

    // GET_DEVICE_SETTINGS event
    describe('GET_DEVICE_SETTINGS', function() {

      it('should ask devices their settings and execute callback', function(done) {
        var expectedIds = ['42', '43'];
        devicesPilot.askForSettings = chai.spy(devicesPilot.askForSettings);

        browsersPilot.emit(browsersPilot.MESSAGES.GET_DEVICE_SETTINGS, expectedIds, function() {
          devicesPilot.askForSettings.should.have.been.called.with.exactly(expectedIds);
          done();
        });
      });

    });

    // UPDATE_NAME event
    describe('UPDATE_NAME', function() {

      it('should be able to update name of a device', function(done) {
        var expectedId = '42';
        var expectedName = 'name';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);

        devicesPilot.askForUpdateName = function(id, name, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(name, expectedName, 'Wrong name');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_NAME,
          expectedId,
          expectedName,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            done();
          }
        );
      });

      it('should execute callback with an error if device is not found', function(done) {
        browsersPilot.emit(browsersPilot.MESSAGES.UPDATE_NAME, '42', 'name', Device.TYPE, function(results) {
          assert.isDefined(results.error);
          done();
        });
      });

      it('should execute callback with an error and add historic if renaming device failed', function(done) {
        var expectedId = '42';
        var expectedName = 'name';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        devicesPilot.askForUpdateName = function(id, name, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_NAME,
          expectedId,
          expectedName,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            deviceModel.addHistoric.should.have.been.called.exactly(1);
            done();
          }
        );
      });

      it('should not inform browsers about anything when renaming a device', function(done) {
        var expectedId = '42';
        var expectedName = 'name';
        var expectedType = Device.TYPE;
        browsersPilot.update = chai.spy(browsersPilot.update);
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);

        devicesPilot.askForUpdateName = function(id, name, callback) {
          callback();
        };

        browsersPilot.emit(browsersPilot.MESSAGES.UPDATE_NAME, expectedId, expectedName, expectedType, function() {
          browsersPilot.update.should.have.been.called.exactly(0);
          done();
        });

      });

      it('should be able to update name of a group', function(done) {
        var expectedId = '42';
        var expectedName = 'name';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        manager.cache.add(expectedGroup);
        browsersPilot.update = chai.spy(browsersPilot.update);

        groupModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(data.name, expectedName, 'Wrong name');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_NAME,
          expectedId,
          expectedName,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            browsersPilot.update.should.have.been.called.with.exactly(expectedGroup, 'name', expectedName);
            done();
          }
        );
      });

      it('should execute callback with an error and add historic if renaming device failed', function(done) {
        var expectedId = '42';
        var expectedName = 'name';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        manager.cache.add(expectedGroup);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        groupModel.update = function(id, data, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_NAME,
          expectedId,
          expectedName,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            groupModel.addHistoric.should.have.been.called.exactly(1);
            done();
          }
        );

      });

      it('should execute callback with an error if group is not found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_NAME,
          '42',
          'name',
          Group.TYPE,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

    });

    // START_DEVICE_SESSION event
    describe('START_DEVICE_SESSION', function() {

      it('should ask devices to start a recording session', function(done) {
        var expectedIds = ['42', '43'];
        var expectedPresetId = 'preset';

        expectedIds.forEach(function(id) {
          manager.cache.add(new Device({id: id}));
        });

        devicesPilot.askForStartRecord = function(ids, presetId, callback) {
          var results = [];
          assert.deepEqual(ids, expectedIds, 'Wrong ids');
          assert.strictEqual(presetId, expectedPresetId, 'Wrong preset id');

          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.START_DEVICE_SESSION,
          expectedIds,
          expectedPresetId,
          function(results) {
            assert.strictEqual(results.errors.length, 0, 'Unexpected errors');
            done();
          }
        );
      });

      it('should add an historic for each starting devices', function(done) {
        var expectedIds = ['42', '43'];
        var expectedPresetId = 'preset';
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForStartRecord = function(ids, presetId, callback) {
          var results = [];
          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.START_DEVICE_SESSION,
          expectedIds,
          expectedPresetId,
          function(results) {
            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

      it('should execute callback with one error by device not found', function(done) {
        var expectedIds = ['42', '43'];
        var expectedPresetId = 'preset';

        browsersPilot.emit(
          browsersPilot.MESSAGES.START_DEVICE_SESSION,
          expectedIds,
          expectedPresetId,
          function(results) {
            assert.strictEqual(results.errors.length, expectedIds.length);

            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, expectedIds[i]);

            done();
          }
        );
      });

      it('should execute callback with one error and add historic by device unable to start', function(done) {
        var expectedIds = ['42', '43'];
        var expectedPresetId = 'preset';
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id, name: 'name-' + id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForStartRecord = function(ids, presetId, callback) {
          var results = [];

          expectedIds.forEach(function(id) {
            results.push({
              error: {
                code: id,
                deviceId: id
              }
            });
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.START_DEVICE_SESSION,
          expectedIds,
          expectedPresetId,
          function(results) {
            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, 'name-' + expectedIds[i]);

            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

    });

    // STOP_DEVICE_SESSION event
    describe('STOP_DEVICE_SESSION', function() {

      it('should ask devices to stop a recording session', function(done) {
        var expectedIds = ['42', '43'];

        expectedIds.forEach(function(id) {
          manager.cache.add(new Device({id: id}));
        });

        devicesPilot.askForStopRecord = function(ids, callback) {
          var results = [];
          assert.deepEqual(ids, expectedIds, 'Wrong ids');

          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.STOP_DEVICE_SESSION,
          expectedIds,
          function(results) {
            assert.strictEqual(results.errors.length, 0, 'Unexpected errors');
            done();
          }
        );
      });

      it('should add an historic for each stopping devices', function(done) {
        var expectedIds = ['42', '43'];
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForStopRecord = function(ids, callback) {
          var results = [];
          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.STOP_DEVICE_SESSION,
          expectedIds,
          function(results) {
            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

      it('should execute callback with one error by device not found', function(done) {
        var expectedIds = ['42', '43'];

        browsersPilot.emit(
          browsersPilot.MESSAGES.STOP_DEVICE_SESSION,
          expectedIds,
          function(results) {
            assert.strictEqual(results.errors.length, expectedIds.length);

            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, expectedIds[i]);

            done();
          }
        );
      });

      it('should execute callback with one error and add historic by device unable to stop', function(done) {
        var expectedIds = ['42', '43'];
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id, name: 'name-' + id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForStopRecord = function(ids, callback) {
          var results = [];

          expectedIds.forEach(function(id) {
            results.push({
              error: {
                code: id,
                deviceId: id
              }
            });
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.STOP_DEVICE_SESSION,
          expectedIds,
          function(results) {
            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, 'name-' + expectedIds[i]);

            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

    });

    // INDEX_DEVICE_SESSION event
    describe('INDEX_DEVICE_SESSION', function() {

      it('should ask devices to index a recording session', function(done) {
        var expectedIds = ['42', '43'];

        expectedIds.forEach(function(id) {
          manager.cache.add(new Device({id: id}));
        });

        devicesPilot.askForSessionIndex = function(ids, callback) {
          var results = [];
          assert.deepEqual(ids, expectedIds, 'Wrong ids');

          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.INDEX_DEVICE_SESSION,
          expectedIds,
          function(results) {
            assert.strictEqual(results.errors.length, 0, 'Unexpected errors');
            done();
          }
        );
      });

      it('should add an historic for each stopping devices', function(done) {
        var expectedIds = ['42', '43'];
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForSessionIndex = function(ids, callback) {
          var results = [];
          expectedIds.forEach(function(id) {
            results.push({value: id});
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.INDEX_DEVICE_SESSION,
          expectedIds,
          function(results) {
            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

      it('should execute callback with one error by device not found', function(done) {
        var expectedIds = ['42', '43'];

        browsersPilot.emit(
          browsersPilot.MESSAGES.INDEX_DEVICE_SESSION,
          expectedIds,
          function(results) {
            assert.strictEqual(results.errors.length, expectedIds.length);

            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, expectedIds[i]);

            done();
          }
        );
      });

      it('should execute callback with one error and add historic by device unable to stop', function(done) {
        var expectedIds = ['42', '43'];
        var group = new Group({id: '42'});
        manager.cache.add(group);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);
        groupModel.addHistoric = chai.spy(groupModel.addHistoric);

        expectedIds.forEach(function(id) {
          var device = new Device({id: id, name: 'name-' + id});
          device.group = group.id;
          manager.cache.add(device);
        });

        devicesPilot.askForSessionIndex = function(ids, callback) {
          var results = [];

          expectedIds.forEach(function(id) {
            results.push({
              error: {
                code: id,
                deviceId: id
              }
            });
          });
          callback(null, results);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.INDEX_DEVICE_SESSION,
          expectedIds,
          function(results) {
            for (var i = 0; i < results.errors.length; i++)
              assert.strictEqual(results.errors[i].name, 'name-' + expectedIds[i]);

            deviceModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            groupModel.addHistoric.should.have.been.called.exactly(expectedIds.length);
            done();
          }
        );

      });

    });

    // UPDATE_DEVICE_STATE event
    describe('UPDATE_DEVICE_STATE', function() {

      beforeEach(function() {
        browsersPilot.updateDeviceState = function() {

        };
      });

      it('should update a device\'s state', function(done) {
        var expectedId = '42';
        var expectedState = deviceModel.STATES.ACCEPTED;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(data.state, expectedState, 'Wrong state');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          expectedState,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.strictEqual(manager.cache.get(expectedId).state, expectedState);
            done();
          }
        );

      });

      it('should inform browsers about new device\'s state', function(done) {
        var expectedId = '42';
        var expectedState = deviceModel.STATES.ACCEPTED;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);
        browsersPilot.updateDeviceState = chai.spy(browsersPilot.updateDeviceState);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          expectedState,
          function(results) {
            browsersPilot.updateDeviceState.should.have.been.called.with.exactly(expectedId, expectedState);
            done();
          }
        );

      });

      it('should add an historic if device\'s state becomes ACCEPTED or REFUSED', function() {
        var expectedId = '42';
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          deviceModel.STATES.ACCEPTED,
          function(results) {
          }
        );

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          deviceModel.STATES.REFUSED,
          function(results) {
          }
        );

        deviceModel.addHistoric.should.have.been.called.exactly(2);
      });

      it('should not do anything if new state is already the device state', function(done) {
        var expectedId = '42';
        var expectedState = deviceModel.STATES.ACCEPTED;
        var expectedDevice = new Device({id: expectedId, state: expectedState});
        manager.cache.add(expectedDevice);
        deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          deviceModel.STATES.ACCEPTED,
          function(results) {
            deviceModel.addHistoric.should.have.been.called.exactly(0);
            done();
          }
        );

      });

      it('should execute callback with an error if state if not valid', function(done) {
        var expectedId = '42';
        var expectedState = deviceModel.STATES.ACCEPTED;
        var expectedDevice = new Device({id: expectedId, state: expectedState});
        manager.cache.add(expectedDevice);

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          'wrong state',
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should execute callback with an error if changing state failed', function(done) {
        var expectedId = '42';
        var expectedState = deviceModel.STATES.ACCEPTED;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.UPDATE_DEVICE_STATE,
          expectedId,
          expectedState,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

    });

    // REMOVE event
    describe('REMOVE', function() {

      beforeEach(function() {
        browsersPilot.remove = function() {

        };
      });

      it('should be able to remove a device from database and cache', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        manager.cache.add(expectedDevice);
        browsersPilot.remove = chai.spy(browsersPilot.remove);

        deviceModel.remove = function(id, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.isUndefined(manager.cache.get(expectedId), 'Unexpected device');
            browsersPilot.remove.should.have.been.called.exactly(1);
            done();
          }
        );
      });

      it('should unregister device\'s schedules if any', function(done) {
        var removedJobsIds = [];
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({
          id: expectedId,
          schedules: [
            {
              id: '41',
              beginDate: new Date(new Date().getTime() + 86400000),
              duration: 7200000,
              startJobId: '42',
              stopJobId: '43'
            }
          ]
        });

        manager.cache.add(expectedDevice);

        deviceModel.remove = function(id, callback) {
          callback();
        };

        scheduleManager.removeJob = function(id) {
          removedJobsIds.push(id);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.ok(
              removedJobsIds.indexOf(expectedDevice.schedules[0].startJobId) >= 0,
              'Expected start job to be removed'
            );
            assert.ok(
              removedJobsIds.indexOf(expectedDevice.schedules[0].stopJobId) >= 0,
              'Expected stop job to be removed'
            );
            done();
          }
        );

      });

      it('should remove device\'s group if device is the last one in the group', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedGroup = new Group({id: '43'});
        var expectedDevice = new Device({
          id: expectedId,
          group: expectedGroup.id
        });

        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);

        deviceModel.remove = function(id, callback) {
          callback();
        };

        groupModel.remove = chai.spy(function(id, callback) {
          callback();
        });

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            groupModel.remove.should.have.been.called.exactly(1);
            done();
          }
        );
      });

      it('should execute callback with an error if device is not found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          '42',
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should execute callback with an error if removing the device failed', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({
          id: expectedId
        });
        browsersPilot.remove = chai.spy(browsersPilot.remove);

        manager.cache.add(expectedDevice);

        deviceModel.remove = function(id, callback) {
          callback(new Error('message'));
        };

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should be able to remove a group from database and cache', function(done) {
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        manager.cache.add(expectedGroup);

        groupModel.remove = function(id, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.isUndefined(manager.cache.get(expectedId), 'Unexpected group');
            done();
          }
        );
      });

      it('should unregister group\'s schedules if any', function(done) {
        var removedJobsIds = [];
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({
          id: expectedId,
          schedules: [
            {
              id: '41',
              beginDate: new Date(new Date().getTime() + 86400000),
              duration: 7200000,
              startJobId: '42',
              stopJobId: '43'
            }
          ]
        });

        manager.cache.add(expectedGroup);

        groupModel.remove = function(id, callback) {
          callback();
        };

        scheduleManager.removeJob = function(id) {
          removedJobsIds.push(id);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.ok(
              removedJobsIds.indexOf(expectedGroup.schedules[0].startJobId) >= 0,
              'Expected start job to be removed'
            );
            assert.ok(
              removedJobsIds.indexOf(expectedGroup.schedules[0].stopJobId) >= 0,
              'Expected stop job to be removed'
            );
            done();
          }
        );
      });

      it('should dissociate group from its devices in database and cache', function(done) {
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        var expectedDevice = new Device({id: '43', group: expectedGroup.id});

        manager.cache.add(expectedGroup);
        manager.cache.add(expectedDevice);
        browsersPilot.remove = chai.spy(browsersPilot.remove);

        groupModel.remove = function(id, callback) {
          callback();
        };

        deviceModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedDevice.id, 'Wrong id');
          assert.isNull(data.group, 'Expected group to be null');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.isNull(manager.cache.get(expectedDevice.id).group, 'Unexpected group');
            browsersPilot.remove.should.have.been.called.exactly(1);
            done();
          }
        );
      });

      it('should execute callback with an error if group is not found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          '42',
          Group.TYPE,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should execute callback with an error if removing the device failed', function(done) {
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({
          id: expectedId
        });
        browsersPilot.remove = chai.spy(browsersPilot.remove);

        manager.cache.add(expectedGroup);

        groupModel.remove = function(id, callback) {
          callback(new Error('message'));
        };

        groupModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE,
          expectedId,
          expectedType,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

    });

    // REMOVE_HISTORIC event
    describe('REMOVE_HISTORIC', function() {

      beforeEach(function() {
        browsersPilot.removeHistoric = function() {

        };
      });

      it('should remove device\'s historic from database and cache', function(done) {
        var expectedId = '42';
        var expectedHistoricId = '43';
        var expectedType = Device.TYPE;
        var device = new Device({
          id: expectedId,
          history: [
            {
              id: expectedHistoricId
            }
          ]
        });
        manager.cache.add(device);
        browsersPilot.removeHistoric = chai.spy(browsersPilot.removeHistoric);

        deviceModel.removeHistoric = function(id, historic, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(historic, expectedHistoricId, 'Wrong historic id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          expectedId,
          expectedHistoricId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.strictEqual(manager.cache.get(expectedId).history.length, 0, 'Expected historic to be removed');
            browsersPilot.removeHistoric.should.have.been.called.with.exactly(device, expectedHistoricId);
            done();
          }
        );
      });

      it('should execute callback with an error if removing device\'s historic failed', function(done) {
        var expectedId = '42';
        var expectedHistoricId = '43';
        var expectedType = Device.TYPE;
        var device = new Device({
          id: expectedId,
          history: [
            {
              id: expectedHistoricId
            }
          ]
        });
        browsersPilot.removeHistoric = chai.spy(browsersPilot.removeHistoric);
        manager.cache.add(device);

        deviceModel.removeHistoric = function(id, historic, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          expectedId,
          expectedHistoricId,
          expectedType,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should execute callback with an error if device was not found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          '42',
          '43',
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should remove group\'s historic from database and cache', function(done) {
        var expectedId = '42';
        var expectedHistoricId = '43';
        var expectedType = Group.TYPE;
        var group = new Group({
          id: expectedId,
          history: [
            {
              id: expectedHistoricId
            }
          ]
        });
        manager.cache.add(group);
        browsersPilot.removeHistoric = chai.spy(browsersPilot.removeHistoric);

        groupModel.removeHistoric = function(id, historic, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(historic, expectedHistoricId, 'Wrong historic id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          expectedId,
          expectedHistoricId,
          expectedType,
          function(results) {
            assert.isUndefined(results, 'Unexpected results');
            assert.strictEqual(manager.cache.get(expectedId).history.length, 0, 'Expected historic to be removed');
            browsersPilot.removeHistoric.should.have.been.called.with.exactly(group, expectedHistoricId);
            done();
          }
        );
      });

      it('should execute callback with an error if removing group\'s historic failed', function(done) {
        var expectedId = '42';
        var expectedHistoricId = '43';
        var expectedType = Group.TYPE;
        var group = new Group({
          id: expectedId,
          history: [
            {
              id: expectedHistoricId
            }
          ]
        });
        browsersPilot.removeHistoric = chai.spy(browsersPilot.removeHistoric);
        manager.cache.add(group);

        groupModel.removeHistoric = function(id, historic, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          expectedId,
          expectedHistoricId,
          expectedType,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });

      it('should execute callback with an error if group was not found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORIC,
          '42',
          '43',
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error);
            done();
          }
        );
      });
    });

    // ADD_SCHEDULE event
    describe('ADD_SCHEDULE', function() {

      beforeEach(function() {
        browsersPilot.addSchedule = function() {

        };
      });

      it('should be able to add and register a schedule for a device', function(done) {
        var jobs = [];
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        expectedDevice.isValidSchedule = function() {
          return true;
        };
        manager.cache.add(expectedDevice);
        browsersPilot.addSchedule = chai.spy(browsersPilot.addSchedule);

        scheduleManager.addJob = chai.spy(function(beginDate, endDate, recurrent, func) {
          jobs.push({
            beginDate: beginDate,
            endDate: endDate,
            recurrent: recurrent
          });

          assert.isDefined(func, 'Expected a function for the job');
        });

        deviceModel.addSchedule = function(id, schedule, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(schedule, expectedSchedule, 'Wrong schedule');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.strictEqual(jobs[0].recurrent, expectedSchedule.recurrent, 'Wrong recurrency');
            assert.strictEqual(
              jobs[0].beginDate.getTime(),
              expectedSchedule.beginDate.getTime(),
              'Wrong start time'
            );
            assert.strictEqual(
              jobs[1].beginDate.getTime(),
              expectedSchedule.beginDate.getTime() + expectedSchedule.duration,
              'Wrong stop time'
            );
            assert.strictEqual(manager.cache.get(expectedId).schedules[0], expectedSchedule, 'Wrong schedule');
            scheduleManager.addJob.should.have.been.called.exactly(2);
            browsersPilot.addSchedule.should.have.been.called.with.exactly(expectedDevice, expectedSchedule);
            done();
          }
        );
      });

      it('should execute callback with an error if the device has not been found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          '42',
          {
            beginDate: new Date(new Date().getTime() + 86400000),
            duration: 7200000,
            recurrent: true,
            endDate: new Date(new Date().getTime() + 86400000 * 5)
          },
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if the schedule is not valid', function(done) {
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        browsersPilot.addSchedule = chai.spy(browsersPilot.addSchedule);
        expectedDevice.isValidSchedule = function() {
          return false;
        };
        manager.cache.add(expectedDevice);

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if adding schedule failed', function(done) {
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId});
        expectedDevice.isValidSchedule = function() {
          return true;
        };
        manager.cache.add(expectedDevice);

        scheduleManager.addJob = chai.spy(function(beginDate, endDate, recurrent, func) {
        });

        deviceModel.addSchedule = function(id, schedule, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should be able to add and register a schedule for a group', function(done) {
        var jobs = [];
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        expectedGroup.isValidSchedule = function() {
          return true;
        };
        manager.cache.add(expectedGroup);
        browsersPilot.addSchedule = chai.spy(browsersPilot.addSchedule);

        scheduleManager.addJob = chai.spy(function(beginDate, endDate, recurrent, func) {
          jobs.push({
            beginDate: beginDate,
            endDate: endDate,
            recurrent: recurrent
          });

          assert.isDefined(func, 'Expected a function for the job');
        });

        groupModel.addSchedule = function(id, schedule, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.strictEqual(schedule, expectedSchedule, 'Wrong schedule');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.strictEqual(jobs[0].recurrent, expectedSchedule.recurrent, 'Wrong recurrency');
            assert.strictEqual(
              jobs[0].beginDate.getTime(),
              expectedSchedule.beginDate.getTime(),
              'Wrong start time'
            );
            assert.strictEqual(
              jobs[1].beginDate.getTime(),
              expectedSchedule.beginDate.getTime() + expectedSchedule.duration,
              'Wrong stop time'
            );
            assert.strictEqual(manager.cache.get(expectedId).schedules[0], expectedSchedule, 'Wrong schedule');
            scheduleManager.addJob.should.have.been.called.exactly(2);
            browsersPilot.addSchedule.should.have.been.called.with.exactly(expectedGroup, expectedSchedule);
            done();
          }
        );
      });

      it('should execute callback with an error if the group has not been found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          '42',
          {
            beginDate: new Date(new Date().getTime() + 86400000),
            duration: 7200000,
            recurrent: true,
            endDate: new Date(new Date().getTime() + 86400000 * 5)
          },
          Group.TYPE,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if the schedule is not valid', function(done) {
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        browsersPilot.addSchedule = chai.spy(browsersPilot.addSchedule);
        expectedGroup.isValidSchedule = function() {
          return false;
        };
        manager.cache.add(expectedGroup);

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if adding schedule failed', function(done) {
        var expectedId = '42';
        var expectedSchedule = {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId});
        expectedGroup.isValidSchedule = function() {
          return true;
        };
        manager.cache.add(expectedGroup);

        scheduleManager.addJob = chai.spy(function(beginDate, endDate, recurrent, func) {
        });

        groupModel.addSchedule = function(id, schedule, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_SCHEDULE,
          expectedId,
          expectedSchedule,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

    });

    // REMOVE_SCHEDULE event
    describe('REMOVE_SCHEDULE', function() {

      beforeEach(function() {
        browsersPilot.removeSchedule = function() {

        };
      });

      it('should be able to remove a device\'s schedule', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Device.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedDevice = new Device({id: expectedId, schedules: [expectedSchedule]});
        expectedDevice.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedDevice);
        browsersPilot.removeSchedule = chai.spy(browsersPilot.removeSchedule);

        scheduleManager.removeJob = chai.spy(function() {

        });

        deviceModel.removeSchedule = function(id, scheduleId, callback) {
          assert.equal(id, expectedId, 'Wrong id');
          assert.equal(scheduleId, expectedScheduleId, 'Wrong schedule id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            scheduleManager.removeJob.should.have.been.called.exactly(2);
            browsersPilot.removeSchedule.should.have.been.called.with.exactly(
              manager.cache.get(expectedId),
              expectedScheduleId
            );
            done();
          }
        );
      });

      it('should execute callback with an error if device\'s schedule has not been found', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId, schedules: []});
        expectedDevice.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedDevice);

        scheduleManager.removeJob = function() {

        };

        deviceModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          'unknown',
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if device has not been found', function(done) {
        var expectedScheduleId = '43';
        var expectedType = Device.TYPE;
        scheduleManager.removeJob = function() {

        };

        deviceModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          'unknown',
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if device\'s schedule is running', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Device.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime()),
          duration: 7200000
        };
        var expectedDevice = new Device({id: expectedId, schedules: [expectedSchedule]});
        expectedDevice.isScheduleRunning = function() {
          return true;
        };
        manager.cache.add(expectedDevice);

        scheduleManager.removeJob = function() {

        };

        deviceModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if removing device\'s schedule failed', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Device.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime()),
          duration: 7200000
        };
        var expectedDevice = new Device({id: expectedId, schedules: [expectedSchedule]});
        expectedDevice.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedDevice);

        scheduleManager.removeJob = function() {

        };

        deviceModel.removeSchedule = function(id, scheduleId, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should be able to remove a group\'s schedule', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Group.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 * 5)
        };
        var expectedGroup = new Group({id: expectedId, schedules: [expectedSchedule]});
        expectedGroup.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedGroup);
        browsersPilot.removeSchedule = chai.spy(browsersPilot.removeSchedule);

        scheduleManager.removeJob = chai.spy(function() {

        });

        groupModel.removeSchedule = function(id, scheduleId, callback) {
          assert.equal(id, expectedId, 'Wrong id');
          assert.equal(scheduleId, expectedScheduleId, 'Wrong schedule id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            scheduleManager.removeJob.should.have.been.called.exactly(2);
            browsersPilot.removeSchedule.should.have.been.called.with.exactly(
              manager.cache.get(expectedId),
              expectedScheduleId
            );
            done();
          }
        );
      });

      it('should execute callback with an error if group\'s schedule has not been found', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedGroup = new Group({id: expectedId, schedules: []});
        expectedGroup.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedGroup);

        scheduleManager.removeJob = function() {

        };

        groupModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          'unknown',
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if group has not been found', function(done) {
        var expectedScheduleId = '43';
        var expectedType = Group.TYPE;
        scheduleManager.removeJob = function() {

        };

        groupModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          'unknown',
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if group\'s schedule is running', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Group.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime()),
          duration: 7200000
        };
        var expectedGroup = new Group({id: expectedId, schedules: [expectedSchedule]});
        expectedGroup.isScheduleRunning = function() {
          return true;
        };
        manager.cache.add(expectedGroup);

        scheduleManager.removeJob = function() {

        };

        groupModel.removeSchedule = function(id, scheduleId, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if removing group\'s schedule failed', function(done) {
        var expectedId = '42';
        var expectedScheduleId = '43';
        var expectedType = Group.TYPE;
        var expectedSchedule = {
          id: expectedScheduleId,
          beginDate: new Date(new Date().getTime()),
          duration: 7200000
        };
        var expectedGroup = new Device({id: expectedId, schedules: [expectedSchedule]});
        expectedGroup.isScheduleRunning = function() {
          return false;
        };
        manager.cache.add(expectedGroup);

        scheduleManager.removeJob = function() {

        };

        groupModel.removeSchedule = function(id, scheduleId, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_SCHEDULE,
          expectedId,
          expectedScheduleId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

    });

    // REMOVE_HISTORY event
    describe('REMOVE_HISTORY', function() {

      beforeEach(function() {
        browsersPilot.removeSchedule = function() {

        };
      });

      it('should be able to remove device\'s history', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId, history: [{}]});
        manager.cache.add(expectedDevice);
        browsersPilot.removeHistory = chai.spy(browsersPilot.removeHistory);

        deviceModel.removeHistory = function(id, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          expectedId,
          expectedType,
          function(results) {
            var device = manager.cache.get(expectedId);
            assert.strictEqual(device.history.length, 0, 'Unexpected historic');
            browsersPilot.removeHistory.should.have.been.called.with.exactly(device);
            done();
          }
        );
      });

      it('should execute callback with an error if the device has not been found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          'unknown',
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if removing device\'s history failed', function(done) {
        var expectedId = '42';
        var expectedType = Device.TYPE;
        var expectedDevice = new Device({id: expectedId, history: [{}]});
        manager.cache.add(expectedDevice);

        deviceModel.removeHistory = function(id, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          expectedId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should be able to remove group\'s history', function(done) {
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId, history: [{}]});
        manager.cache.add(expectedGroup);
        browsersPilot.removeHistory = chai.spy(browsersPilot.removeHistory);

        groupModel.removeHistory = function(id, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          expectedId,
          expectedType,
          function(results) {
            var group = manager.cache.get(expectedId);
            assert.strictEqual(group.history.length, 0, 'Unexpected historic');
            browsersPilot.removeHistory.should.have.been.called.with.exactly(group);
            done();
          }
        );
      });

      it('should execute callback with an error if the group has not been found', function(done) {
        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          'unknown',
          Device.TYPE,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if removing group\'s history failed', function(done) {
        var expectedId = '42';
        var expectedType = Group.TYPE;
        var expectedGroup = new Group({id: expectedId, history: [{}]});
        manager.cache.add(expectedGroup);

        groupModel.removeHistory = function(id, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_HISTORY,
          expectedId,
          expectedType,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

    });

    // GET_GROUPS event
    describe('GET_GROUPS', function() {

      it('should execute callback with the list of groups', function(done) {
        var expectedGroup = new Group({id: '42'});
        manager.cache.add(expectedGroup);

        browsersPilot.emit(
          browsersPilot.MESSAGES.GET_GROUPS,
          function(results) {
            assert.strictEqual(results.data[0], expectedGroup, 'Wrong group');
            done();
          }
        );
      });

    });

    // CREATE_GROUP event
    describe('CREATE_GROUP', function() {

      beforeEach(function() {
        browsersPilot.createGroup = function() {

        };
      });

      it('should be able to create a group', function(done) {
        var expectedGroup = {id: '42'};
        browsersPilot.createGroup = chai.spy(browsersPilot.createGroup);

        groupModel.add = function(data, callback) {
          assert.strictEqual(data.history.length, 1, 'Expected an historic');
          callback(null, 1, expectedGroup);
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.CREATE_GROUP,
          function(results) {
            var group = manager.cache.get(expectedGroup.id);
            assert.isDefined(group, 'Expected a group');
            assert.strictEqual(results.group, group, 'Wrong group');
            browsersPilot.createGroup.should.have.been.called.with.exactly(group);
            done();
          }
        );
      });

      it('should execute a callback with an error if group creation failed', function(done) {
        groupModel.add = function(data, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.CREATE_GROUP,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });
    });

    // ADD_DEVICE_TO_GROUP event
    describe('ADD_DEVICE_TO_GROUP', function() {

      beforeEach(function() {
        browsersPilot.addDeviceToGroup = function() {

        };
      });

      it('should add a device to a group', function(done) {
        var expectedDeviceId = '42';
        var expectedGroupId = '43';
        var expectedDevice = new Device({id: expectedDeviceId});
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);
        browsersPilot.addDeviceToGroup = chai.spy(browsersPilot.addDeviceToGroup);

        deviceModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedDeviceId, 'Wrong device id');
          assert.strictEqual(data.group, expectedGroupId, 'Wrong group id');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_DEVICE_TO_GROUP,
          expectedDeviceId,
          expectedGroupId,
          function(results) {
            assert.strictEqual(manager.cache.get(expectedDeviceId).group, expectedGroupId, 'Wrong group');
            browsersPilot.addDeviceToGroup.should.have.been.called.with.exactly(expectedDeviceId, expectedGroupId);
            done();
          }
        );
      });

      it('should execute callback with an error if device has not been found', function(done) {
        var expectedGroupId = '43';
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedGroup);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_DEVICE_TO_GROUP,
          'unknown',
          expectedGroupId,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if group has not been found', function(done) {
        var expectedDeviceId = '42';
        var expectedDevice = new Device({id: expectedDeviceId});
        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_DEVICE_TO_GROUP,
          expectedDeviceId,
          'unknown',
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if schedules are in conflict with group\'s schedules', function(done) {
        var expectedDeviceId = '42';
        var expectedGroupId = '43';
        var expectedDevice = new Device({
          id: expectedDeviceId,
          schedules: [
            {
              beginDate: new Date(new Date().getTime() + 86400000),
              duration: 7200000
            }
          ]
        });
        var expectedGroup = new Group({
          id: expectedGroupId,
          schedules: [
            {
              beginDate: new Date(new Date().getTime() + 86400000),
              duration: 7200000
            }
          ]
        });
        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_DEVICE_TO_GROUP,
          expectedDeviceId,
          expectedGroupId,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if adding device to group failed', function(done) {
        var expectedDeviceId = '42';
        var expectedGroupId = '43';
        var expectedDevice = new Device({id: expectedDeviceId});
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);

        deviceModel.update = function(id, data, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.ADD_DEVICE_TO_GROUP,
          expectedDeviceId,
          expectedGroupId,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

    });

    // REMOVE_DEVICE_FROM_GROUP event
    describe('REMOVE_DEVICE_FROM_GROUP', function() {

      it('should be able to remove a device from a group', function(done) {
        var expectedId = '42';
        var expectedGroupId = '43';
        var expectedDevice = new Device({id: expectedId, group: expectedGroupId});
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);
        browsersPilot.removeDeviceFromGroup = chai.spy(browsersPilot.removeDeviceFromGroup);

        deviceModel.update = function(id, data, callback) {
          assert.strictEqual(id, expectedId, 'Wrong id');
          assert.isNull(data.group, 'Unexpected group');
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_DEVICE_FROM_GROUP,
          expectedId,
          function(results) {
            assert.isNull(manager.cache.get(expectedId).group, 'Unexpected group');
            browsersPilot.removeDeviceFromGroup.should.have.been.called.with.exactly(expectedId);
            done();
          }
        );
      });

      it('should execute callback with an error if device has not been found', function(done) {
        var expectedGroupId = '43';
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedGroup);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_DEVICE_FROM_GROUP,
          'unknown',
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if group has not been found', function(done) {
        var expectedId = '42';
        var expectedDevice = new Device({id: expectedId, group: 'unknown'});
        manager.cache.add(expectedDevice);

        deviceModel.update = function(id, data, callback) {
          callback();
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_DEVICE_FROM_GROUP,
          expectedId,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

      it('should execute callback with an error if removing device from group failed', function(done) {
        var expectedId = '42';
        var expectedGroupId = '43';
        var expectedDevice = new Device({id: expectedId, group: expectedGroupId});
        var expectedGroup = new Group({id: expectedGroupId});
        manager.cache.add(expectedDevice);
        manager.cache.add(expectedGroup);

        deviceModel.update = function(id, data, callback) {
          callback(new Error('message'));
        };

        browsersPilot.emit(
          browsersPilot.MESSAGES.REMOVE_DEVICE_FROM_GROUP,
          expectedId,
          function(results) {
            assert.isDefined(results.error, 'Expected an error');
            done();
          }
        );
      });

    });

  });

  // start method
  describe('start', function() {

    it('should retrieve all devices from database and add them to cache', function(done) {
      var expectedId = '42';
      var expectedDevices = [
        {
          id: expectedId
        }
      ];
      deviceModel.get = function(filter, callback) {
        callback(null, expectedDevices);
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function() {
        var device = manager.cache.get(expectedId);
        assert.isDefined(device, 'Expected a device in cache');
        assert.strictEqual(device.status, devicesPilot.STATUSES.DISCONNECTED, 'Wrong status');
        done();
      });
    });

    it('should retrieve all groups from database and add them to cache', function(done) {
      var expectedId = '42';
      var expectedGroups = [
        {
          id: expectedId
        }
      ];
      groupModel.get = function(filter, callback) {
        callback(null, expectedGroups);
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function() {
        var group = manager.cache.get(expectedId);
        assert.isDefined(group, 'Expected a group in cache');
        done();
      });
    });

    it('should remove and deregister all expired schedules', function(done) {
      var expectedId = '42';
      var expectedScheduleId = '43';
      var expectedDevices = [
        {
          id: expectedId,
          schedules: [
            {
              id: expectedScheduleId,
              beginDate: new Date(new Date().getTime() - 86400000),
              duration: 7200000
            }
          ]
        }
      ];

      deviceModel.get = function(filter, callback) {
        callback(null, expectedDevices);
      };

      deviceModel.removeSchedule = function(id, scheduleId, callback) {
        assert.strictEqual(id, expectedId, 'Wrong id');
        assert.strictEqual(scheduleId, expectedScheduleId, 'Wrong schedule id');
        callback();
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function() {
        var device = manager.cache.get(expectedId);
        assert.strictEqual(device.schedules.length, 0, 'Unexpected schedule');
        done();
      });
    });

    it('should register schedules which are not expired', function(done) {
      var expectedId = '42';
      var expectedScheduleId = '43';
      var expectedDevices = [
        {
          id: expectedId,
          schedules: [
            {
              id: expectedScheduleId,
              beginDate: new Date(new Date().getTime() + 86400000),
              duration: 7200000
            }
          ]
        }
      ];
      scheduleManager.addJob = chai.spy(scheduleManager.addJob);

      deviceModel.get = function(filter, callback) {
        callback(null, expectedDevices);
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function() {
        scheduleManager.addJob.should.have.been.called.exactly(2);
        done();
      });
    });

    it('should execute callback with an error if getting devices failed', function(done) {
      deviceModel.get = function(filter, callback) {
        callback(new Error('message'));
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function(error) {
        assert.instanceOf(error, Error);
        done();
      });
    });

    it('should execute callback with an error if getting groups failed', function(done) {
      groupModel.get = function(filter, callback) {
        callback(new Error('message'));
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function(error) {
        assert.instanceOf(error, Error);
        done();
      });
    });

    it('should execute callback with an error if removing a schedule failed', function(done) {
      var expectedId = '42';
      var expectedScheduleId = '43';
      var expectedDevices = [
        {
          id: expectedId,
          schedules: [
            {
              id: expectedScheduleId,
              beginDate: new Date(new Date().getTime() - 86400000),
              duration: 7200000
            }
          ]
        }
      ];

      deviceModel.get = function(filter, callback) {
        callback(null, expectedDevices);
      };

      deviceModel.removeSchedule = function(id, scheduleId, callback) {
        callback(new Error());
      };

      manager = new Manager(devicesPilot, browsersPilot, deviceModel, groupModel, scheduleManager);
      manager.start(function(error) {
        assert.instanceOf(error, Error);
        done();
      });
    });
  });

  // updateDeviceName method
  describe('updateDeviceName', function() {

    it('should ask for a device\'s name update', function(done) {
      var expectedId = '42';
      var expectedName = 'name';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);

      devicesPilot.askForUpdateName = function(id, name, callback) {
        assert.strictEqual(id, expectedId, 'Wrong id');
        assert.strictEqual(name, expectedName, 'Wrong name');
        callback();
      };

      manager.updateDeviceName(expectedId, expectedName, function(error) {
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should execute callback with an error if device was not found', function(done) {
      manager.updateDeviceName('unkown', 'name', function(error) {
        assert.instanceOf(error, openVeoApi.errors.NotFoundError);
        done();
      });
    });

    it('should execute callback with an error and add error to historic if updating failed', function(done) {
      var expectedId = '42';
      var expectedName = 'name';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);
      deviceModel.addHistoric = chai.spy(deviceModel.addHistoric);

      devicesPilot.askForUpdateName = function(id, name, callback) {
        callback(new Error('message'));
      };

      manager.updateDeviceName(expectedId, expectedName, function(error) {
        assert.instanceOf(error, Error);
        deviceModel.addHistoric.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  // updateGroupName method
  describe('updateGroupName', function() {

    it('should update a group\'s name', function(done) {
      var expectedId = '42';
      var expectedName = 'name';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);

      groupModel.update = function(id, data, callback) {
        assert.strictEqual(id, expectedId, 'Wrong id');
        assert.strictEqual(data.name, expectedName, 'Wrong name');
        callback();
      };

      manager.updateGroupName(expectedId, expectedName, function(error) {
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should execute callback with an error if group was not found', function(done) {
      manager.updateGroupName('unkown', 'name', function(error) {
        assert.instanceOf(error, openVeoApi.errors.NotFoundError);
        done();
      });
    });

    it('should execute callback with an error and add error to historic if updating failed', function(done) {
      var expectedId = '42';
      var expectedName = 'name';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);
      groupModel.addHistoric = chai.spy(groupModel.addHistoric);

      groupModel.update = function(id, name, callback) {
        callback(new Error('message'));
      };

      manager.updateGroupName(expectedId, expectedName, function(error) {
        assert.instanceOf(error, Error);
        groupModel.addHistoric.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  // removeFromCache method
  describe('removeFromCache', function() {

    beforeEach(function() {
      browsersPilot.remove = function() {

      };
    });

    it('should remove a device from cache', function() {
      var expectedId = '42';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);
      browsersPilot.remove = chai.spy(browsersPilot.remove);

      manager.removeFromCache(expectedId);

      assert.isUndefined(manager.cache.get(expectedId));
      browsersPilot.remove.should.have.been.called.exactly(1);
    });

    it('should remove a group from cache', function() {
      var expectedId = '42';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);
      browsersPilot.remove = chai.spy(browsersPilot.remove);

      manager.removeFromCache(expectedId);

      assert.isUndefined(manager.cache.get(expectedId));
      browsersPilot.remove.should.have.been.called.exactly(1);
    });
  });

  // getDevices method
  describe('getDevices', function() {

    it('should return the list of devices in cache', function() {
      var expectedId = '42';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);

      var devices = manager.getDevices();

      assert.strictEqual(devices[0], expectedDevice);
    });

    it('should return an empty array if no device in cache', function() {
      var devices = manager.getDevices();
      assert.strictEqual(devices.length, 0);
    });

  });

  // getGroups method
  describe('getGroups', function() {

    it('should return the list of groups in cache', function() {
      var expectedId = '42';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);

      var groups = manager.getGroups();

      assert.strictEqual(groups[0], expectedGroup);
    });

    it('should return an empty array if no group in cache', function() {
      var groups = manager.getGroups();
      assert.strictEqual(groups.length, 0);
    });

  });

  // removeDevice method
  describe('removeDevice', function() {

    beforeEach(function() {
      browsersPilot.remove = function() {

      };
    });

    it('should remove a device from database and cache', function(done) {
      var expectedId = '42';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);
      browsersPilot.remove = chai.spy(browsersPilot.remove);

      deviceModel.remove = function(id, callback) {
        assert.strictEqual(id, expectedId, 'Wrong id');
        callback();
      };

      manager.removeDevice(expectedId, function(error) {
        browsersPilot.remove.should.have.been.called.with.exactly(expectedDevice);
        assert.isUndefined(manager.cache.get(expectedId), 'Unexpected device');
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should deregister schedule jobs associated to the device', function(done) {
      var expectedId = '42';
      var expectedDevice = new Device({
        id: expectedId,
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 86400000),
            duration: 7200000
          }
        ]
      });
      manager.cache.add(expectedDevice);
      scheduleManager.removeJob = chai.spy(scheduleManager.removeJob);

      deviceModel.remove = function(id, callback) {
        callback();
      };

      manager.removeDevice(expectedId, function(error) {
        scheduleManager.removeJob.should.have.been.called.exactly(2);
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should remove device\'s group if no more devices in the group', function(done) {
      var expectedId = '42';
      var expectedGroupId = '43';
      var expectedDevice = new Device({id: expectedId, group: expectedGroupId});
      var expectedGroup = new Group({id: expectedGroupId});
      manager.cache.add(expectedDevice);
      manager.cache.add(expectedGroup);

      deviceModel.remove = function(id, callback) {
        callback();
      };

      deviceModel.update = function(id, data, callback) {
        callback();
      };

      groupModel.remove = function(id, callback) {
        assert.strictEqual(id, expectedGroupId, 'Wrong group id');
        callback();
      };

      manager.removeDevice(expectedId, function(error) {
        assert.isUndefined(manager.cache.get(expectedGroupId), 'Unexpected group');
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should execute callback with an error if removing the device failed', function(done) {
      var expectedId = '42';
      var expectedDevice = new Device({id: expectedId});
      manager.cache.add(expectedDevice);

      deviceModel.remove = function(id, callback) {
        callback(new Error('message'));
      };

      manager.removeDevice(expectedId, function(error) {
        assert.instanceOf(error, Error, 'Expected an error');
        done();
      });
    });

    it('should execute callback with an error if removing the associated group failed', function(done) {
      var expectedId = '42';
      var expectedGroupId = '43';
      var expectedDevice = new Device({id: expectedId, group: expectedGroupId});
      var expectedGroup = new Group({id: expectedGroupId});
      manager.cache.add(expectedDevice);
      manager.cache.add(expectedGroup);

      deviceModel.remove = function(id, callback) {
        callback();
      };

      deviceModel.update = function(id, data, callback) {
        callback();
      };

      groupModel.remove = function(id, callback) {
        callback(new Error('message'));
      };

      manager.removeDevice(expectedId, function(error) {
        assert.instanceOf(error, Error, 'Expected an error');
        done();
      });
    });

  });

  // removeGroup method
  describe('removeGroup', function() {

    beforeEach(function() {
      browsersPilot.remove = function() {

      };
    });

    it('should remove a group from database and cache', function(done) {
      var expectedId = '42';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);
      browsersPilot.remove = chai.spy(browsersPilot.remove);

      groupModel.remove = function(id, callback) {
        assert.strictEqual(id, expectedId, 'Wrong group id');
        callback();
      };

      manager.removeGroup(expectedId, function(error) {
        assert.isUndefined(error, 'Unexpected an error');
        assert.isUndefined(manager.cache.get(expectedId), 'Unexpected group');
        browsersPilot.remove.should.have.been.called.with.exactly(expectedGroup);
        done();
      });
    });

    it('should deregister schedule jobs associated to the device', function(done) {
      var expectedId = '42';
      var expectedGroup = new Group({
        id: expectedId,
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 86400000),
            duration: 7200000
          }
        ]
      });
      manager.cache.add(expectedGroup);
      scheduleManager.removeJob = chai.spy(scheduleManager.removeJob);

      groupModel.remove = function(id, callback) {
        callback();
      };

      manager.removeGroup(expectedId, function(error) {
        scheduleManager.removeJob.should.have.been.called.exactly(2);
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should dissociate all group\'s devices', function(done) {
      var expectedId = '42';
      var expectedDeviceId = '43';
      var expectedGroup = new Group({id: expectedId});
      var expectedDevice = new Device({id: expectedDeviceId, group: expectedId});
      manager.cache.add(expectedGroup);
      manager.cache.add(expectedDevice);

      deviceModel.update = function(id, data, callback) {
        assert.strictEqual(id, expectedDeviceId, 'Wrong device id');
        assert.isNull(data.group, 'Unexpected group');
        callback();
      };

      groupModel.remove = function(id, callback) {
        callback();
      };

      manager.removeGroup(expectedId, function(error) {
        assert.isNull(manager.cache.get(expectedDeviceId).group, 'Unexpected associated group');
        assert.isUndefined(error, 'Unexpected error');
        done();
      });
    });

    it('should execute callback with an error if dissociated group from its devices failed', function(done) {
      var expectedId = '42';
      var expectedDeviceId = '43';
      var expectedGroup = new Group({id: expectedId});
      var expectedDevice = new Device({id: expectedDeviceId, group: expectedId});
      manager.cache.add(expectedGroup);
      manager.cache.add(expectedDevice);

      deviceModel.update = function(id, data, callback) {
        callback(new Error('message'));
      };

      groupModel.remove = function(id, callback) {
        callback();
      };

      manager.removeGroup(expectedId, function(error) {
        assert.instanceOf(error, Error, 'Expected an error');
        done();
      });
    });

    it('should execute callback with an error if removing group failed', function(done) {
      var expectedId = '42';
      var expectedGroup = new Group({id: expectedId});
      manager.cache.add(expectedGroup);

      groupModel.remove = function(id, callback) {
        callback(new Error('message'));
      };

      manager.removeGroup(expectedId, function(error) {
        assert.instanceOf(error, Error, 'Expected an error');
        done();
      });
    });

  });

});
