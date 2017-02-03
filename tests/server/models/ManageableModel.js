'use strict';

var util = require('util');
var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var ManageableModel = process.requireManage('app/server/models/ManageableModel.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// ManageableModel.js
describe('ManageableModel', function() {
  var model;
  var provider;
  var TestProvider;

  // Mocks
  beforeEach(function() {
    TestProvider = function(database) {
      TestProvider.super_.call(this, database, 'collection');
    };

    util.inherits(TestProvider, openVeoApi.providers.EntityProvider);
  });

  // Prepare tests
  beforeEach(function() {
    provider = new TestProvider(new openVeoApi.database.Database({}));
    model = new ManageableModel(provider);
  });

  // addHistoric method
  describe('addHistoric', function() {

    it('should be able to add an historic to the manageable\'s history', function() {
      var manageable = {id: '42', history: []};
      var expectedHistoric = {id: '43'};
      provider.getOne = function(id, filter, callback) {
        callback(null, manageable);
      };

      provider.update = function(id, data, callback) {
        assert.strictEqual(id, manageable.id, 'Wrong id');
        assert.strictEqual(data.history[0], expectedHistoric, 'Wrong historic');
        callback(null, 1);
      };

      model.addHistoric(manageable.id, expectedHistoric, function(error, count) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(count, 1, 'Wrong count');
      });
    });

    it('should execute callback with an error if manageable is not found', function() {
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(expectedError);
      };

      model.addHistoric('unknown manageable', {}, function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });

    it('should execute callback with an error if something went wrong', function() {
      var expectedManageable = {id: '42', history: []};
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      provider.update = function(id, data, callback) {
        callback(expectedError);
      };

      model.addHistoric(expectedManageable.id, {}, function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });
  });

  // removeHistoric method
  describe('removeHistoric', function() {

    it('should be able to remove an historic from the manageable\'s history', function() {
      var expectedHistoric = {id: '43'};
      var manageable = {id: '42', history: [expectedHistoric]};
      provider.getOne = function(id, filter, callback) {
        callback(null, manageable);
      };

      provider.update = function(id, data, callback) {
        assert.strictEqual(id, manageable.id, 'Wrong id');
        assert.equal(data.history.length, 0, 'Wrong history');
        callback(null, 1);
      };

      model.removeHistoric(manageable.id, expectedHistoric.id, function(error, count) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(count, 1, 'Wrong count');
      });
    });

    it('should execute callback with an error if manageable is not found', function() {
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(expectedError);
      };

      model.removeHistoric('unknown manageable', '42', function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });

    it('should execute callback with an error if historic could\'nt be found ', function() {
      var expectedHistoric = {id: '43'};
      var expectedManageable = {id: '42', history: [expectedHistoric]};
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      model.removeHistoric(expectedManageable.id, 'unknown historic', function(error, count) {
        assert.instanceOf(error, Error);
      });
    });

    it('should execute callback with an error if something went wrong', function() {
      var expectedHistoric = {id: '43'};
      var expectedManageable = {id: '42', history: [expectedHistoric]};
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      provider.update = function(id, data, callback) {
        callback(expectedError);
      };

      model.removeHistoric(expectedManageable.id, expectedHistoric.id, function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });
  });

  // removeHistory method
  describe('removeHistory', function() {

    it('should be able to remove the whole history', function() {
      var expectedManageable = {id: '42', history: [{}]};

      provider.update = function(id, data, callback) {
        assert.strictEqual(id, expectedManageable.id, 'Wrong id');
        assert.deepEqual(data.history, [], 'Wrong history');
        callback(null, 1);
      };

      model.removeHistory(expectedManageable.id, function(error, count) {
        assert.isNull(error, 'Unexepected error');
        assert.equal(count, 1, 'Wrong count');
      });
    });

  });

  // addSchedule method
  describe('addSchedule', function() {

    it('should be able to add a new schedule', function() {
      var manageable = {id: '42', schedules: []};
      var expectedSchedule = {id: '43'};
      provider.getOne = function(id, filter, callback) {
        callback(null, manageable);
      };

      provider.update = function(id, data, callback) {
        assert.strictEqual(id, manageable.id, 'Wrong id');
        assert.strictEqual(data.schedules[0], expectedSchedule, 'Wrong schedule');
        callback(null, 1);
      };

      model.addSchedule(manageable.id, expectedSchedule, function(error, count) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(count, 1, 'Wrong count');
      });
    });

    it('should generate a schedule if if not specified', function() {
      var manageable = {id: '42', schedules: []};

      provider.getOne = function(id, filter, callback) {
        callback(null, manageable);
      };

      provider.update = function(id, data, callback) {
        assert.isDefined(id);
        callback(null, 1);
      };

      model.addSchedule(manageable.id, {}, function(error, count) {});
    });

    it('should execute callback with an error if manageable is not found', function() {
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(expectedError);
      };

      model.addSchedule('unknown manageable', {}, function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });

    it('should execute callback with an error if something went wrong', function() {
      var expectedManageable = {id: '42', schedules: []};
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      provider.update = function(id, data, callback) {
        callback(expectedError);
      };

      model.addSchedule(expectedManageable.id, {}, function(error, count) {
        assert.strictEqual(error, expectedError);
      });

    });
  });

  // removeHSchedule method
  describe('removeSchedule', function() {

    it('should be able to remove a schedule from the list of schedules', function() {
      var expectedSchedule = {id: '43'};
      var manageable = {id: '42', schedules: [expectedSchedule]};
      provider.getOne = function(id, filter, callback) {
        callback(null, manageable);
      };

      provider.update = function(id, data, callback) {
        assert.strictEqual(id, manageable.id, 'Wrong id');
        assert.equal(data.schedules.length, 0, 'Wrong history');
        callback(null, 1);
      };

      model.removeSchedule(manageable.id, expectedSchedule.id, function(error, count) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(count, 1, 'Wrong count');
      });
    });

    it('should execute callback with an error if manageable is not found', function() {
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(expectedError);
      };

      model.removeSchedule('unknown manageable', '42', function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });

    it('should execute callback with an error if schedule could\'nt be found ', function() {
      var expectedSchedule = {id: '43'};
      var expectedManageable = {id: '42', schedules: [expectedSchedule]};
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      model.removeSchedule(expectedManageable.id, 'unknown schedule', function(error, count) {
        assert.instanceOf(error, Error);
      });
    });

    it('should execute callback with an error if something went wrong', function() {
      var expectedSchedule = {id: '43'};
      var expectedManageable = {id: '42', schedules: [expectedSchedule]};
      var expectedError = new Error('error');
      provider.getOne = function(id, filter, callback) {
        callback(null, expectedManageable);
      };

      provider.update = function(id, data, callback) {
        callback(expectedError);
      };

      model.removeSchedule(expectedManageable.id, expectedSchedule.id, function(error, count) {
        assert.strictEqual(error, expectedError);
      });
    });
  });
});
