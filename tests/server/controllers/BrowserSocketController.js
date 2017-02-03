'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var BrowserSocketController = process.requireManage('app/server/controllers/BrowserSocketController.js');
var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');
var BROWSERS_MESSAGES = process.requireManage('app/server/browsersMessages.js');
var ERRORS = process.requireManage('app/server/errors.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// BrowserSocketController.js
describe('BrowserSocketController', function() {
  var controller;

  // Prepare tests
  beforeEach(function() {
    controller = new BrowserSocketController(new openVeoApi.socket.SocketNamespace());
  });

  // pilot property
  describe('pilot property', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        controller.pilot = null;
      });
    });

    it('should be a BrowserPilot', function() {
      assert.instanceOf(controller.pilot, BrowserPilot);
    });

  });

  // updateNameAction method
  describe('updateNameAction', function() {

    it('should emit an UPDATE_NAME event', function() {
      var expectedData = {id: '42', name: 'name', type: 'type'};
      controller.emitter.on(BROWSERS_MESSAGES.UPDATE_NAME, function(eventName, id, name, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.UPDATE_NAME, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(name, expectedData.name, 'Wrong name');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.updateNameAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id, name or type is not valid', function() {
      var expectedData = {id: '42', name: 'name', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.UPDATE_NAME_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.updateNameAction({
        name: expectedData.name,
        type: expectedData.type
      }, {}, callback);

      controller.updateNameAction({
        id: expectedData.id,
        type: expectedData.type
      }, {}, callback);

      controller.updateNameAction({
        id: expectedData.id,
        name: expectedData.name
      }, {}, callback);
    });
  });

  // removeAction method
  describe('removeAction', function() {

    it('should emit a REMOVE event', function() {
      var expectedData = {id: '42', type: 'type'};
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE, function(eventName, id, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.REMOVE, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.removeAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id or type is not valid', function() {
      var expectedData = {id: '42', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.REMOVE_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.removeAction({
        type: expectedData.type
      }, {}, callback);

      controller.removeAction({
        id: expectedData.id
      }, {}, callback);
    });
  });

  // removeHistoricAction method
  describe('removeHistoricAction', function() {

    it('should emit a REMOVE event', function() {
      var expectedData = {id: '42', historicId: '43', type: 'type'};
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_HISTORIC, function(eventName, id, historicId, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.REMOVE_HISTORIC, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(historicId, expectedData.historicId, 'Wrong historic id');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.removeHistoricAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id, historicId or type is not valid', function() {
      var expectedData = {id: '42', historicId: '43', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.REMOVE_HISTORIC_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.removeHistoricAction({
        historicId: expectedData.historicId,
        type: expectedData.type
      }, {}, callback);

      controller.removeHistoricAction({
        id: expectedData.id,
        type: expectedData.type
      }, {}, callback);

      controller.removeHistoricAction({
        id: expectedData.id,
        historicId: expectedData.historicId
      }, {}, callback);
    });
  });

  // addScheduleAction method
  describe('addScheduleAction', function() {

    it('should emit an ADD_SCHEDULE event', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset',
          recurrent: false
        }
      };
      var expectedBeginDate = new Date(expectedData.schedule.beginDate.getTime());
      expectedBeginDate.setSeconds(0);

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function(eventName, id, schedule, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.ADD_SCHEDULE, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(schedule.beginDate.getTime(), expectedBeginDate.getTime(), 'Wrong begin date');
        assert.strictEqual(schedule.duration, expectedData.schedule.duration, 'Wrong duration');
        assert.strictEqual(schedule.preset, expectedData.schedule.preset, 'Wrong preset');
        assert.strictEqual(schedule.recurrent, expectedData.schedule.recurrent, 'Wrong recurrence');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.addScheduleAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });

    });

    it('should accept an end date', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset',
          endDate: new Date(new Date().getTime() + 864000000)
        }
      };
      var expectedEndDate = new Date(expectedData.schedule.endDate.getTime());
      expectedEndDate.setSeconds(0);

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function(eventName, id, schedule, type, callback) {
        assert.strictEqual(schedule.endDate.getTime(), expectedEndDate.getTime(), 'Wrong end date');
      });

      controller.addScheduleAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should ignore begin and end date seconds', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset',
          endDate: new Date(new Date().getTime() + 864000000)
        }
      };

      expectedData.schedule.beginDate.setSeconds(42);
      expectedData.schedule.endDate.setSeconds(42);

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function(eventName, id, schedule, type, callback) {
        assert.equal(schedule.beginDate.getSeconds(), 0, 'Unexpected seconds for the begin date');
        assert.equal(schedule.endDate.getSeconds(), 0, 'Unexpected seconds for the end date');
      });

      controller.addScheduleAction(expectedData, {}, function(error) {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should add 1 second to daily end if it is in collision with a running schedule', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset',
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000 + 3600000)
        }
      };

      expectedData.schedule.beginDate.setSeconds(0);
      expectedData.schedule.endDate.setSeconds(0);

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function(eventName, id, schedule, type, callback) {
        var expectedTime = expectedData.schedule.beginDate.getTime() + expectedData.schedule.duration + 1000;
        assert.equal(schedule.endDate.getTime(), expectedTime, 'Expected end date to be one second later');
      });

      controller.addScheduleAction(expectedData, {}, function(error) {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if the begin date is in the past', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() - 42),
          duration: 3600000,
          preset: 'preset'
        }
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addScheduleAction(expectedData, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      });
    });

    it('should execute callback with an error if the end date is before or equal to the begin date', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset',
          endDate: new Date(new Date().getTime() + 86400000)
        }
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addScheduleAction(expectedData, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      });
    });

    it('should execute callback with an error if the duration is greater than 24 hours', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 86400000,
          preset: 'preset'
        }
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addScheduleAction(expectedData, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      });
    });

    it('should execute callback with an error if either id, schedule or type is not valid', function() {
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000,
          preset: 'preset'
        }
      };
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addScheduleAction({
        type: expectedData.type,
        schedule: expectedData.schedule
      }, {}, callback);

      controller.addScheduleAction({
        id: expectedData.id,
        schedule: expectedData.schedule
      }, {}, callback);

      controller.addScheduleAction({
        id: expectedData.id,
        type: expectedData.type
      }, {}, callback);
    });

    it('should execute callback with an error if either begin date, duration or preset is not valid', function() {
      var expectedSchedule = {
        beginDate: new Date(new Date().getTime() + 86400000),
        duration: 3600000,
        preset: 'preset'
      };
      var expectedData = {
        id: '42',
        type: 'type',
        schedule: expectedSchedule
      };
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addScheduleAction({
        id: expectedData.id,
        type: expectedData.type,
        schedule: {
          duration: expectedSchedule.duration,
          preset: expectedSchedule.preset
        }
      }, {}, callback);

      controller.addScheduleAction({
        id: expectedData.id,
        type: expectedData.type,
        schedule: {
          beginDate: expectedSchedule.beginDate,
          preset: expectedSchedule.preset
        }
      }, {}, callback);

      controller.addScheduleAction({
        id: expectedData.id,
        type: expectedData.type,
        schedule: {
          beginDate: expectedSchedule.beginDate,
          duration: expectedSchedule.duration
        }
      }, {}, callback);
    });

  });

  // removeScheduleAction method
  describe('removeScheduleAction', function() {

    it('should emit a REMOVE_SCHEDULE event', function() {
      var expectedData = {id: '42', scheduleId: '43', type: 'type'};
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_SCHEDULE, function(eventName, id, scheduleId, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.REMOVE_SCHEDULE, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(scheduleId, expectedData.scheduleId, 'Wrong schedule id');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.removeScheduleAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id, scheduleId or type is not valid', function() {
      var expectedData = {id: '42', scheduleId: '43', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.REMOVE_SCHEDULE_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_SCHEDULE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.removeScheduleAction({
        scheduleId: expectedData.scheduleId,
        type: expectedData.type
      }, {}, callback);

      controller.removeScheduleAction({
        id: expectedData.id,
        type: expectedData.type
      }, {}, callback);

      controller.removeScheduleAction({
        id: expectedData.id,
        scheduleId: expectedData.scheduleId
      }, {}, callback);
    });

  });

  // removeHistoryAction method
  describe('removeHistoryAction', function() {

    it('should emit a REMOVE_HISTORY event', function() {
      var expectedData = {id: '42', type: 'type'};
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_HISTORY, function(eventName, id, type, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.REMOVE_HISTORY, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(type, expectedData.type, 'Wrong type');
      });

      controller.removeHistoryAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id, scheduleId or type is not valid', function() {
      var expectedData = {id: '42', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.REMOVE_HISTORY_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_HISTORY, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.removeHistoryAction({
        type: expectedData.type
      }, {}, callback);

      controller.removeHistoryAction({
        id: expectedData.id
      }, {}, callback);
    });

  });

  // getDevicesAction method
  describe('getDevicesAction', function() {

    it('should emit a GET_DEVICES event', function() {
      controller.emitter.on(BROWSERS_MESSAGES.GET_DEVICES, function(eventName, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.GET_DEVICES, 'Wrong event name');
      });

      controller.getDevicesAction(null, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });

  // getDeviceSettingsAction method
  describe('getDeviceSettingsAction', function() {

    it('should emit a GET_DEVICE_SETTINGS event', function() {
      var expectedData = {ids: []};
      controller.emitter.on(BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, function(eventName, ids, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, 'Wrong event name');
        assert.strictEqual(ids, expectedData.ids, 'Wrong ids');
      });

      controller.getDevicesAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either ids is not valid', function() {
      controller.emitter.on(BROWSERS_MESSAGES.GET_DEVICE_SETTINGS, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.getDeviceSettingsAction({}, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.GET_DEVICE_SETTINGS_WRONG_PARAMETERS, 'Wrong error');
      });
    });

  });

  // updateDeviceStateAction method
  describe('updateDeviceStateAction', function() {

    it('should emit an UPDATE_DEVICE_STATE event', function() {
      var expectedData = {id: '42', state: 'state'};
      controller.emitter.on(BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, function(eventName, id, state, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
        assert.strictEqual(state, expectedData.state, 'Wrong state');
      });

      controller.updateDeviceStateAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either id or type is not valid', function() {
      var expectedData = {id: '42', type: 'type'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.UPDATE_DEVICE_STATE_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.UPDATE_DEVICE_STATE, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.updateDeviceStateAction({
        type: expectedData.type
      }, {}, callback);

      controller.updateDeviceStateAction({
        id: expectedData.id
      }, {}, callback);
    });
  });

  // startDeviceSessionAction method
  describe('startDeviceSessionAction', function() {

    it('should emit a START_DEVICE_SESSION event', function() {
      var expectedData = {ids: ['42'], presetId: 'preset'};
      controller.emitter.on(BROWSERS_MESSAGES.START_DEVICE_SESSION, function(eventName, ids, presetId, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.START_DEVICE_SESSION, 'Wrong event name');
        assert.deepEqual(ids, expectedData.ids, 'Wrong ids');
        assert.strictEqual(presetId, expectedData.presetId, 'Wrong presetId');
      });

      controller.startDeviceSessionAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if ids is not valid', function() {
      controller.emitter.on(BROWSERS_MESSAGES.START_DEVICE_SESSION, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.startDeviceSessionAction({}, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.START_DEVICE_SESSION_WRONG_PARAMETERS, 'Wrong error');
      });
    });

  });

  // stopDeviceSessionAction method
  describe('stopDeviceSessionAction', function() {

    it('should emit a STOP_DEVICE_SESSION event', function() {
      var expectedData = {ids: ['42']};
      controller.emitter.on(BROWSERS_MESSAGES.STOP_DEVICE_SESSION, function(eventName, ids, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.STOP_DEVICE_SESSION, 'Wrong event name');
        assert.deepEqual(ids, expectedData.ids, 'Wrong ids');
      });

      controller.stopDeviceSessionAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if ids is not valid', function() {
      controller.emitter.on(BROWSERS_MESSAGES.STOP_DEVICE_SESSION, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.stopDeviceSessionAction({}, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.STOP_DEVICE_SESSION_WRONG_PARAMETERS, 'Wrong error');
      });
    });

  });

  // indexDeviceSessionAction method
  describe('indexDeviceSessionAction', function() {

    it('should emit an INDEX_DEVICE_SESSION event', function() {
      var expectedData = {ids: ['42']};
      controller.emitter.on(BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, function(eventName, ids, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, 'Wrong event name');
        assert.deepEqual(ids, expectedData.ids, 'Wrong ids');
      });

      controller.indexDeviceSessionAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if ids is not valid', function() {
      controller.emitter.on(BROWSERS_MESSAGES.INDEX_DEVICE_SESSION, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.indexDeviceSessionAction({}, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.INDEX_DEVICE_SESSION_WRONG_PARAMETERS, 'Wrong error');
      });
    });

  });

  // getGroupsAction method
  describe('getGroupsAction', function() {

    it('should emit a GET_GROUPS event', function() {
      controller.emitter.on(BROWSERS_MESSAGES.GET_GROUPS, function(eventName, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.GET_GROUPS, 'Wrong event name');
      });

      controller.getGroupsAction(null, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });

  // createGroupAction method
  describe('createGroupAction', function() {

    it('should emit a CREATE_GROUP event', function() {
      controller.emitter.on(BROWSERS_MESSAGES.CREATE_GROUP, function(eventName, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.CREATE_GROUP, 'Wrong event name');
      });

      controller.createGroupAction(null, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });

  // addDeviceToGroupAction method
  describe('addDeviceToGroupAction', function() {

    it('should emit an ADD_DEVICE_TO_GROUP event', function() {
      var expectedData = {deviceId: '42', groupId: '43'};
      controller.emitter.on(BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, function(eventName, deviceId, groupId, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, 'Wrong event name');
        assert.strictEqual(deviceId, expectedData.deviceId, 'Wrong deviceId');
        assert.strictEqual(groupId, expectedData.groupId, 'Wrong groupId');
      });

      controller.addDeviceToGroupAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either deviceId or groupId is not valid', function() {
      var expectedData = {deviceId: '42', groupId: '43'};
      var callback = function(error) {
        assert.strictEqual(error.error, ERRORS.ADD_DEVICE_TO_GROUP_WRONG_PARAMETERS, 'Wrong error');
      };

      controller.emitter.on(BROWSERS_MESSAGES.ADD_DEVICE_TO_GROUP, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.addDeviceToGroupAction({
        groupId: expectedData.groupId
      }, {}, callback);

      controller.addDeviceToGroupAction({
        deviceId: expectedData.deviceId
      }, {}, callback);
    });

  });

  // removeDeviceFromGroupAction method
  describe('removeDeviceFromGroupAction', function() {

    it('should emit a REMOVE_DEVICE_FROM_GROUP event', function() {
      var expectedData = {id: '42'};
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, function(eventName, id, callback) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, 'Wrong event name');
        assert.strictEqual(id, expectedData.id, 'Wrong id');
      });

      controller.removeDeviceFromGroupAction(expectedData, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

    it('should execute callback with an error if either deviceId or groupId is not valid', function() {
      controller.emitter.on(BROWSERS_MESSAGES.REMOVE_DEVICE_FROM_GROUP, function() {
        assert.ok(false, 'Unexpected event');
      });

      controller.removeDeviceFromGroupAction({}, {}, function(error) {
        assert.strictEqual(error.error, ERRORS.REMOVE_DEVICE_FROM_GROUP_WRONG_PARAMETERS, 'Wrong error');
      });
    });

  });

  // connectAction method
  describe('connectAction', function() {

    it('should emit a CONNECTED event', function() {
      controller.emitter.on(BROWSERS_MESSAGES.CONNECTED, function(eventName) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.CONNECTED, 'Wrong event name');
      });

      controller.connectAction({}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });

  // disconnectAction method
  describe('disconnectAction', function() {

    it('should emit a DISCONNECTED event', function() {
      controller.emitter.on(BROWSERS_MESSAGES.DISCONNECTED, function(eventName) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.DISCONNECTED, 'Wrong event name');
      });

      controller.disconnectAction({}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });

  // errorAction method
  describe('errorAction', function() {

    it('should emit an ERROR event', function() {
      var expectedError = new Error();
      controller.emitter.on(BROWSERS_MESSAGES.ERROR, function(eventName, error) {
        assert.strictEqual(eventName, BROWSERS_MESSAGES.ERROR, 'Wrong event name');
        assert.strictEqual(error, expectedError, 'Wrong error');
      });

      controller.errorAction(expectedError, {}, function() {
        assert.ok(false, 'Unexpected execution of the callback');
      });
    });

  });
});
