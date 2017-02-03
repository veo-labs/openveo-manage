'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');
var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var AdvancedEvent = openVeoApi.emitters.AdvancedEvent;
var assert = chai.assert;

chai.should();
chai.use(spies);

// BrowserPilot.js
describe('BrowserPilot', function() {
  var emitter;
  var namespace;
  var pilot;

  // Prepare tests
  beforeEach(function() {
    emitter = new openVeoApi.emitters.AdvancedEmitter();
    namespace = new openVeoApi.socket.SocketNamespace();
    pilot = new BrowserPilot(emitter, namespace);
  });

  // MESSAGES property
  describe('MESSAGES', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        pilot.MESSAGES = null;
      });
    });

    it('should expose the list of dispatched browsers\' messages', function() {
      assert.strictEqual(pilot.MESSAGES, BROWSERS_MESSAGES);
    });
  });

  // constructor
  describe('constructor', function() {

    it('should handle CONNECTED messages', function() {
      var expectedSocket = {id: '42'};
      pilot.on(BROWSERS_MESSAGES.CONNECTED, function(id) {
        assert.strictEqual(id, expectedSocket.id, 'Wrong id');
        assert.equal(pilot.clients[0].id, expectedSocket.id, 'Wrong client id');
        assert.strictEqual(pilot.clients[0].socket, expectedSocket, 'Wrong socket');
      });
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.CONNECTED, expectedSocket));
    });

    it('should handle DISCONNECTED messages', function() {
      var expectedSocket = {id: '42'};
      pilot.on(BROWSERS_MESSAGES.DISCONNECTED, function(id) {
        assert.strictEqual(id, expectedSocket.id, 'Wrong id');
        assert.equal(pilot.clients.length, 0, 'Unexpected client');
      });
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.CONNECTED, expectedSocket));
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.DISCONNECTED, expectedSocket));
    });

    it('should handle ERROR messages', function() {
      var expectedSocket = {id: '42'};
      var expectedError = new Error();
      pilot.on(BROWSERS_MESSAGES.ERROR, function(error, id) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        assert.strictEqual(id, expectedSocket.id, 'Wrong id');
      });
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.CONNECTED, expectedSocket));
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.ERROR, expectedError, expectedSocket));
    });

    it('should emit all other events', function() {
      emitter.emitEvent(new AdvancedEvent(BROWSERS_MESSAGES.UPDATE_NAME));
      var events = [
        BROWSERS_MESSAGES.UPDATE_NAME,
        BROWSERS_MESSAGES.REMOVE,
        BROWSERS_MESSAGES.REMOVE_HISTORIC,
        BROWSERS_MESSAGES.ADD_SCHEDULE,
        BROWSERS_MESSAGES.REMOVE_SCHEDULE,
        BROWSERS_MESSAGES.REMOVE_HISTORY,
        BROWSERS_MESSAGES.GET_DEVICES,
        BROWSERS_MESSAGES.GET_DEVICE_SETTINGS,
        BROWSERS_MESSAGES.UPDATE_DEVICE_STATE,
        BROWSERS_MESSAGES.START_DEVICE_SESSION,
        BROWSERS_MESSAGES.STOP_DEVICE_SESSION,
        BROWSERS_MESSAGES.INDEX_DEVICE_SESSION,
        BROWSERS_MESSAGES.GET_GROUPS,
        BROWSERS_MESSAGES.CREATE_GROUP,
        BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP,
        BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP
      ];
      events.forEach(function(event) {
        var expectedData = {};
        pilot.on(event, function(data) {
          assert.strictEqual(data, expectedData);
        });
        emitter.emitEvent(new AdvancedEvent(event, expectedData));
      });
    });
  });

  // get method
  describe('get', function() {

    it('should be able to get the BrowserPilot singleton', function() {
      assert.instanceOf(BrowserPilot.get(emitter, namespace), BrowserPilot);
    });

  });

  // connectDevice method
  describe('connectDevice', function() {

    it('should be able to inform all browsers about a new connected device', function() {
      var expectedDevice = {id: '42'};
      namespace.emit = function(message, device) {
        assert.equal(message, 'device.connected', 'Wrong message');
        assert.strictEqual(device, expectedDevice, 'Wrong device');
      };

      pilot.connectDevice(expectedDevice);
    });

  });

  // remove method
  describe('remove', function() {

    it('should be able to inform all browsers that a manageable has been removed', function() {
      var expectedManageable = {id: '42', type: 'type'};
      namespace.emit = function(message, manageable) {
        assert.equal(message, 'removed', 'Wrong message');
        assert.strictEqual(manageable.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(manageable.type, expectedManageable.type, 'Wrong type');
      };

      pilot.remove(expectedManageable);
    });

  });

  // update method
  describe('update', function() {

    it('should be able to inform all browsers that a manageable has been updated', function() {
      var expectedManageable = {id: '42', type: 'type'};
      var expectedProperty = 'property';
      var expectedValue = 'value';
      namespace.emit = function(message, data) {
        assert.equal(message, 'updated', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
        assert.strictEqual(data.key, expectedProperty, 'Wrong property');
        assert.strictEqual(data.value, expectedValue, 'Wrong value');
      };

      pilot.update(expectedManageable, expectedProperty, expectedValue);
    });

  });

  // addSchedule method
  describe('addSchedule', function() {

    it('should be able to inform all browsers that a schedule has been added to a manageable', function() {
      var expectedManageable = {id: '42', type: 'type'};
      var expectedSchedule = {};
      namespace.emit = function(message, data) {
        assert.equal(message, 'newSchedule', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
        assert.strictEqual(data.schedule, expectedSchedule, 'Wrong schedule');
      };

      pilot.addSchedule(expectedManageable, expectedSchedule);
    });

  });

  // removeSchedule method
  describe('removeSchedule', function() {

    it('should be able to inform all browsers that a schedule has been removed from a manageable', function() {
      var expectedManageable = {id: '42', type: 'type'};
      var expectedScheduleId = '43';
      namespace.emit = function(message, data) {
        assert.equal(message, 'removedSchedule', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
        assert.strictEqual(data.scheduleId, expectedScheduleId, 'Wrong schedule id');
      };

      pilot.removeSchedule(expectedManageable, expectedScheduleId);
    });

  });

  // addHistoric method
  describe('addHistoric', function() {

    it('should be able to inform all browsers that an historic has been added to a manageable', function() {
      var expectedManageable = {id: '42', type: 'type'};
      var expectedHistoric = {};
      namespace.emit = function(message, data) {
        assert.equal(message, 'newHistoric', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
        assert.strictEqual(data.historic, expectedHistoric, 'Wrong historic');
      };

      pilot.addHistoric(expectedManageable, expectedHistoric);
    });

  });

  // removeHistoric method
  describe('removeHistoric', function() {

    it('should be able to inform all browsers that an historic has been removed from a manageable', function() {
      var expectedManageable = {id: '42', type: 'type'};
      var expectedHistoricId = '43';
      namespace.emit = function(message, data) {
        assert.equal(message, 'removedHistoric', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
        assert.strictEqual(data.historicId, expectedHistoricId, 'Wrong historic id');
      };

      pilot.removeHistoric(expectedManageable, expectedHistoricId);
    });

  });

  // removeHistory method
  describe('removeHistory', function() {

    it('should be able to inform all browsers that an historic has been removed from a manageable', function() {
      var expectedManageable = {id: '42', type: 'type'};
      namespace.emit = function(message, data) {
        assert.equal(message, 'removedHistory', 'Wrong message');
        assert.strictEqual(data.id, expectedManageable.id, 'Wrong id');
        assert.strictEqual(data.type, expectedManageable.type, 'Wrong type');
      };

      pilot.removeHistory(expectedManageable);
    });

  });

  // updateDeviceState method
  describe('updateDeviceState', function() {

    it('should be able to inform all browsers that a device state has changed', function() {
      var expectedId = '42';
      var expectedState = 'state';
      namespace.emit = function(message, data) {
        assert.equal(message, 'device.updatedState', 'Wrong message');
        assert.strictEqual(data.id, expectedId, 'Wrong id');
        assert.strictEqual(data.state, expectedState, 'Wrong state');
      };

      pilot.updateDeviceState(expectedId, expectedState);
    });

  });

  // createGroup method
  describe('createGroup', function() {

    it('should be able to inform all browsers that a group has been created', function() {
      var expectedGroup = {};
      namespace.emit = function(message, data) {
        assert.equal(message, 'group.created', 'Wrong message');
        assert.strictEqual(data.group, expectedGroup, 'Wrong group');
      };

      pilot.createGroup(expectedGroup);
    });

  });

  // addDeviceToGroup method
  describe('addDeviceToGroup', function() {

    it('should be able to inform all browsers that a device has been added to a group', function() {
      var expectedDeviceId = '42';
      var expectedGroupId = '43';
      namespace.emit = function(message, data) {
        assert.equal(message, 'group.newDevice', 'Wrong message');
        assert.strictEqual(data.deviceId, expectedDeviceId, 'Wrong device id');
        assert.strictEqual(data.groupId, expectedGroupId, 'Wrong group id');
      };

      pilot.addDeviceToGroup(expectedDeviceId, expectedGroupId);
    });

  });

  // removeDeviceFromGroup method
  describe('removeDeviceFromGroup', function() {

    it('should be able to inform all browsers that a device has been removed from a group', function() {
      var expectedDeviceId = '42';
      namespace.emit = function(message, data) {
        assert.equal(message, 'group.removedDevice', 'Wrong message');
        assert.strictEqual(data.id, expectedDeviceId, 'Wrong device id');
      };

      pilot.removeDeviceFromGroup(expectedDeviceId);
    });

  });
});
