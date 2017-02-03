'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var Group = process.requireManage('app/server/manageables/Group.js');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// Group.js
describe('Group', function() {

  it('should be a Manageable', function() {
    assert.instanceOf(new Group({}), Manageable);
  });

  // type property
  describe('type', function() {

    it('should not be editable', function() {
      var group = new Group({});
      assert.throws(function() {
        group.type = null;
      });
    });

  });

  // TYPE property
  describe('TYPE', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        Group.TYPE = null;
      });
    });

  });

  // isValidSchedule method
  describe('isValidSchedule', function() {

    it('should return true if schedule is valid without collision', function() {
      var group = new Group({});
      var devices = [
        {
          schedules: [
            {
              beginDate: new Date(new Date().getTime() + 1800000), // 30 minutes in the future
              duration: 600000 // For 10 minutes
            }
          ]
        }
      ];
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.ok(group.isValidSchedule(schedule, devices), 'Expected schedule to be valid');
    });

    it('should return false if schedule is in collision with other group\'s schedules', function() {
      var group = new Group({});
      group.schedules = [
        {
          beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
          duration: 3600000 // For 1 hour
        }
      ];
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.notOk(group.isValidSchedule(schedule), 'Expected schedule to be invalid');
    });

    it('should return false if schedule is in collision with devices\' schedules', function() {
      var group = new Group({});
      var devices = [
        {
          schedules: [
            {
              beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
              duration: 3600000 // For 1 hour
            }
          ]
        }
      ];
      var schedule = {
        beginDate: new Date(new Date().getTime() + 3600000), // 1 hour in the future
        duration: 3600000 // For 1 hour
      };

      assert.notOk(group.isValidSchedule(schedule, devices), 'Expected schedule to be invalid');
    });

  });

});
