'use strict';

// Module dependencies
var util = require('util');
var openVeoAPI = require('@openveo/api');

var ScheduleProvider = process.requireManage('app/server/providers/ScheduleProvider.js');

/**
 * Creates a ScheduleModel.
 */
function ScheduleModel() {
  openVeoAPI.EntityModel.call(this, new ScheduleProvider(openVeoAPI.applicationStorage.getDatabase()));
}

module.exports = ScheduleModel;
util.inherits(ScheduleModel, openVeoAPI.EntityModel);
