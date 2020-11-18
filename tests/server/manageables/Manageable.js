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
          'schedule1: ##---------------------- \n' +
          'schedule2: ##---------------------- \n'
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
          'schedule1: ######------------------ \n' +
          'schedule2: ------##---------------- \n'
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
          'schedule1: -----######------------- \n' +
          'schedule2: ----------##------------ \n'
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
          'schedule1: ######------------------ \n' +
          'schedule2: ##---------------------- \n'
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
          'schedule1: -----######------------- \n' +
          'schedule2: -------##--------------- \n'
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
          'schedule1: -----######------------- \n' +
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

      // With one schedule in daily recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T17:00:00'),
          recurrent: 'daily',
          duration: 7200000,
          endDate: new Date('2017-01-03T19:00:00')
        },
        {
          beginDate: new Date('2017-01-02T14:00:00'),
          duration: 50400000
        }
      ), '\n' +
          'schedule1: -----------------##-----|-----------------##-----|-----------------##----- \n' +
          'schedule2: ------------------------|--------------##########|####-------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T03:00:00'),
          recurrent: 'daily',
          duration: 7200000,
          endDate: new Date('2017-01-03T05:00:00')
        },
        {
          beginDate: new Date('2017-01-02T22:00:00'),
          duration: 36000000
        }
      ), '\n' +
          'schedule1: ---##-------------------|---##-------------------|---##------------------- \n' +
          'schedule2: ------------------------|----------------------##|########---------------- \n'
      );

      // With one schedule in daily recurrence (reverse order)

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
          duration: 21600000,
          endDate: new Date('2017-01-02T06:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--##-------------------- \n' +
          'schedule2: ######------------------|######------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T15:00:00'),
          duration: 468000000
        },
        {
          beginDate: new Date('2017-01-01T17:00:00'),
          recurrent: 'daily',
          duration: 7200000,
          endDate: new Date('2017-01-03T19:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------|--------------##########|####-------------------- \n' +
          'schedule1: -----------------##-----|-----------------##-----|-----------------##----- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T22:00:00'),
          duration: 36000000
        },
        {
          beginDate: new Date('2017-01-01T03:00:00'),
          recurrent: 'daily',
          duration: 7200000,
          endDate: new Date('2017-01-03T05:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------|----------------------##|########---------------- \n' +
          'schedule1: ---##-------------------|---##-------------------|---##------------------- \n'
      );

      // With both schedules in daily recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T09:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T14:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T07:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T14:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T09:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T12:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ----------##------------|----------##------------|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T19:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T21:00:00')
        }, {
          beginDate: new Date('2017-01-02T17:00:00'),
          duration: 36000000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T03:00:00')
        }
      ), '\n' +
          'schedule1: -------------------##---|-------------------##---|-------------------##--- \n' +
          'schedule2: ------------------------|-----------------#######|###--------------####### \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T04:00:00')
        }, {
          beginDate: new Date('2017-01-02T22:00:00'),
          duration: 25200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T05:00:00')
        }
      ), '\n' +
          'schedule1: --##--------------------|--##--------------------|--##-------------------- \n' +
          'schedule2: ------------------------|----------------------##|#####-----------------## \n'
      );

      // With both schedules in daily recurrence (reverse order)

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-03-03T11:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T12:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 21600000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T09:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T08:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-03-02T11:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T12:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 21600000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T11:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T12:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }
      ), '\n' +
          'schedule1: ----------##------------|----------##------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T17:00:00'),
          duration: 36000000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T03:00:00')
        },
        {
          beginDate: new Date('2017-01-01T19:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T21:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------|-----------------#######|###--------------####### \n' +
          'schedule1: -------------------##---|-------------------##---|-------------------##--- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T22:00:00'),
          duration: 25200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T05:00:00')
        },
        {
          beginDate: new Date('2017-01-01T02:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T04:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------|----------------------##|#####-----------------## \n' +
          'schedule1: --##--------------------|--##--------------------|--##-------------------- \n'
      );

      // With one schedule in weekly recurrence

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T10:00:00')
        }, {
          beginDate: new Date('2017-01-08T08:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: --------##--------------| [6 days] |----------##------------ \n' +
          'schedule2: ------------------------| [6 days] |----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }, {
          beginDate: new Date('2017-01-08T02:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------| [6 days] |##---------------------- \n' +
          'schedule2: ------------------------| [6 days] |--##-------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }, {
          beginDate: new Date('2017-01-07T23:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------| [5 days] |------------------------|##---------------------- \n' +
          'schedule1: ------------------------| [5 days] |-----------------------#|#----------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: 'weekly',
          duration: 7200000,
          endDate: new Date('2017-01-08T02:00:00')
        }, {
          beginDate: new Date('2017-01-07T22:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------| [5 days] |------------------------|##---------------------- \n' +
          'schedule1: ------------------------| [5 days] |----------------------##|------------------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: 'weekly',
          duration: 18000000,
          endDate: new Date('2017-01-08T06:00:00')
        }, {
          beginDate: new Date('2017-01-08T02:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ######------------------| [6 days] |#######----------------- \n' +
          'schedule1: ------------------------| [6 days] |--##-------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T17:00:00'),
          recurrent: 'weekly',
          duration: 7200000,
          endDate: new Date('2017-01-08T19:00:00')
        },
        {
          beginDate: new Date('2017-01-08T14:00:00'),
          duration: 50400000
        }
      ), '\n' +
          'schedule1: -----------------##-----| [6 days] |-----------------##-----|------------------------ \n' +
          'schedule1: ------------------------| [6 days] |--------------##########|####-------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T22:00:00'),
          recurrent: 'weekly',
          duration: 14400000,
          endDate: new Date('2017-01-09T02:00:00')
        },
        {
          beginDate: new Date('2017-01-09T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ----------------------##| [6 days] |----------------------##|##---------------------- \n' +
          'schedule1: ------------------------| [6 days] |------------------------|##---------------------- \n'
      );

      // With one schedule in weekly recurrence in reverse order

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T08:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T10:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------| [6 days] |----------##------------ \n' +
          'schedule1: --------##--------------| [6 days] |----------##------------ \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T02:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------| [6 days] |--##-------------------- \n' +
          'schedule1: ##----------------------| [6 days] |##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-07T23:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------| [5 days] |-----------------------#|#----------------------- \n' +
          'schedule1: ##----------------------| [5 days] |------------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-07T22:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: 'weekly',
          duration: 7200000,
          endDate: new Date('2017-01-08T02:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------| [5 days] |----------------------##|------------------------ \n' +
          'schedule1: ##----------------------| [5 days] |------------------------|##---------------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T02:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          recurrent: 'weekly',
          duration: 18000000,
          endDate: new Date('2017-01-08T06:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------| [6 days] |--##-------------------- \n' +
          'schedule1: ######------------------| [6 days] |#######----------------- \n'
      );

      assert.ok(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T14:00:00'),
          duration: 50400000
        },
        {
          beginDate: new Date('2017-01-01T17:00:00'),
          recurrent: 'weekly',
          duration: 7200000,
          endDate: new Date('2017-01-08T19:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------| [6 days] |--------------##########|####-------------------- \n' +
          'schedule1: -----------------##-----| [6 days] |-----------------##-----|------------------------ \n'
      );

      ['daily', 'weekly'].forEach(function(recurrence) {

        // With one schedule in weekly recurrence and one schedule in either daily or weekly reccurence

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: --------##--------------| [6 days] |----------##------------ \n' +
            'schedule2: ------------------------| [6 days] |------------##---------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T11:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: --------##--------------| [6 days] |----------##------------ \n' +
            'schedule2: ------------------------| [6 days] |-----------##----------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T07:00:00'),
            duration: 32400000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T16:00:00')
          }, {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: -------#########--------| [6 days] |-------#########-------- \n' +
            'schedule2: ------------------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T10:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n' +
            'schedule2: ------------------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T07:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T09:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n' +
            'schedule2: ------------------------| [6 days] |-------##--------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n' +
            'schedule2: ------------------------| [6 days] |------##---------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T12:00:00')
          }, {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |----------##------------ \n' +
            'schedule2: --------##--------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T12:00:00')
          }, {
            beginDate: new Date('2017-01-01T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-03-08T11:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |----------##------------ \n' +
            'schedule2: ---------##-------------| [6 days] |---------##------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 21600000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T14:00:00')
          }, {
            beginDate: new Date('2017-01-01T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |--------######---------- \n' +
            'schedule2: ----------##------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }, {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n' +
            'schedule2: --------##--------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }, {
            beginDate: new Date('2017-01-01T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T11:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n' +
            'schedule2: ---------##-------------| [6 days] |---------##------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }, {
            beginDate: new Date('2017-01-01T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n' +
            'schedule2: ----------##------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T19:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T21:00:00')
          }, {
            beginDate: new Date('2017-01-08T17:00:00'),
            duration: 36000000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-16T03:00:00')
          }
        ), '\n' +
            'With first schedule in "' + recurrence + '" \n' +
            'schedule1: -------------------##---| [6 days] |-------------------##---|------------------------ \n' +
            'schedule2: ------------------------| [6 days] |-----------------#######|###--------------------- \n'
        );

        // With one schedule in weekly recurrence and one schedule in either daily or weekly reccurence (reverse order)

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |------------##---------- \n' +
            'schedule1: --------##--------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T11:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |-----------##----------- \n' +
            'schedule1: --------##--------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:00')
          },
          {
            beginDate: new Date('2017-01-01T07:00:00'),
            duration: 32400000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T16:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |----------##------------ \n' +
            'schedule1: -------#########--------| [6 days] |-------#########-------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T10:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |--------##-------------- \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T07:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T09:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |-------##--------------- \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |------##---------------- \n' +
            'schedule1: --------##--------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T10:00:00')
          },
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T12:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: --------##--------------| [6 days] |--------##-------------- \n' +
            'schedule1: ------------------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-03-08T11:00:00')
          },
          {
            beginDate: new Date('2017-01-08T10:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T12:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ---------##-------------| [6 days] |---------##------------- \n' +
            'schedule1: ------------------------| [6 days] |----------##------------ \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:00')
          },
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 21600000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T14:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ----------##------------| [6 days] |----------##------------ \n' +
            'schedule1: ------------------------| [6 days] |--------######---------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T10:00:00')
          },
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: --------##--------------| [6 days] |--------##-------------- \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T09:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T11:00:00')
          },
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ---------##-------------| [6 days] |---------##------------- \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T10:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:00')
          },
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ----------##------------| [6 days] |----------##------------ \n' +
            'schedule1: ------------------------| [6 days] |--------##-------------- \n'
        );

        assert.ok(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T17:00:00'),
            duration: 36000000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-16T03:00:00')
          },
          {
            beginDate: new Date('2017-01-01T19:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T21:00:00')
          }
        ), '\n' +
            'With second schedule in "' + recurrence + '" \n' +
            'schedule2: ------------------------| [6 days] |-----------------#######|###--------------------- \n' +
            'schedule1: -------------------##---| [6 days] |-------------------##---|------------------------ \n'
        );
      });

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

      // With one schedule in daily recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T04:01:00')
        }, {
          beginDate: new Date('2017-01-02T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: --##--------------------|--##-------------------- \n' +
          'schedule2: ------------------------|##---------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T04:00:00')
        }, {
          beginDate: new Date('2017-01-01T04:00:01'),
          duration: 79199000
        }
      ), '\n' +
          'schedule1: --##--------------------|--##-------------------- \n' +
          'schedule2: ----####################|##---------------------- \n'
      );

      // With one schedule in daily recurrence (reverse order)

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T02:00:01'),
          duration: 7200000
        }, {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T04:01:00')
        }
      ), '\n' +
          'schedule1: ------------------------|##---------------------- \n' +
          'schedule2: --##--------------------|--##-------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T04:00:01'),
          duration: 79199000
        },
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T04:00:00')
        }
      ), '\n' +
          'schedule2: ----####################|##---------------------- \n' +
          'schedule1: --##--------------------|--##-------------------- \n'
      );

      // With both schedules in daily recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:00')
        }, {
          beginDate: new Date('2017-01-02T10:00:01'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T10:00:01')
        }, {
          beginDate: new Date('2017-01-02T06:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:00')
        }, {
          beginDate: new Date('2017-01-01T10:00:01'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:01')
        }, {
          beginDate: new Date('2017-01-01T06:00:00'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-02T08:00:00')
        }
      ), '\n' +
          'schedule1: ------------------------|--------##--------------|--------##-------------- \n' +
          'schedule2: ------##----------------|------##----------------|------------------------ \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T08:00:01'),
          duration: 79199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T06:00:00')
        }, {
          beginDate: new Date('2017-01-01T06:00:01'),
          duration: 7199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T08:00:00')
        }
      ), '\n' +
          'schedule1: --------################|######--################|######--################ \n' +
          'schedule2: ------##----------------|------##----------------|------##---------------- \n'
      );

      // With both schedules in daily recurrence (reverse order)

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-02T10:00:01'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T12:00:01')
        }, {
          beginDate: new Date('2017-01-01T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-03T08:00:00')
        }, {
          beginDate: new Date('2017-01-01T08:00:01'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T12:00:01')
        }, {
          beginDate: new Date('2017-01-02T08:00:00'),
          duration: 7200000,
          recurrent: 'daily',
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
          recurrent: 'daily',
          endDate: new Date('2017-01-02T08:00:00')
        }, {
          beginDate: new Date('2017-01-02T08:00:01'),
          duration: 7200000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T10:00:01')
        }
      ), '\n' +
          'schedule1: ------##----------------|------##----------------|------------------------ \n' +
          'schedule2: ------------------------|--------##--------------|--------##-------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T06:00:01'),
          duration: 7199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-03T08:00:00')
        },
        {
          beginDate: new Date('2017-01-01T08:00:01'),
          duration: 79199000,
          recurrent: 'daily',
          endDate: new Date('2017-01-04T06:00:00')
        }
      ), '\n' +
          'schedule2: ------##----------------|------##----------------|------##---------------- \n' +
          'schedule1: --------################|######--################|######--################ \n'
      );

      // With one schedule in weekly recurrence

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }, {
          beginDate: new Date('2017-01-08T02:00:01'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: ##----------------------| [6 days] |##---------------------- \n' +
          'schedule2: ------------------------| [6 days] |--##-------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-02T04:01:00')
        }, {
          beginDate: new Date('2017-01-08T00:00:00'),
          duration: 7200000
        }
      ), '\n' +
          'schedule1: --##--------------------| [6 days] |--##-------------------- \n' +
          'schedule2: ------------------------| [6 days] |##---------------------- \n'
      );

      // With one schedule in weekly recurrence (reverse order)

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T02:00:01'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T00:00:00'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-08T02:00:00')
        }
      ), '\n' +
          'schedule2: ------------------------| [6 days] |--##-------------------- \n' +
          'schedule1: ##----------------------| [6 days] |##---------------------- \n'
      );

      assert.notOk(manageable.checkSchedulesConflict(
        {
          beginDate: new Date('2017-01-08T00:00:00'),
          duration: 7200000
        },
        {
          beginDate: new Date('2017-01-01T02:00:01'),
          duration: 7200000,
          recurrent: 'weekly',
          endDate: new Date('2017-01-02T04:01:00')
        }
      ), '\n' +
          'schedule2: ------------------------| [6 days] |##---------------------- \n' +
          'schedule1: --##--------------------| [6 days] |--##-------------------- \n'
      );

      ['daily', 'weekly'].forEach(function(recurrence) {

        // With both schedules in daily recurrence

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }, {
            beginDate: new Date('2017-01-08T10:00:01'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:01')
          }
        ), '\n' +
            'With first schedule in ' + recurrence + ' recurrence \n' +
            'schedule1: --------##--------------| [6 Days] |--------##-------------- \n' +
            'schedule2: ------------------------| [6 Days] |----------##------------ \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:01'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:01')
          }, {
            beginDate: new Date('2017-01-08T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          }
        ), '\n' +
            'With first schedule in ' + recurrence + ' recurrence \n' +
            'schedule1: --------##--------------| [6 Days] |--------##-------------- \n' +
            'schedule2: ------------------------| [6 Days] |------##---------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }, {
            beginDate: new Date('2017-01-01T10:00:01'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:01')
          }
        ), '\n' +
            'With first schedule in ' + recurrence + ' recurrence \n' +
            'schedule1: ------------------------| [6 Days] |--------##-------------- \n' +
            'schedule2: --------##--------------| [6 Days] |----------##------------ \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T08:00:01'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:01')
          }, {
            beginDate: new Date('2017-01-01T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T08:00:00')
          }
        ), '\n' +
            'With first schedule in ' + recurrence + ' recurrence \n' +
            'schedule1: ------------------------| [6 Days] |--------##-------------- \n' +
            'schedule2: ------##----------------| [6 Days] |------##---------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T08:00:01'),
            duration: recurrence === 'daily' ? 79199000 : 597599000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T06:00:00')
          }, {
            beginDate: new Date('2017-01-01T06:00:01'),
            duration: 7199000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          }
        ), '\n' +
            'With first schedule in ' + recurrence + ' recurrence \n' +
            'schedule1: --------################| [6 Days] |######--################ \n' +
            'schedule2: ------##----------------| [6 Days] |------##---------------- \n'
        );

        // With both schedules in daily recurrence (reverse order)

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T10:00:01'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T12:00:01')
          },
          {
            beginDate: new Date('2017-01-01T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:00')
          }
        ), '\n' +
            'With second schedule in ' + recurrence + ' recurrence \n' +
            'schedule2: ------------------------| [6 Days] |----------##------------ \n' +
            'schedule1: --------##--------------| [6 Days] |--------##-------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-08T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:01'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T10:00:01')
          }
        ), '\n' +
            'With second schedule in ' + recurrence + ' recurrence \n' +
            'schedule2: ------------------------| [6 Days] |------##---------------- \n' +
            'schedule1: --------##--------------| [6 Days] |--------##-------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T10:00:01'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T12:00:01')
          },
          {
            beginDate: new Date('2017-01-08T08:00:00'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:00')
          }
        ), '\n' +
            'With second schedule in ' + recurrence + ' recurrence \n' +
            'schedule2: --------##--------------| [6 Days] |----------##------------ \n' +
            'schedule1: ------------------------| [6 Days] |--------##-------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T06:00:00'),
            duration: 7200000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-08T08:00:00')
          },
          {
            beginDate: new Date('2017-01-08T08:00:01'),
            duration: 7200000,
            recurrent: recurrence,
            endDate: new Date('2017-01-15T10:00:01')
          }
        ), '\n' +
            'With second schedule in ' + recurrence + ' recurrence \n' +
            'schedule2: ------##----------------| [6 Days] |------##---------------- \n' +
            'schedule1: ------------------------| [6 Days] |--------##-------------- \n'
        );

        assert.notOk(manageable.checkSchedulesConflict(
          {
            beginDate: new Date('2017-01-01T06:00:01'),
            duration: 7199000,
            recurrent: 'weekly',
            endDate: new Date('2017-01-15T08:00:00')
          },
          {
            beginDate: new Date('2017-01-01T08:00:01'),
            duration: recurrence === 'daily' ? 79199000 : 597599000,
            recurrent: recurrence,
            endDate: new Date('2017-01-08T06:00:00')
          }
        ), '\n' +
            'With second schedule in ' + recurrence + ' recurrence \n' +
            'schedule2: ------##----------------| [6 Days] |------##---------------- \n' +
            'schedule1: --------################| [6 Days] |######--################ \n'
        );
      });

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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
          recurrent: 'daily',
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
        recurrent: 'daily',
        endDate: new Date(new Date().getTime())
      }), 'Expected schedule 2 to be running');

      // Schedule 3
      // Every day since 1 day until tomorrow
      assert.ok(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000),
        duration: 3600000,
        recurrent: 'daily',
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 to be running');

      // Schedule 4
      // Every week since 1 week until now
      assert.ok(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000 * 7),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime())
      }), 'Expected schedule 4 to be running');

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
        recurrent: 'daily',
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 not to be running');

      // Schedule 4
      // Begun 1 week ago minus 2 hours for 1 hour until next week
      assert.notOk(manageable.isScheduleRunning({
        beginDate: new Date(new Date().getTime() - 86400000 * 7 - 7200000),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime() + 86400000 * 7)
      }), 'Expected schedule 4 not to be running');

    });
  });

  // getLastScheduleOccurence method
  describe('getLastScheduleOccurence', function() {

    it('should be able to get the last occurence of a recurrent schedule', function() {
      var schedule;
      var manageable = new Manageable({});

      // Schedule 1
      // Daily with start and end on the same day
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T08:00:00'),
        endDate: new Date('2017-01-01T10:00:00'),
        duration: 7200000,
        recurrent: 'daily'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-01T08:00:00').getTime(),
        'Wrong schedule 1 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-01T10:00:00').getTime(), 'Wrong schedule 1 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 1 duration');

      // Schedule 2
      // Daily with start and end on different days
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T23:00:00'),
        endDate: new Date('2017-01-01T00:00:00'),
        duration: 7200000,
        recurrent: 'daily'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-01T23:00:00').getTime(),
        'Wrong schedule 2 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-02T01:00:00').getTime(), 'Wrong schedule 2 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 2 duration');

      // Schedule 3
      // Weekly with a duration of 22 hours starting the same day it ends
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T06:00:00'),
        endDate: new Date('2017-01-15T00:00:00'),
        duration: 597600000,
        recurrent: 'weekly'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-15T06:00:00').getTime(),
        'Wrong schedule 3 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-22T04:00:00').getTime(), 'Wrong schedule 3 end date');
      assert.equal(schedule.duration, 597600000, 'Wrong schedule 3 duration');

      // Schedule 4
      // Weekly with an end day after the weekly day (01-01-2017 is sunday)
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T06:00:00'),
        endDate: new Date('2017-01-12T00:00:00'),
        duration: 7200000,
        recurrent: 'weekly'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-08T06:00:00').getTime(),
        'Wrong schedule 4 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-08T08:00:00').getTime(), 'Wrong schedule 4 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 4 duration');

      // Schedule 5
      // Weekly with an end day before the weekly day (01-06-2017 is friday, 01-15-2017 is sunday)
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-06T06:00:00'),
        endDate: new Date('2017-01-15T00:00:00'),
        duration: 7200000,
        recurrent: 'weekly'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-13T06:00:00').getTime(),
        'Wrong schedule 5 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-13T08:00:00').getTime(), 'Wrong schedule 5 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 5 duration');

      // Schedule 6
      // Weekly with an end day the same day as the start day
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T06:00:00'),
        endDate: new Date('2017-01-15T00:00:00'),
        duration: 7200000,
        recurrent: 'weekly'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-15T06:00:00').getTime(),
        'Wrong schedule 6 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-15T08:00:00').getTime(), 'Wrong schedule 6 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 6 duration');

      // Schedule 7
      // Weekly with start and end on different days
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T23:00:00'),
        endDate: new Date('2017-01-15T00:00:00'),
        duration: 7200000,
        recurrent: 'weekly'
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-15T23:00:00').getTime(),
        'Wrong schedule 7 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-16T01:00:00').getTime(), 'Wrong schedule 7 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 7 duration');

      // Schedule 8
      // Without recurrence on same day
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T06:00:00'),
        duration: 7200000
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-01T06:00:00').getTime(),
        'Wrong schedule 8 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-01T08:00:00').getTime(), 'Wrong schedule 8 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 8 duration');

      // Schedule 9
      // Without recurrence and start day different from end day
      schedule = manageable.getLastScheduleOccurence({
        beginDate: new Date('2017-01-01T23:00:00'),
        duration: 7200000
      });

      assert.equal(
        schedule.beginDate.getTime(),
        new Date('2017-01-01T23:00:00').getTime(),
        'Wrong schedule 9 begin date'
      );
      assert.equal(schedule.endDate.getTime(), new Date('2017-01-02T01:00:00').getTime(), 'Wrong schedule 9 end date');
      assert.equal(schedule.duration, 7200000, 'Wrong schedule 9 duration');
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
        recurrent: 'daily',
        endDate: new Date(new Date().getTime() - 86400000 - 7200000)
      }), 'Expected schedule 3 to be expired');

      // Schedule 4
      // 1 week ago minus 2 hours for 1 hour until next week minus 1 day
      assert.ok(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 7 - 7200000),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime() + 86400000 * 6)
      }), 'Expected schedule 4 to be expired');

      // Schedule 5
      // 2 weeks ago minus 2 days for 1 hour until tomorrow
      assert.ok(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 8),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 5 to be expired');

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
        recurrent: 'daily',
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 3 not to be expired');

      // Schedule 4
      // 8 days ago for 1 hour until today minus 1 second
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 8),
        duration: 3600000,
        recurrent: 'daily',
        endDate: new Date(new Date().getTime() - 1000)
      }), 'Expected schedule 4 not to be expired');

      // Schedule 5
      // 2 weeks ago for 1 hour until today minus 1 second
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 14),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime() - 1000)
      }), 'Expected schedule 5 not to be expired');

      // Schedule 6
      // From 2 weeks ago for 1 hour until tomorrow
      assert.notOk(manageable.isScheduleExpired({
        beginDate: new Date(new Date().getTime() - 86400000 * 14),
        duration: 3600000,
        recurrent: 'weekly',
        endDate: new Date(new Date().getTime() + 86400000)
      }), 'Expected schedule 6 not to be expired');

    });
  });
});
