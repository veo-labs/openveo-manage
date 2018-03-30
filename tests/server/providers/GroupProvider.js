'use strict';

var path = require('path');
var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var mock = require('mock-require');
var assert = chai.assert;
var ResourceFilter = openVeoApi.storages.ResourceFilter;

chai.should();
chai.use(spies);

describe('GroupProvider', function() {
  var ManageableProvider;
  var expectedGroups;
  var provider;
  var storage;

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
      callback(null, expectedGroups.length, expectedGroups);
    });
    ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });

    mock(path.join(process.rootManage, 'app/server/providers/ManageableProvider.js'), ManageableProvider);
  });

  // Prepare tests
  beforeEach(function() {
    var GroupProvider = mock.reRequire(path.join(process.rootManage, 'app/server/providers/GroupProvider.js'));
    provider = new GroupProvider(storage);
  });

  // Stop mocks
  afterEach(function() {
    mock.stopAll();
  });

  describe('add', function() {

    it('should add groups', function(done) {
      expectedGroups = [
        {
          id: 42,
          name: 'Name',
          history: []
        }
      ];

      ManageableProvider.prototype.add = chai.spy(function(groups, callback) {
        assert.equal(groups[0].id, expectedGroups[0].id, 'Wrong id');
        assert.equal(groups[0].name, expectedGroups[0].name, 'Wrong name');
        assert.strictEqual(groups[0].history, expectedGroups[0].history, 'Wrong history');
        assert.isEmpty(groups[0].schedules, 'Wrong schedules');
        callback(null, groups.length, groups);
      });

      provider.add(expectedGroups, function(error, total, groups) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(total, groups.length, 'Wrong total');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if adding groups failed', function(done) {
      expectedGroups = [{}];

      ManageableProvider.prototype.add = chai.spy(function(groups, callback) {
        callback(new Error('Something went wrong'));
      });

      provider.add(expectedGroups, function(error, total, groups) {
        assert.isNotNull(error, 'Wrong error');
        ManageableProvider.prototype.add.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  describe('updateOne', function() {

    it('should update a group', function(done) {
      var expectedId = '42';
      var expectedModifications = {
        name: 'Name',
        history: [],
        schedules: [],
        unexpectedProperty: 'Unexpected property value'
      };
      var expectedFilter = new ResourceFilter().equal('id', expectedId);

      ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.strictEqual(filter, expectedFilter, 'Wrong filter');
        assert.equal(modifications.name, expectedModifications.name, 'Wrong name');
        assert.strictEqual(modifications.history, expectedModifications.history, 'Wrong history');
        assert.strictEqual(modifications.schedules, expectedModifications.schedules, 'Wrong schedules');
        assert.notProperty(modifications, 'unexpectedProperty', 'Unexpected property');
        callback(null, 1);
      });

      provider.updateOne(expectedFilter, expectedModifications, function(error, total, groups) {
        assert.isNull(error, 'Unexpected error');
        ManageableProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if updating group failed', function(done) {
      ManageableProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        callback(new Error('Something went wrong'));
      });

      provider.updateOne(new ResourceFilter(), {}, function(error, total, groups) {
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
