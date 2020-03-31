'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// Manageable.js
describe('Manageable', function() {

  // id property
  describe('id', function() {

    it('should not be editable', function() {
      var manageable = new Manageable({});
      assert.throws(function() {
        manageable.id = null;
      });
    });

  });

  // checkSchedulesConflict method
  describe('checkSchedulesConflict', function() {

    it('should return true if two schedules are in collision', function() {
      var manageable = new Manageable({});

      // Without recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------- \n' +
          'schedule2: ##----------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 21600000
        }, {
          beginDate: new Date('2017-01-01T06:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ######------------------- \n' +
          'schedule2: ------##----------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }, {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: -----######-------------- \n' +
          'schedule2: ----------##------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 21600000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ######------------------- \n' +
          'schedule2: ##----------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }, {
          beginDate: new Date('2017-01-01T07:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: -----######-------------- \n' +
          'schedule2: -------##----------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }, {
          beginDate: new Date('2017-01-01T07:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: -----######-------------- \n' +
          'schedule2: -------##--------------- \n'
      );

      // Without recurrence (reverse order)

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T11:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }
      ), '\n' +
          'schedule1: -----------##----------- \n' +
          'schedule2: -----######------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }
      ), '\n' +
          'schedule1: ----------##------------ \n' +
          'schedule2: -----######------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 21600000
        }
      ), '\n' +
          'schedule1: ##---------------------- \n' +
          'schedule2: ######------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T07:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T05:00:00'),
          duration: 21600000
        }
      ), '\n' +
          'schedule1: -------##--------------- \n' +
          'schedule2: -----######------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T04:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T03:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ----##------------------ \n' +
          'schedule2: ---##------------------- \n'
      );

      // With one schedule in recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }, {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------|##---------------------- \n' +
          'schedule2: ------------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }, {
          beginDate: new Date('2017-01-02T02:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------|##---------------------- \n' +
          'schedule2: ------------------------|--##-------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }, {
          beginDate: new Date('2017-01-01T23:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------|##---------------------- \n' +
          'schedule2: -----------------------#|#----------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: true,
          duration: 7200000,
          endDate: new Date('2017-01-02T02:00:00')
        }, {
          beginDate: new Date('2017-01-01T22:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------|##---------------------- \n' +
          'schedule2: ----------------------##|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: true,
          duration: 18000000,
          endDate: new Date('2017-01-02T06:00:00')
        }, {
          beginDate: new Date('2017-01-02T02:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ######------------------|######------------------ \n' +
          'schedule2: ------------------------|--##-------------------- \n'
      );

      // With one schedule in recurrence (reverse order)

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|##---------------------- \n' +
          'schedule2: ##----------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T02:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--##-------------------- \n' +
          'schedule2: ##----------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T23:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }
      ), '\n' +
          'schedule1: -----------------------#|#----------------------- \n' +
          'schedule2: ##----------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T22:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: true,
          duration: 7200000,
          endDate: new Date('2017-01-02T02:00:00')
        }
      ), '\n' +
          'schedule1: ----------------------##|------------------------ \n' +
          'schedule2: ##----------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: true,
          duration: 21600000,
          endDate: new Date('2017-01-02T06:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--##-------------------- \n' +
          'schedule2: ######------------------|######------------------ \n'
      );

      // With both schedules in recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|----------##------------|----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-03-03T11:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|---------##-------------|---------##------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 21600000,
          recurrent: true,
          endDate: new Date('2017-01-02T14:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }
      ), '\n' +
          'schedule1: --------######----------|--------######----------|------------------------ \n' +
          'schedule2: ------------------------|----------##------------|----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T07:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T09:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|-------##---------------|-------##--------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T08:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|------##----------------|------##---------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|----------##------------|----------##------------ \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-03-02T11:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|----------##------------|----------##------------ \n' +
          'schedule2: ---------##-------------|---------##-------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 21600000,
          recurrent: true,
          endDate: new Date('2017-01-03T14:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------######----------|--------######---------- \n' +
          'schedule2: ----------##------------|----------##------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T11:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ---------##-------------|---------##-------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ----------##------------|----------##------------|------------------------ \n'
      );

      // With both schedules in recurrence (reverse order)

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|----------##------------|----------##------------ \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-03-03T11:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|---------##-------------|---------##------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 21600000,
          recurrent: true,
          endDate: new Date('2017-01-02T14:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|----------##------------|----------##------------ \n' +
          'schedule2: --------######----------|--------######----------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T07:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T09:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|-------##---------------|-------##--------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T08:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|------##----------------|------##---------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|----------##------------|----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-03-02T11:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:00')
        }
      ), '\n' +
          'schedule1: ---------##-------------|---------##-------------|------------------------ \n' +
          'schedule2: ------------------------|----------##------------|----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 21600000,
          recurrent: true,
          endDate: new Date('2017-01-03T14:00:00')
        }
      ), '\n' +
          'schedule1: ----------##------------|----------##------------|------------------------ \n' +
          'schedule2: ------------------------|--------######----------|--------######---------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T11:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: ---------##-------------|---------##-------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: ----------##------------|----------##------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );
    });

    it('should return false if there is no collision', function() {
      var manageable = new Manageable({});

      // Without recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------- \n' +
          'schedule2: --##--------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: --##----------------------- \n' +
          'schedule2: ##------------------------- \n'
      );

      // With one schedule in recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }, {
          beginDate: new Date('2017-01-02T02:00:01'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------|##---------------------- \n' +
          'schedule2: ------------------------|--##-------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T04:01:00')
        }, {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: --##--------------------|--##-------------------- \n' +
          'schedule2: ------------------------|##---------------------- \n'
      );

      // With one schedule in recurrence (reverse order)

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T02:00:01'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T02:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--##-------------------- \n' +
          'schedule2: ##----------------------|##---------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T04:01:00')
        }
      ), '\n' +
          'schedule1: ------------------------|##---------------------- \n' +
          'schedule2: --##--------------------|--##-------------------- \n'
      );

      // With both schedules in recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:01')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|----------##------------|----------##------------ \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:01')
        }, {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T08:00:00')
        }
      ), '\n' +
          'schedule1: --------##--------------|--------##--------------|------------------------ \n' +
          'schedule2: ------------------------|------##----------------|------##---------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:01')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ----------##------------|----------##------------|------------------------ \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T08:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:01')
        }, {
          beginDate: new Date('2017-01-01T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T08:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ------##----------------|------##----------------|------------------------ \n'
      );

      // With both schedules in recurrence (reverse order)

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T12:00:01')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|----------##------------|----------##------------ \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T08:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T10:00:01')
        }
      ), '\n' +
          'schedule1: ------------------------|------##----------------|------##---------------- \n' +
          'schedule2: --------##--------------|--------##--------------|------------------------ \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T10:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T12:00:01')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: ----------##------------|----------##------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T06:00:00'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-02T08:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:01'),
          duration: 7200000,
          recurrent: true,
          endDate: new Date('2017-01-03T10:00:01')
        }
      ), '\n' +
          'schedule1: ------##----------------|------##----------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );
    });

  });

  // addHistoric method
  describe('addHistoric', function() {

    it('should be able to add an historic to the history', function() {
      var manageable = new Manageable({});
      manageable.addHistoric({});
      assert.equal(manageable.history.length, 1);
    });

  });

  // removeHistoric method
  describe('removeHistoric', function() {

    it('should be able to remove an historic from the history', function() {
      var manageable = new Manageable({});
      var expectedHistoric = {id: 42};
      manageable.addHistoric(expectedHistoric);
      assert.strictEqual(
        manageable.removeHistoric(expectedHistoric.id),
        expectedHistoric,
        'Expected return value to be the historic'
      );
      assert.equal(manageable.history.length, 0, 'Expected history to be empty');
    });

    it('should return null if historic is not found', function() {
      var manageable = new Manageable({});
      assert.isNull(manageable.removeHistoric('unknown'));
    });
  });

  // removeHistory method
  describe('removeHistory', function() {

    it('should be able to remove the whole history', function() {
      var manageable = new Manageable({});
      manageable.addHistoric({id: 42});
      manageable.addHistoric({id: 43});

      manageable.removeHistory();
      assert.equal(manageable.history.length, 0);
    });

  });

  // addSchedule method
  describe('addSchedule', function() {

    it('should be able to add a schedule', function() {
      var manageable = new Manageable({});
      manageable.addSchedule({id: 42});
      assert.equal(manageable.schedules.length, 1);
    });

  });

  // removeSchedule method
  describe('removeSchedule', function() {

    it('should be able to remove a schedule', function() {
      var manageable = new Manageable({});
      var expectedSchedule = {id: 42};

      manageable.addSchedule(expectedSchedule);

      assert.strictEqual(
        manageable.removeSchedule(expectedSchedule.id),
        expectedSchedule,
        'Expected return value to be the schedule'
      );
      assert.equal(manageable.schedules.length, 0, 'Expected schedules to be empty');
    });

    it('should return null if schedule is not found', function() {
      var manageable = new Manageable({});
      assert.isNull(manageable.removeSchedule('unknown'));
    });

  });

  // getSchedule method
  describe('getSchedule', function() {

    it('should be able to retrieve a schedule by its id', function() {
      var manageable = new Manageable({});
      var expectedSchedule = {id: 42};
      manageable.addSchedule(expectedSchedule);
      assert.strictEqual(manageable.getSchedule(expectedSchedule.id), expectedSchedule);
    });

    it('should return undefined if not found', function() {
      var manageable = new Manageable({});
      assert.isUndefined(manageable.getSchedule('unknown'));
    });

  });

  // isValidSchedule method
  describe('isValidSchedule', function() {

    it('should return true if schedule is valid', function() {
      var manageable = new Manageable({});
      manageable.schedules = [

        // Begin in 1 day for 1 hour
        {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000
        },

        // Begin in 1 day + 3 hours for 1 hour and stop in 3 days
        {
          beginDate: new Date(new Date().getTime() + 86400000 + 10800000),
          duration: 3600000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + (86400000 * 30))
        }
      ];

      // Begin in 1 day + 5 hours for 1 hour and stop in 3 days
      assert.ok(manageable.isValidSchedule(
        {
          beginDate: new Date(new Date().getTime() + 86400000 + 18000000),
          duration: 3600000,
          recurrent: false,
          endDate: new Date(new Date().getTime() + (86400000 * 30))
        }
      ));
    });

    it('should return false if begin date is in the past', function() {
      var manageable = new Manageable({});
      assert.notOk(manageable.isValidSchedule(
        {
          beginDate: new Date(new Date().getTime() - 42),
          duration: 3600000
        }
      ));
    });

    it('should return false if begin date is after end date', function() {
      var manageable = new Manageable({});
      assert.notOk(manageable.isValidSchedule(
        {
          beginDate: new Date(new Date().getTime() + (86400000 * 2)),
          duration: 3600000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000)
        }
      ));
    });

    it('should return false if schedule is in conflict with other schedules', function() {
      var manageable = new Manageable({});

      manageable.schedules = [

        // Begin in 1 day for 1 hour
        {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 3600000
        }
      ];

      // Begin in 1 day for 2 hours
      assert.notOk(manageable.isValidSchedule(
        {
          beginDate: new Date(new Date().getTime() + 86400000),
          duration: 7200000,
          recurrent: true,
          endDate: new Date(new Date().getTime() + 86400000)
        }
      ));
    });

  });

  // isScheduleRunning method
  describe('isScheduleRunning', function() {

    it('should return true if a schedule is actually running', function() {
      var manageable = new Manageable({});

      // Schedule 1
      // Begin now for 1 hour
      assert.ok(manageable.isScheduleRunning({
        beginDate: new Date(),
        duration: 3600000
      }), 'Expected schedule 1 to be running');

      // Schedule 2
      // Every day since 1 day until now
      assert.ok(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000),
        duration: 3600000,
        recurrent: true,
        endDate: new Date(new Date().getTime())
      }), 'Expected schedule 2 to be running');

      // Schedule 3
      // Every day since 1 day until tomorrow
      assert.ok(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000),
        duration: 3600000,
        recurrent: true,
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 to be running');

    });

    it('should return false if a schedule is not running', function() {
      var manageable = new Manageable({});

      // Schedule 1
      // Begin in 1 day for 1 hour
      assert.notOk(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() + 86400000),
        duration: 3600000
      }), 'Expected schedule 1 not to be running');

      // Schedule 2
      // Begun 1 day ago for 1 hour
      assert.notOk(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000),
        duration: 3600000
      }), 'Expected schedule 2 not to be running');

      // Schedule 3
      // Begun 1 day ago minus 2 hours for 1 hour until tomorrow
      assert.notOk(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000 - 7200000),
        duration: 3600000,
        recurrent: true,
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 not to be running');
    });
  });

  // isScheduleExpired method
  describe('isScheduleExpired', function() {

    it('should return true if a schedule has expired', function() {
      var manageable = new Manageable({});

      // Schedule 1
      // Two milliseconds ago for one second
      assert.ok(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 2000),
        duration: 1000
      }), 'Expected schedule 1 to be expired');

      // Schedule 2
      // Two days ago for 1 hour
      assert.ok(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 2),
        duration: 3600000
      }), 'Expected schedule 2 to be expired');

      // Schedule 3
      // 8 days ago for 1 hour until yesterday minus 2 hours
      assert.ok(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 8),
        duration: 3600000,
        recurrent: true,
        endDate: new Date(new Date().getTime() - 86400000 - 7200000)
      }), 'Expected schedule 3 to be expired');
    });

    it('should return false if a schedule has not expired yet', function() {
      var manageable = new Manageable({});

      // Schedule 1
      // 1 hour ago for 1 hour
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 3600000),
        duration: 3600000
      }), 'Expected schedule 1 not to be expired');

      // Schedule 2
      // From now for 1 hour
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime()),
        duration: 3600000
      }), 'Expected schedule 2 not to be expired');

      // Schedule 3
      // From 8 days ago for 1 hour until tomorrow
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 8),
        duration: 3600000,
        recurrent: true,
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 not to be expired');
    });
  });
});
