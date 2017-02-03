'use strict';

/**
 * @module manageables
 */

var Manageable = process.requireManage('app/server/manageables/Manageable.js');

/**
 * Defines a memory cache for manageables.
 *
 * @class Cache
 * @constructor
 */
function Cache() {
  Object.defineProperties(this, {

    /**
     * The list of manageables in the cache.
     *
     * @property manageables
     * @type Array
     * @final
     */
    manageables: {value: []}

  });
}

module.exports = Cache;

/**
 * Gets a manageable index, in the list of manageables, by a property.
 *
 * @method getManageableIndexByProperty
 * @private
 * @param {String} property The item property to look for
 * @param {Mixed} value The expected property value
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
 * @method getManageableByProperty
 * @param {String} property The manageable property to look for
 * @param {Mixed} value The expected property value
 * @return {Manageable|Undefined} The manageable or undefined if not found
 */
Cache.prototype.getManageableByProperty = function(property, value) {
  return this.manageables.find(function(item) {
    return item[property] == value;
  });
};

/**
 * Gets a list of manageables by a property.
 *
 * @method getManageablesByProperty
 * @param {String} property The item property to look for
 * @param {Mixed} value The expected property value
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
 * @method get
 * @param {String} id The manageable id
 * @return {Manageable|Undefined} The manageable or undefined if not found
 */
Cache.prototype.get = function(id) {
  return this.getManageableByProperty('id', id);
};

/**
 * Stores a new manageable in cache.
 *
 * @method add
 * @param {Manageable} newManageable The new manageable
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
 * @method remove
 * @param {Manageable|String} manageable Either the manageable or the manageable id
 * @return {Manageable|Null} The manageable or null if not found
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
