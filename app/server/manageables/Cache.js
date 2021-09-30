'use strict';

/**
 * @module manage/manageables/Cache
 */

var Manageable = process.requireManage('app/server/manageables/Manageable.js');

/**
 * Defines a memory cache for manageables.
 *
 * @class Cache
 * @constructor
 */
function Cache() {
  Object.defineProperties(this,

    /** @lends module:manage/manageables/Cache~Cache */
    {

      /**
       * The list of manageables in the cache.
       *
       * @type {Array}
       * @instance
       * @readonly
       */
      manageables: {value: []}

    }

  );
}

module.exports = Cache;

/**
 * Gets a manageable index, in the list of manageables, by a property.
 *
 * @memberof module:manage/manageables/Cache~Cache
 * @this module:manage/manageables/Cache~Cache
 * @private
 * @param {String} property The item property to look for
 * @param {*} value The expected property value
 * @return {Number} The index of the manageable in the list of manageables, -1 if not found
 */
function getManageableIndexByProperty(property, value) {
  return this.manageables.findIndex(function(manageable) {
    return manageable[property] == value;
  });
}

/**
 * Gets a manageable by a property.
 *
 * @param {String} property The manageable property to look for
 * @param {*} value The expected property value
 * @return {(module:manage/manageables/Manageable~Manageable|Undefined)} The manageable or undefined if not found
 */
Cache.prototype.getManageableByProperty = function(property, value) {
  return this.manageables.find(function(item) {
    return item[property] == value;
  });
};

/**
 * Gets a list of manageables by a property.
 *
 * @param {String} property The item property to look for
 * @param {*} value The expected property value
 * @return {Array} The list of found manageables
 */
Cache.prototype.getManageablesByProperty = function(property, value) {
  var manageables = [];
  this.manageables.forEach(function(manageable) {
    if (manageable[property] === value) {
      manageables.push(manageable);
    }
  });

  return manageables;
};

/**
 * Gets a manageable by its id.
 *
 * @param {String} id The manageable id
 * @return {(module:manage/manageables/Manageable~Manageable|Undefined)} The manageable or undefined if not found
 */
Cache.prototype.get = function(id) {
  return this.getManageableByProperty('id', id);
};

/**
 * Stores a new manageable in cache.
 *
 * @param {module:manage/manageables/Manageable~Manageable} newManageable The new manageable
 */
Cache.prototype.add = function(newManageable) {
  if (!(newManageable instanceof Manageable))
    return;

  var manageable = this.get(newManageable.id);

  if (!manageable)
    this.manageables.push(newManageable);
  else {
    this.remove(manageable.id);
    this.add(newManageable);
  }
};

/**
 * Removes a manageable from cache.
 *
 * @param {(module:manage/manageables/Manageable~Manageable|String)} manageable Either the manageable or the manageable
 * id
 * @return {(module:manage/manageables/Manageable~Manageable|Null)} The manageable or null if not found
 */
Cache.prototype.remove = function(manageable) {
  if (typeof manageable === 'object')
    manageable = manageable.id;

  var index = getManageableIndexByProperty.call(this, 'id', manageable);

  if (index >= 0) {
    var removedManageable = this.manageables[index];
    this.manageables.splice(index, 1);
    return removedManageable;
  }

  return null;
};
