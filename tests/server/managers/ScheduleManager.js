'use strict';

var chai = require('chai');
var sinon = require('sinon');
var spies = require('chai-spies');
var ScheduleManager = process.requireManage('app/server/ScheduleManager.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// ScheduleManager.js
describe('ScheduleManager', function() {
  var manager;
  var clock;

  // Prepare tests
  beforeEach(function() {
    manager = new ScheduleManager();
    clock = sinon.useFakeTimers();
  });

  // Clean up tests
  afterEach(function() {
    clock.restore();
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
      var timeout = 20;
      manager.addJob(new Date(new Date().getTime() + timeout), null, false, function() {
        assert.isDefined(manager.jobs[0].id, 'Expected a job id');
        assert.isDefined(manager.jobs[0].job, 'Expected a job');
        done();
      });
      clock.tick(timeout);
    });

    it('should be able to add a function to execute each day', function() {
      var days = 10;
      var timeout = 86400000 * days;
      var now = new Date();
      var count = 0;

      // Set recurrent end date
      var inTheFuture = new Date(now.getTime() + timeout);
      inTheFuture.setHours(23);
      inTheFuture.setMinutes(59);
      inTheFuture.setSeconds(59);

      // Start in 20 milliseconds
      manager.addJob(new Date(now.getTime()), inTheFuture, true, function() {
        count++;
      });

      assert.isDefined(manager.jobs[0].id, 'Expected a job id');
      assert.isDefined(manager.jobs[0].job, 'Expected a job');

      // Let's time flow 10 days later
      clock.tick(timeout + 86400000 * 10);

      assert.equal(count, days + 1, 'Expected function to be called today and the ' + days + ' next days');
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

    it('should be able to remove a registered job', function() {
      var timeout = 1000;
      var jobId = manager.addJob(new Date(new Date().getTime() + timeout), null, null, function() {
        assert.ok(false, 'Unexpected job execution');
      });

      manager.removeJob(jobId);

      assert.equal(manager.jobs.length, 0, 'Unexpected jobs');
      clock.tick(timeout);
    });

  });
});
