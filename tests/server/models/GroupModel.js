'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// GroupModel.js
describe('GroupModel', function() {
  var model;
  var provider;

  // Prepare tests
  beforeEach(function() {
    provider = new GroupProvider(new openVeoApi.database.Database({}));
    model = new GroupModel(provider);
  });

  // deviceProvider property
  describe('deviceProvider', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        model.deviceProvider = null;
      });
    });

  });

  // add method
  describe('add', function() {

    it('should be able to add a group to the database', function() {
      var expectedData = {id: '42', history: [{id: '43'}], name: 'name'};
      provider.add = function(group, callback) {
        callback(null, 1, [group]);
      };

      model.add(expectedData, function(error, count, group) {
        assert.isNull(error, 'Unexpected error');
        assert.equal(count, 1, 'Wrong count');
        assert.strictEqual(group.id, expectedData.id, 'Wrong id');
        assert.strictEqual(group.name, expectedData.name, 'Wrong name');
        assert.deepEqual(group.schedules, [], 'Wrong schedules');
        assert.deepEqual(group.history, expectedData.history, 'Wrong history');
      });
    });

    it('should generate an id if not specified', function() {
      provider.add = function(group, callback) {
        callback(null, 1, [group]);
      };

      model.add({}, function(error, count, group) {
        assert.isDefined(group.id);
      });
    });

    it('should set a default name if name is not specified', function() {
      provider.add = function(group, callback) {
        callback(null, 1, [group]);
      };

      model.add({}, function(error, count, group) {
        assert.strictEqual(group.name, 'MANAGE.GROUP.DEFAULT_NAME', 'Wrong name');
      });
    });

    it('should make callback optional', function() {
      provider.add = function(group, callback) {
        callback(null, 1, [group]);
      };

      assert.doesNotThrow(function() {
        model.add({});
      });
    });

  });

});
