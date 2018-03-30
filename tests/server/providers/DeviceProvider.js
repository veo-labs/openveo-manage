'use strict';

var path = require('path');
var chai = require('chai');
var mock = require('mock-require');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var ResourceFilter = openVeoApi.storages.ResourceFilter;
var assert = chai.assert;

chai.should();
chai.use(spies);

describe('DeviceProvider', function() {
  var ManageableProvider;
  var provider;
  var storage;
  var expectedDevices;

  // Mocks
  beforeEach(function() {
    storage = {
      createIndexes: function(collection, indexes, callback) {
        callback();
      }
    };
    ManageableProvider = function() {
      this.storage = storage;
    };
    ManageableProvider.prototype.executeCallback = function() {
      var args = Array.prototype.slice.call(arguments);
      var callback = args.shift();
      if (callback) return callback.apply(null, args);
    };
    ManageableProvider.prototype.add = chai.spy(function(data, callback) {
      callback(null, expectedDevices.length, expectedDevices);
    });
    ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });

    mock(path.join(process.rootManage, 'app/server/providers/ManageableProvider.js'), ManageableProvider);
  });

  // Prepare tests
  beforeEach(function() {
    var DeviceProvider = mock.reRequire(path.join(process.rootManage, 'app/server/providers/DeviceProvider.js'));
    provider = new DeviceProvider(storage);
  });

  // Stop mocks
  afterEach(function() {
    mock.stopAll();
  });

  describe('STATES', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        provider.STATES = null;
      });
    });

  });

  describe('AVAILABLE_STATES', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        provider.AVAILABLE_STATES = null;
      });
    });

  });

  describe('add', function() {

    it('should add devices', function(done) {
      expectedDevices = [
        {
          id: 42,
          state: provider.STATES.ACCEPTED
        }
      ];

      ManageableProvider.prototype.add = chai.spy(function(devices, callback) {
        assert.equal(devices[0].id, expectedDevices[0].id, 'Wrong id');
        assert.equal(devices[0].state, expectedDevices[0].state, 'Wrong state');
        assert.isEmpty(devices[0].name, 'Wrong name');
        assert.isEmpty(devices[0].history, 'Wrong history');
        assert.isEmpty(devices[0].schedules, 'Wrong schedules');
        callback(null, devices.length, devices);
      });

      provider.add(expectedDevices, function(error, total, devices) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, devices.length, 'Wrong total');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should generate an id if not specified', function(done) {
      expectedDevices = [{}];

      ManageableProvider.prototype.add = chai.spy(function(devices, callback) {
        assert.isDefined(devices[0].id, 'Expected id to be generated');
        callback(null, devices.length, devices);
      });

      provider.add(expectedDevices, function(error, total, devices) {
        assert.isNull(error, 'Unexpected error');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should set state to PENDING by default', function(done) {
      expectedDevices = [{}];

      ManageableProvider.prototype.add = chai.spy(function(devices, callback) {
        assert.isDefined(devices[0].state, provider.STATES.PENDING, 'Wrong state');
        callback(null, devices.length, devices);
      });

      provider.add(expectedDevices, function(error, total, devices) {
        assert.isNull(error, 'Unexpected error');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if state is not valid', function(done) {
      expectedDevices = [{
        state: 'invalidState'
      }];

      provider.add(expectedDevices, function(error, total, devices) {
        assert.isNotNull(error, 'Wrong error');
        ManageableProvider.prototype.add.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if adding devices failed', function(done) {
      expectedDevices = [{}];

      ManageableProvider.prototype.add = chai.spy(function(devices, callback) {
        callback(new Error('Something went wrong'));
      });

      provider.add(expectedDevices, function(error, total, devices) {
        assert.isNotNull(error, 'Wrong error');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });
  });

  describe('updateOne', function() {

    it('should update a device', function(done) {
      var expectedId = '42';
      var expectedModifications = {
        name: 'Name',
        state: provider.STATES.ACCEPTED,
        history: [],
        schedules: [],
        unexpectedProperty: 'Unexpected property value'
      };
      var expectedFilter = new ResourceFilter().equal('id', expectedId);

      ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.strictEqual(filter, expectedFilter, 'Wrong filter');
        assert.equal(modifications.name, expectedModifications.name, 'Wrong name');
        assert.equal(modifications.state, expectedModifications.state, 'Wrong state');
        assert.strictEqual(modifications.history, expectedModifications.history, 'Wrong history');
        assert.strictEqual(modifications.schedules, expectedModifications.schedules, 'Wrong schedules');
        assert.notProperty(modifications, 'unexpectedProperty', 'Unexpected property');
        callback(null, 1);
      });

      provider.updateOne(expectedFilter, expectedModifications, function(error, total, devices) {
        assert.isNull(error, 'Unexpected error');
        ManageableProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should not be able to specify an invalid state', function(done) {
      var expectedModifications = {
        state: 'invalidState'
      };

      ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.notProperty(modifications, 'state', 'Unexpected state');
        callback(null, 1);
      });

      provider.updateOne(new ResourceFilter(), expectedModifications, function(error, total, devices) {
        assert.isNull(error, 'Unexpected error');
        ManageableProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if updating device failed', function(done) {
      ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        callback(new Error('Something went wrong'));
      });

      provider.updateOne(new ResourceFilter(), {}, function(error, total, devices) {
        assert.isNotNull(error, 'Wrong error');
        ManageableProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });
  });

  describe('createIndexes', function() {

    it('should be able to create indexes by id for the collection', function() {
      var expectedResult = {};
      storage.createIndexes = function(collection, indexes, callback) {
        var isIdIndex = false;
        assert.strictEqual(provider.collection, collection, 'Wrong collection');

        indexes.forEach(function(index) {
          if (index.key && index.key.id === 1)
            isIdIndex = true;
        });

        assert.ok(isIdIndex, 'Expected an index by id');
        callback(null, expectedResult);
      };

      provider.createIndexes(function(error) {
        assert.isNull(error, 'Unexpected error');
      });
    });

    it('should execute callback with an error if something went wrong', function() {
      var expectedError = new Error('error');
      storage.createIndexes = function(collection, indexes, callback) {
        callback(expectedError);
      };

      provider.createIndexes(function(error) {
        assert.strictEqual(error, expectedError);
      });
    });
  });

});
