'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates an HistoryProvider.
 */
function HistoryProvider(database) {

  // In HistoryProvider collection "histories"
  openVeoAPI.EntityProvider.call(this, database, 'manage_histories');
}

// HistoryProvider must extend EntityProvider
module.exports = HistoryProvider;
util.inherits(HistoryProvider, openVeoAPI.EntityProvider);
