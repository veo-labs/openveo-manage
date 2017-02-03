'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// DeviceModel.js
describe('DeviceModel', function() {
  var model;
  var provider;

  // Prepare tests
  beforeEach(function() {
    provider = new DeviceProvider(new openVeoApi.database.Database({}));
    model = new DeviceModel(provider);
  });

  // STATES property
  describe('STATES', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        model.STATES = null;
      });
    });

  });

  // AVAILABLE_STATES property
  describe('AVAILABLE_STATES', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        model.AVAILABLE_STATES = null;
      });
    });

  });

  // add method
  describe('add', function() {

    it('should be able to add a device to the database', function() {
      var expectedData = {id: 42, state: model.STATES.ACCEPTED};

      provider.add = function(device, callback) {
        callback(null, 1, [device]);
      };

      model.add(expectedData, function(error, count, device) {
        assert.isNull(error, 'Unexepected error');
        assert.equal(count, 1, 'Wrong count');
        assert.strictEqual(device.id, expectedData.id, 'Wrong id');
        assert.strictEqual(device.state, expectedData.state, 'Wrong state');
        assert.deepEqual(device.history, [], 'Wrong history');
        assert.deepEqual(device.schedules, [], 'Wrong schedules');
        assert.equal(device.name, '', 'Wrong name');
      });
    });

    it('should generate an id if not specified', function() {
      provider.add = function(device, callback) {
        callback(null, 1, [device]);
      };

      model.add({}, function(error, count, device) {
        assert.isDefined(device.id);
      });
    });

    it('should set state to PENDING by default', function() {
      provider.add = function(device, callback) {
        callback(null, 1, [device]);
      };

      model.add({}, function(error, count, device) {
        assert.isDefined(device.state, model.STATES.PENDING);
      });
    });

    it('should execute callback with an error if state is not valid', function() {
      model.add({state: 'wrong state'}, function(error, count, device) {
        assert.instanceOf(error, Error);
      });
    });

    it('should make callback optional', function() {
      provider.add = function(device, callback) {
        callback(null, 1, [device]);
      };

      assert.doesNotThrow(function() {
        model.add({});
      });
    });
  });

});
