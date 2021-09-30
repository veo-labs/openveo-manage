'use strict';

/**
 * @module manage/providers/ManageableProvider
 */

var util = require('util');
var nanoid = require('nanoid').nanoid;
var openVeoApi = require('@openveo/api');
var ResourceFilter = openVeoApi.storages.ResourceFilter;
var NotFoundError = openVeoApi.errors.NotFoundError;

/**
 * Defines a ManageableProvider for entities with an history and a planning.
 *
 * @class ManageableProvider
 * @extends EntityProvider
 * @constructor
 * @param {Database} database The database to interact with
 * @param {String} location The location of the manageables in the storage
 * @see {@link https://github.com/veo-labs/openveo-api|OpenVeo API documentation} for more information about EntityProvider and Database
 */
function ManageableProvider(database, location) {
  ManageableProvider.super_.call(this, database, location);
}

module.exports = ManageableProvider;
util.inherits(ManageableProvider, openVeoApi.providers.EntityProvider);

/**
 * Adds an item to an array in a manageable.
 *
 * @memberof module:manage/providers/ManageableProvider~ManageableProvider
 * @this module:manage/providers/ManageableProvider~ManageableProvider
 * @private
 * @param {String} id The manageable id
 * @param {String} property The property containing an array
 * @param {*} value The value to add
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~addArrayItemCallback} callback The function to
 * call when it's done
 */
function addArrayItem(id, property, value, callback) {
  var self = this;
  var filter = new ResourceFilter().equal('id', id);
  this.getOne(filter, null, function(error, item) {
    if (error) return callback(error);
    if (!item) return callback(new NotFoundError(id));

    item[property].push(value);

    var data = {};
    data[property] = item[property];
    self.updateOne(filter, data, callback);
  });
}

/**
 * Removes an item from an array of objects in a manageable.
 *
 * @memberof module:manage/providers/ManageableProvider~ManageableProvider
 * @this module:manage/providers/ManageableProvider~ManageableProvider
 * @private
 * @param {String} id The manageable id
 * @param {String} property The property containing an array
 * @param {String} propertyKey The property to analyze in array objects to find the item to remove
 * @param {String} value The value of the property to analyze in array objects to find the item to remove
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~removeArrayItemCallback} callback The function
 * to call when it's done
 */
function removeArrayItem(id, property, propertyKey, value, callback) {
  var self = this;
  var filter = new ResourceFilter().equal('id', id);

  this.getOne(filter, null, function(error, item) {
    if (error) return callback(error);
    if (!item) return callback(new NotFoundError(id));

    var index = -1;
    for (var i = 0; i < item[property].length; i++) {
      if (item[property][i][propertyKey] === value) {
        index = i;
        break;
      }
    }

    if (index === -1)
      return callback(new Error('No matching property'));

    item[property].splice(index, 1);

    var data = {};
    data[property] = item[property];
    self.updateOne(filter, data, callback);
  });
}

/**
 * Adds a new historic to manageable's history.
 *
 * @param {String} id The manageable item id
 * @param {Object} historic An historic description object
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~addHistoricCallback} callback The function to
 * call when it's done
 */
ManageableProvider.prototype.addHistoric = function(id, historic, callback) {
  addArrayItem.call(this, id, 'history', historic, callback);
};

/**
 * Removes an entry from a manageable's history.
 *
 * @param {String} id The manageable id
 * @param {String} historicId The historic id
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~removeHistoricCallback} callback The function
 * to call when it's done
 */
ManageableProvider.prototype.removeHistoric = function(id, historicId, callback) {
  removeArrayItem.call(this, id, 'history', 'id', historicId, callback);
};

/**
 * Removes an entry from a manageable's history.
 *
 * @param {String} id The manageable id
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~removeHistoryCallback} callback The function
 * to call when it's done
 */
ManageableProvider.prototype.removeHistory = function(id, callback) {
  this.updateOne(new ResourceFilter().equal('id', id), {history: []}, callback);
};

/**
 * Adds a new schedule to manageable.
 *
 * @param {String} id The manageable id
 * @param {Object} schedule A schedule description object
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~addScheduleCallback} callback The function to
 * call when it's done
 */
ManageableProvider.prototype.addSchedule = function(id, schedule, callback) {
  schedule.id = nanoid();
  addArrayItem.call(this, id, 'schedules', schedule, callback);
};

/**
 * Removes a manageable's schedule.
 *
 * @param {String} id The manageable id
 * @param {String} scheduleId The schedule id
 * @param {module:manage/providers/ManageableProvider~ManageableProvider~removeScheduleCallback} callback The function
 * to call when it's done
 */
ManageableProvider.prototype.removeSchedule = function(id, scheduleId, callback) {
  removeArrayItem.call(this, id, 'schedules', 'id', scheduleId, callback);
};

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~addArrayItemCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~removeArrayItemCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~addHistoricCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~removeHistoricCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~removeHistoryCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total 1 if everything went fine
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~addScheduleCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total The total amount of items inserted
 */

/**
 * @callback module:manage/providers/ManageableProvider~ManageableProvider~removeScheduleCallback
 * @param {(Error|null)} error The error if an error occurred, null otherwise
 * @param {Number} total The total amount of items updated
 */
