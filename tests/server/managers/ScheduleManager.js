'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var ScheduleManager = process.requireManage('app/server/ScheduleManager.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// ScheduleManager.js
describe('ScheduleManager', function() {
  var manager;

  // Prepare tests
  beforeEach(function() {
    manager = new ScheduleManager();
  });

  // jobs property
  describe('jobs', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        manager.jobs = null;
      });
    });

  });

  // addJob method
  describe('addJob', function() {

    it('should be able to add a function to execute later', function(done) {
      manager.addJob(new Date(new Date().getTime() + 20), null, false, function() {
        assert.isDefined(manager.jobs[0].id, 'Expected a job id');
        assert.isDefined(manager.jobs[0].job, 'Expected a job');
        done();
      });
    });

    it('should be able to add a function to execute each day', function() {
      var tomorrow = new Date(new Date().getTime() + 86400000);
      manager.addJob(new Date(new Date().getTime() + 20), tomorrow, true, function() {
      });
      assert.isDefined(manager.jobs[0].id, 'Expected a job id');
      assert.isDefined(manager.jobs[0].job, 'Expected a job');
    });

    it('should not be able to add a schedule if begin date is not specified', function() {
      manager.addJob(null, null, false, function() {
      });
      assert.equal(manager.jobs.length, 0);
    });

    it('should not be able to add a schedule if function is not specified', function() {
      manager.addJob(new Date(new Date().getTime() + 20), null, false);
      assert.equal(manager.jobs.length, 0);
    });
  });

  // removeJob method
  describe('removeJob', function() {

    it('should be able to remove a registered job', function(done) {
      var jobId = manager.addJob(new Date(new Date().getTime() + 20), null, null, function() {
        assert.ok(false, 'Unexpected job execution');
      });

      manager.removeJob(jobId);

      assert.equal(manager.jobs.length, 0, 'Unexpected jobs');

      setTimeout(function() {
        done();
      }, 30);
    });

  });
});
