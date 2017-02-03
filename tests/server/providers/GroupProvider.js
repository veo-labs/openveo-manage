'use strict';

var util = require('util');
var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// GroupProvider.js
describe('GroupProvider', function() {
  var TestDatabase;
  var provider;
  var database;

  // Mocks
  beforeEach(function() {
    TestDatabase = function(configuration) {
      TestDatabase.super_.call(this, configuration);
    };

    util.inherits(TestDatabase, openVeoApi.database.Database);
  });

  // Prepare tests
  beforeEach(function() {
    database = new TestDatabase({});
    provider = new GroupProvider(database);
  });

  // createIndexes method
  describe('createIndexes', function() {

    it('should be able to create indexes by id for the collection', function() {
      var expectedResult = {};
      database.createIndexes = function(collection, indexes, callback) {
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
      database.createIndexes = function(collection, indexes, callback) {
        callback(expectedError);
      };

      provider.createIndexes(function(error) {
        assert.strictEqual(error, expectedError);
      });
    });
  });

});
