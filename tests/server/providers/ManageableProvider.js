'use strict';

var path = require('path');
var chai = require('chai');
var mock = require('mock-require');
var spies = require('chai-spies');
var api = require('@openveo/api');
var ResourceFilter = api.storages.ResourceFilter;
var NotFoundError = api.errors.NotFoundError;
var assert = chai.assert;

chai.should();
chai.use(spies);

describe('ManageableProvider', function() {
  var EntityProvider;
  var provider;
  var storage;
  var expectedManageables;
  var openVeoApi;

  // Mocks
  beforeEach(function() {
    storage = {
      createIndexes: function(collection, indexes, callback) {
        callback();
      }
    };
    EntityProvider = function() {
      this.storage = storage;
    };
    EntityProvider.prototype.executeCallback = function() {
      var args = Array.prototype.slice.call(arguments);
      var callback = args.shift();
      if (callback) return callback.apply(null, args);
    };
    EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
      callback(null, expectedManageables[0]);
    });
    EntityProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });

    openVeoApi = {
      providers: {
        EntityProvider: EntityProvider
      },
      storages: api.storages,
      errors: api.errors
    };

    mock('@openveo/api', openVeoApi);
  });

  // Prepare tests
  beforeEach(function() {
    var manageableProviderPath = path.join(process.rootManage, 'app/server/providers/ManageableProvider.js');
    var ManageableProvider = mock.reRequire(manageableProviderPath);
    provider = new ManageableProvider(storage);
  });

  // Stop mocks
  afterEach(function() {
    mock.stopAll();
  });

  describe('addHistoric', function() {

    it('should add an historic to the manageable\'s history', function(done) {
      expectedManageables = [
        {
          id: '42',
          history: []
        }
      ];
      var expectedHistoric = {id: '43'};

      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        callback(null, expectedManageables[0]);
      });

      EntityProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        assert.strictEqual(modifications.history[0], expectedHistoric, 'Wrong historic');
        callback(null, 1);
      });

      provider.addHistoric(expectedManageables[0].id, expectedHistoric, function(error, total) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, 1, 'Wrong total');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if manageable is not found', function(done) {
      EntityProvider.prototype.getOne = function(filter, fields, callback) {
        callback();
      };

      provider.addHistoric('unknownManageableId', {}, function(error, count) {
        assert.instanceOf(error, NotFoundError, 'Wrong error');
        done();
      });
    });

    it('should execute callback with an error if getting manageable failed', function(done) {
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.getOne = function(filter, fields, callback) {
        callback(expectedError);
      };

      provider.addHistoric('unknownManageableId', {}, function(error, total) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        done();
      });
    });

    it('should execute callback with an error if updating manageable failed', function(done) {
      expectedManageables = [
        {
          id: '42',
          history: []
        }
      ];
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.getOne = function(filter, data, callback) {
        callback(expectedError);
      };

      provider.addHistoric(expectedManageables[0].id, {}, function(error, total) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        done();
      });
    });

  });

  describe('removeHistoric', function() {

    it('should remove an historic from the manageable\'s history', function(done) {
      var expectedHistoric = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          history: [expectedHistoric]
        }
      ];

      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        callback(null, expectedManageables[0]);
      });

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        assert.equal(data.history.length, 0, 'Wrong history');
        callback(null, 1);
      });

      provider.removeHistoric(expectedManageables[0].id, expectedHistoric.id, function(error, total) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, 1, 'Wrong total');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if manageable is not found', function(done) {
      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        callback();
      });

      provider.removeHistoric('unknownManageableId', '42', function(error, total) {
        assert.instanceOf(error, NotFoundError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if getting manageable failed', function(done) {
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.getOne = function(filter, fields, callback) {
        callback(expectedError);
      };

      provider.removeHistoric('unknownManageableId', '42', function(error, total) {
        assert.strictEqual(error, expectedError);
        done();
      });
    });

    it('should execute callback with an error if historic couldn\'t be found ', function(done) {
      var expectedHistoric = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          history: [expectedHistoric]
        }
      ];

      provider.removeHistoric(expectedManageables[0].id, 'unknownHistoricId', function(error, total) {
        assert.isNotNull(error, 'Expected an error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if something went wrong', function(done) {
      var expectedHistoric = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          history: [expectedHistoric]
        }
      ];
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.updateOne = function(filter, data, callback) {
        callback(expectedError);
      };

      provider.removeHistoric(expectedManageables[0].id, expectedHistoric.id, function(error, total) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        done();
      });
    });
  });

  describe('removeHistory', function() {

    it('should be able to remove the whole history', function(done) {
      expectedManageables = [
        {
          id: '42',
          history: [{}]
        }
      ];

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        assert.isEmpty(data.history, 'Unexpected history');
        callback(null, 1);
      });

      provider.removeHistory(expectedManageables[0].id, function(error, total) {
        assert.isNull(error, 'Unexepected error');
        assert.equal(total, 1, 'Wrong total');
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  describe('addSchedule', function() {

    it('should add a new schedule', function(done) {
      expectedManageables = [
        {
          id: '42',
          schedules: []
        }
      ];
      var expectedSchedule = {id: '43'};

      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        callback(null, expectedManageables[0]);
      });

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        assert.strictEqual(data.schedules[0], expectedSchedule, 'Wrong schedule');
        callback(null, 1);
      });

      provider.addSchedule(expectedManageables[0].id, expectedSchedule, function(error, total) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, 1, 'Wrong total');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should generate a schedule id if not specified', function(done) {
      expectedManageables = [
        {
          id: '42',
          schedules: []
        }
      ];

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        assert.isNotEmpty(data.schedules[0].id, 'Expected an id');
        callback(null, 1);
      });

      provider.addSchedule(expectedManageables[0].id, {}, function(error, count) {
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if manageable is not found', function(done) {
      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        callback();
      });

      provider.addSchedule('unknownManageableId', {}, function(error, total) {
        assert.instanceOf(error, NotFoundError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if getting manageable failed', function(done) {
      var expectedError = new Error('error');
      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        callback(expectedError);
      });

      provider.addSchedule('unknownManageableId', {}, function(error, total) {
        assert.strictEqual(error, expectedError);
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if updating manageable failed', function(done) {
      expectedManageables = [
        {
          id: '42',
          schedules: []
        }
      ];
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        callback(expectedError);
      });

      provider.addSchedule(expectedManageables[0].id, {}, function(error, count) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  describe('removeSchedule', function() {

    it('should remove a schedule from the list of schedules', function(done) {
      var expectedSchedule = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          schedules: [expectedSchedule]
        }
      ];

      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        callback(null, expectedManageables[0]);
      });

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedManageables[0].id,
          'Wrong id'
        );
        assert.equal(data.schedules.length, 0, 'Wrong history');
        callback(null, 1);
      });

      provider.removeSchedule(expectedManageables[0].id, expectedSchedule.id, function(error, total) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, 1, 'Wrong total');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if getting manageable failed', function(done) {
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.getOne = function(id, filter, callback) {
        callback(expectedError);
      };

      provider.removeSchedule('unknownManageableId', '42', function(error, total) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if manageable is not found', function(done) {
      EntityProvider.prototype.getOne = chai.spy(function(id, filter, callback) {
        callback();
      });

      provider.removeSchedule('unknownManageableId', '42', function(error, total) {
        assert.instanceOf(error, NotFoundError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if schedule could\'nt be found', function(done) {
      var expectedSchedule = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          schedules: [expectedSchedule]
        }
      ];
      EntityProvider.prototype.getOne = chai.spy(function(filter, fields, callback) {
        callback(null, expectedManageables[0]);
      });

      provider.removeSchedule(expectedManageables[0].id, 'unknownScheduleId', function(error, total) {
        assert.isNotNull(error, 'Expected an error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if updating manageable failed', function() {
      var expectedSchedule = {id: '43'};
      expectedManageables = [
        {
          id: '42',
          schedules: [expectedSchedule]
        }
      ];
      var expectedError = new Error('Something went wrong');

      EntityProvider.prototype.updateOne = chai.spy(function(filter, data, callback) {
        callback(expectedError);
      });

      provider.removeSchedule(expectedManageables[0].id, expectedSchedule.id, function(error, count) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        EntityProvider.prototype.getOne.should.have.been.called.exactly(1);
        EntityProvider.prototype.updateOne.should.have.been.called.exactly(1);
      });
    });
  });

});
