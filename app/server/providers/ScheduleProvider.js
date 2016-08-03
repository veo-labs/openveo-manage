'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a ScheduleProvider.
 */
function ScheduleProvider(database) {

  // In ScheduleProvider collection "schedules"
  openVeoAPI.EntityProvider.call(this, database, 'manage_schedules');
}

// ScheduleProvider must extend EntityProvider
module.exports = ScheduleProvider;
util.inherits(ScheduleProvider, openVeoAPI.EntityProvider);
