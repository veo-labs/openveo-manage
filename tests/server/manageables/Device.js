'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var Device = process.requireManage('app/server/manageables/Device.js');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// Device.js
describe('Device', function() {

  it('should be a Manageable', function() {
    assert.instanceOf(new Device({}), Manageable);
  });

  it('should set default inputs', function() {
    var device = new Device({});
    assert.equal(device.inputs.camera, 'disconnected', 'Expected camera to be disconnected');
    assert.equal(device.inputs.desktop, 'disconnected', 'Expected desktop to be disconnected');
  });

  it('should set default presets', function() {
    var device = new Device({});
    assert.equal(device.presets.length, 0);
  });

  // type property
  describe('type', function() {

    it('should not be editable', function() {
      var device = new Device({});
      assert.throws(function() {
        device.type = null;
      });
    });

  });

  // TYPE property
  describe('TYPE', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        Device.TYPE = null;
      });
    });

  });

  // setStorage method
  describe('setStorage', function() {

    it('should be able to set storage information in GBytes', function() {
      var device = new Device({});
      var free = 80000000000;
      var used = 40000000000;
      device.setStorage(free, used);

      assert.equal(device.storage.free, free / 1000000000);
      assert.equal(device.storage.used, used / 1000000000);
      assert.equal(device.storage.total, (free + used) / 1000000000);
      assert.equal(device.storage.percent, (used / (free + used)) * 100);
    });

    it('should not set storage information if both free and used are set to 0', function() {
      var device = new Device({});
      device.setStorage(0, 0);
      assert.isUndefined(device.storage);
    });

  });

  // setInputs method
  describe('setInputs', function() {

    it('should be able to set the status of the inputs', function() {
      var device = new Device({});
      device.setInputs({timings: {supported: true}}, {timings: {supported: true}});

      assert.equal(device.inputs.camera, 'ok', 'Expected camera to be ok');
      assert.equal(device.inputs.desktop, 'ok', 'Expected desktop to be ok');

      device.setInputs({timings: {supported: false}}, {timings: {supported: false}});

      assert.equal(device.inputs.camera, 'ko', 'Expected camera to be ko');
      assert.equal(device.inputs.desktop, 'ko', 'Expected desktop to be ko');

      device.setInputs({}, {});

      assert.equal(device.inputs.camera, 'disconnected', 'Expected camera to be disconnected');
      assert.equal(device.inputs.desktop, 'disconnected', 'Expected desktop to be disconnected');
    });

  });

  // setPresets method
  describe('setPresets', function() {

    it('should be able to set the presets', function() {
      var device = new Device({});
      var expectedId = '42';
      var expectedPresets = {};
      expectedPresets[expectedId] = {};

      device.setPresets(expectedPresets);
      assert.strictEqual(device.presets[0], expectedPresets[expectedId], 'Wrong preset');
      assert.strictEqual(device.presets[0].id, expectedId, 'Wrong preset id');
    });

  });

  // disconnect method
  describe('disconnect', function() {

    it('should be able to disconnect the device', function() {
      var device = new Device({});
      device.setPresets({42: {}});
      device.setInputs({}, {});
      device.setStorage(80000000000, 40000000000);

      device.disconnect();

      assert.isNull(device.presets);
      assert.isNull(device.inputs);
      assert.isNull(device.storage);
    });

  });

  // isValidSchedule method
  describe('isValidSchedule', function() {

    it('should return true if schedule is valid without collision', function() {
      var device = new Device({});
      var group = {
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 1800000), // 30 minutes in the future
            duration: 600000 // For 10 minutes
          }
        ]
      };
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.ok(device.isValidSchedule(schedule, group), 'Expected schedule to be valid');
    });

    it('should return false if schedule is in collision with other device\'s schedules', function() {
      var device = new Device({});
      device.schedules = [
        {
          beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
          duration: 3600000 // For 1 hour
        }
      ];
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.notOk(device.isValidSchedule(schedule), 'Expected schedule to be invalid');
    });

    it('should return false if schedule is in collision with group\'s schedules', function() {
      var device = new Device({});
      var group = {
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
            duration: 3600000 // For 1 hour
          }
        ]
      };
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.notOk(device.isValidSchedule(schedule, group), 'Expected schedule to be invalid');
    });

  });

  // isGroupSchedulesCollision method
  describe('isGroupSchedulesCollision', function() {

    it('should return true if devices\'s schedules are in conflict with group\'s schedules', function() {
      var device = new Device({});
      device.schedules = [
        {
          beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
          duration: 3600000 // For 1 hour
        }
      ];
      var group = {
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
            duration: 3600000 // For 1 hour
          }
        ]
      };

      assert.ok(device.isGroupSchedulesCollision(group), 'Expected a collision');
    });

    it('should return false if devices\'s schedules are not in conflict with other schedules', function() {
      var device = new Device({});
      device.schedules = [
        {
          beginDate: new Date(new Date().getTime() + 1800000), // 30 minutes in the future
          duration: 600000 // For 10 minutes
        }
      ];
      var group = {
        schedules: [
          {
            beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
            duration: 3600000 // For 1 hour
          }
        ]
      };

      assert.notOk(device.isGroupSchedulesCollision(group), 'Unexpected collision');
    });

    it('should return false if group is not specified', function() {
      var device = new Device({});
      assert.notOk(device.isGroupSchedulesCollision());
    });

  });

});
