'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var EntityController = openVeoAPI.controllers.EntityController;

// var errors = process.requireManage('app/server/httpErrors.js');

/**
 * Creates a DeviceController
 */
function DeviceController() {
  EntityController.call(this, DeviceModel);
}

module.exports = DeviceController;
util.inherits(DeviceController, EntityController);
