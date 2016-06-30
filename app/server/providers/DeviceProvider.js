'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a DeviceProvider.
 */
function DeviceProvider(database) {

  // In DeviceProvider collection "devices"
  openVeoAPI.EntityProvider.call(this, database, 'manage_devices');
}

// DeviceProvider must extend EntityProvider
module.exports = DeviceProvider;
util.inherits(DeviceProvider, openVeoAPI.EntityProvider);
