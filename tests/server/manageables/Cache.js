'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var Cache = process.requireManage('app/server/manageables/Cache.js');
var Manageable = process.requireManage('app/server/manageables/Manageable.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// Cache.js
describe('Cache', function() {
  var cache;

  // Prepare tests
  beforeEach(function() {
    cache = new Cache();
  });

  // manageables property
  describe('manageables', function() {

    it('should not be editable', function() {
      assert.throws(function() {
        cache.manageables = null;
      });
    });

  });

  // getManageableByProperty method
  describe('getManageableByProperty', function() {

    it('should be able to retrieve a manageable by property', function() {
      var expectedId = '42';
      var expectedManageable = new Manageable({
        id: expectedId
      });

      cache.add(expectedManageable);
      assert.strictEqual(cache.getManageableByProperty('id', expectedId), expectedManageable);
    });

    it('should return null if not found', function() {
      assert.isUndefined(cache.getManageableByProperty('id', '42'));
    });

  });

  // getManageablesByProperty method
  describe('getManageablesByProperty', function() {

    it('should be able to retrieve manageables by property', function() {
      var expectedPropertyValue = 'test';
      var expectedManageables = [
        new Manageable({id: '42'}),
        new Manageable({id: '43'})
      ];

      expectedManageables.forEach(function(manageable) {
        manageable.test = expectedPropertyValue;
        cache.add(manageable);
      });

      assert.deepEqual(cache.getManageablesByProperty('test', expectedPropertyValue), expectedManageables);
    });

    it('should return an empty array if no manageable found', function() {
      assert.deepEqual(cache.getManageablesByProperty('test', 'test'), []);
    });

  });

  // get method
  describe('get', function() {

    it('should be able to retrieve a manageable by its id', function() {
      var expectedId = '42';
      var expectedManageable = new Manageable({id: expectedId});
      cache.add(expectedManageable);

      assert.strictEqual(cache.get(expectedId), expectedManageable);
    });

    it('should return undefined if manageable has not been found', function() {
      assert.isUndefined(cache.get('id'));
    });

  });

  // add method
  describe('add', function() {

    it('should be able to add a new manageable', function() {
      var expectedId = '42';
      var expectedManageable = new Manageable({id: expectedId});
      cache.add(expectedManageable);
      assert.strictEqual(cache.get(expectedId), expectedManageable);
    });

    it('should be able to replace a manageable by the new one if it has already been added', function() {
      var expectedId = '42';
      var expectedManageable1 = new Manageable({id: expectedId, name: 'test'});
      var expectedManageable2 = new Manageable({id: expectedId, name: 'test2'});
      cache.add(expectedManageable1);
      cache.add(expectedManageable2);
      assert.strictEqual(cache.get(expectedId), expectedManageable2);
    });

    it('should be able to an object other than a Manageable', function() {
      cache.add({id: '42'});
      assert.equal(cache.manageables.length, 0);
    });

  });

  // remove method
  describe('remove', function() {

    it('should be able to remove a manageable', function() {
      var expectedId = '42';
      var expectedManageable = new Manageable({id: expectedId});
      cache.add(expectedManageable);
      var removedManageable = cache.remove(expectedManageable);

      assert.strictEqual(removedManageable, expectedManageable, 'Wrong manageable');
      assert.isUndefined(cache.get(expectedId), 'Unexpected manageable');
    });

    it('should be able to remove a manageable by its id', function() {
      var expectedId = '42';
      var expectedManageable = new Manageable({id: expectedId});
      cache.add(expectedManageable);
      var removedManageable = cache.remove(expectedManageable.id);

      assert.strictEqual(removedManageable, expectedManageable, 'Wrong manageable');
      assert.isUndefined(cache.get(expectedId), 'Unexpected manageable');
    });

    it('should return null if manageable was not found', function() {
      assert.isNull(cache.remove('42'));
    });
  });

});
