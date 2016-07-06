'use strict';

var util = require('util');
var openVeoAPI = require('@openveo/api');
var HistoryModel = process.requireManage('app/server/models/HistoryModel.js');
var EntityController = openVeoAPI.controllers.EntityController;
var errors = process.requireManage('app/server/httpErrors.js');

/**
 * Creates an HistoryController
 */
function HistoryController() {
  EntityController.call(this, HistoryModel);
}

module.exports = HistoryController;
util.inherits(HistoryController, EntityController);
