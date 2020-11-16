'use strict';

var path = require('path');
var chai = require('chai');
var spies = require('chai-spies');
var api = require('@openveo/api');
var mock = require('mock-require');
var ResourceFilter = api.storages.ResourceFilter;

var assert = chai.assert;
chai.should();
chai.use(spies);

describe('Migration 5.0.0', function() {
  var migration;
  var database;
  var GroupProvider;
  var DeviceProvider;
  var expectedDevices;
  var expectedGroups;
  var coreApi;
  var realCoreApi;

  // Mocks
  beforeEach(function() {
    expectedDevices = [];
    expectedGroups = [];

    DeviceProvider = function() {};
    DeviceProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
      callback(null, expectedDevices);
    });
    DeviceProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });

    GroupProvider = function() {};
    GroupProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
      callback(null, expectedGroups);
    });
    GroupProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });

    coreApi = {
      getDatabase: function() {
        return database;
      },
      getCoreApi: function() {
        return coreApi;
      }
    };

    realCoreApi = process.api;
    process.api = coreApi;
    mock(path.join(process.rootManage, 'app/server/providers/DeviceProvider.js'), DeviceProvider);
    mock(path.join(process.rootManage, 'app/server/providers/GroupProvider.js'), GroupProvider);
  });

  // Initialize tests
  beforeEach(function() {
    migration = mock.reRequire(path.join(process.rootManage, 'migrations/5.0.0.js'));
  });

  // Stop mocks
  afterEach(function() {
    mock.stopAll();
    process.api = realCoreApi;
  });

  it('should update manageables property "recurrent" to "daily" when true', function(done) {
    var expectedDeviceId = '42';
    var expectedGroupId = '43';

    var expectedSchedule = {
      name: 'Name',
      beginDate: new Date(),
      duration: 60000,
      preset: '1',
      endDate: new Date(),
      recurrent: true,
      startJobId: 'gw_LaojJK',
      stopJobId: 'jwYv7HGWea',
      id: '9-RmPqYWzQ'
    };
    expectedDevices = [
      {
        id: expectedDeviceId,
        schedules: [expectedSchedule]
      }
    ];
    expectedGroups = [
      {
        id: expectedGroupId,
        schedules: [expectedSchedule]
      }
    ];

    DeviceProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      assert.equal(
        filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
        expectedDeviceId,
        'Wrong device id'
      );
      assert.lengthOf(modifications.schedules, 1, 'Wrong number of updated device schedules');
      assert.equal(modifications.schedules[0].recurrent, 'daily', 'Wrong device recurrent value');
      assert.strictEqual(modifications.schedules[0].name, expectedSchedule.name, 'Wrong device schedule name');
      assert.strictEqual(modifications.schedules[0].preset, expectedSchedule.preset, 'Wrong device schedule preset');
      assert.strictEqual(modifications.schedules[0].id, expectedSchedule.id, 'Wrong device schedule id');
      assert.strictEqual(
        modifications.schedules[0].beginDate,
        expectedSchedule.beginDate,
        'Wrong device schedule begin date'
      );
      assert.strictEqual(
        modifications.schedules[0].endDate,
        expectedSchedule.endDate,
        'Wrong device schedule end date'
      );
      assert.strictEqual(
        modifications.schedules[0].startJobId,
        expectedSchedule.startJobId,
        'Wrong device start job id'
      );
      assert.strictEqual(
        modifications.schedules[0].stopJobId,
        expectedSchedule.stopJobId,
        'Wrong device stop job id'
      );

      callback();
    });

    GroupProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      assert.equal(
        filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
        expectedGroupId,
        'Wrong group id'
      );
      assert.lengthOf(modifications.schedules, 1, 'Wrong number of updated group schedules');
      assert.equal(modifications.schedules[0].recurrent, 'daily', 'Wrong group recurrent value');
      assert.strictEqual(modifications.schedules[0].name, expectedSchedule.name, 'Wrong group schedule name');
      assert.strictEqual(modifications.schedules[0].preset, expectedSchedule.preset, 'Wrong group schedule preset');
      assert.strictEqual(modifications.schedules[0].id, expectedSchedule.id, 'Wrong group schedule id');
      assert.strictEqual(
        modifications.schedules[0].beginDate,
        expectedSchedule.beginDate,
        'Wrong group schedule begin date'
      );
      assert.strictEqual(
        modifications.schedules[0].endDate,
        expectedSchedule.endDate,
        'Wrong group schedule end date'
      );
      assert.strictEqual(
        modifications.schedules[0].startJobId,
        expectedSchedule.startJobId,
        'Wrong group start job id'
      );
      assert.strictEqual(
        modifications.schedules[0].stopJobId,
        expectedSchedule.stopJobId,
        'Wrong group stop job id'
      );

      callback();
    });

    migration.update(function(error) {
      assert.isUndefined(error, 'Unexpected error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(1);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(1);
      done();
    });
  });

  it('should not update manageables when no recurrent schedule', function(done) {
    var expectedDeviceId = '42';
    var expectedGroupId = '43';

    var expectedSchedule = {
      name: 'Name',
      beginDate: new Date(),
      duration: 60000,
      preset: '1',
      endDate: new Date(),
      recurrent: false,
      startJobId: 'gw_LaojJK',
      stopJobId: 'jwYv7HGWea',
      id: '9-RmPqYWzQ'
    };
    expectedDevices = [
      {
        id: expectedDeviceId,
        schedules: [expectedSchedule]
      }
    ];
    expectedGroups = [
      {
        id: expectedGroupId,
        schedules: [expectedSchedule]
      }
    ];

    migration.update(function(error) {
      assert.isUndefined(error, 'Unexpected error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(0);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(0);
      done();
    });

  });

  it('should not update manageables when no schedule', function(done) {
    expectedDevices = [
      {
        id: '42',
        schedules: []
      }
    ];
    expectedGroups = [
      {
        id: '43',
        schedules: []
      }
    ];

    migration.update(function(error) {
      assert.isUndefined(error, 'Unexpected error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(0);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(0);
      done();
    });

  });

  it('should execute callback with an error if getting devices failed', function(done) {
    var expectedError = new Error('Something went wrong');

    DeviceProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
      callback(expectedError);
    });

    migration.update(function(error) {
      assert.strictEqual(error, expectedError, 'Wrong error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(0);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(0);
      done();
    });
  });

  it('should execute callback with an error if getting groups failed', function(done) {
    var expectedError = new Error('Something went wrong');

    GroupProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
      callback(expectedError);
    });

    migration.update(function(error) {
      assert.strictEqual(error, expectedError, 'Wrong error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(0);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(0);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(0);
      done();
    });
  });

  it('should execute callback with an error if updating groups failed', function(done) {
    var expectedError = new Error('Something went wrong');
    var expectedSchedule = {
      name: 'Name',
      beginDate: new Date(),
      duration: 60000,
      preset: '1',
      endDate: new Date(),
      recurrent: true,
      startJobId: 'gw_LaojJK',
      stopJobId: 'jwYv7HGWea',
      id: '9-RmPqYWzQ'
    };
    expectedDevices = [
      {
        id: '42',
        schedules: [expectedSchedule]
      }
    ];
    expectedGroups = [
      {
        id: '43',
        schedules: [expectedSchedule]
      }
    ];

    GroupProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(expectedError);
    });

    migration.update(function(error) {
      assert.strictEqual(error, expectedError, 'Wrong error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(1);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(1);
      done();
    });
  });

  it('should execute callback with an error if updating devices failed', function(done) {
    var expectedError = new Error('Something went wrong');
    var expectedSchedule = {
      name: 'Name',
      beginDate: new Date(),
      duration: 60000,
      preset: '1',
      endDate: new Date(),
      recurrent: true,
      startJobId: 'gw_LaojJK',
      stopJobId: 'jwYv7HGWea',
      id: '9-RmPqYWzQ'
    };
    expectedDevices = [
      {
        id: '42',
        schedules: [expectedSchedule]
      }
    ];
    expectedGroups = [
      {
        id: '43',
        schedules: [expectedSchedule]
      }
    ];

    DeviceProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(expectedError);
    });

    migration.update(function(error) {
      assert.strictEqual(error, expectedError, 'Wrong error');
      DeviceProvider.prototype.getAll.should.have.been.called.exactly(1);
      DeviceProvider.prototype.updateOne.should.have.been.called.exactly(1);
      GroupProvider.prototype.getAll.should.have.been.called.exactly(1);
      GroupProvider.prototype.updateOne.should.have.been.called.exactly(0);
      done();
    });
  });

});
