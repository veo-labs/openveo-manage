'use strict';

// Module dependencies
var util = require('util');
var openVeoAPI = require('@openveo/api');

var HistoryProvider = process.requireManage('app/server/providers/HistoryProvider.js');

/**
 * Creates an HistoryModel.
 */
function HistoryModel() {
  openVeoAPI.EntityModel.call(this, new HistoryProvider(openVeoAPI.applicationStorage.getDatabase()));
}

module.exports = HistoryModel;
util.inherits(HistoryModel, openVeoAPI.EntityModel);
