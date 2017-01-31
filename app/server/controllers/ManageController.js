'use strict';

var util = require('util');
var path = require('path');
var openVeoAPI = require('@openveo/api');
var Controller = openVeoAPI.controllers.Controller;
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));

/**
 * Creates a ManageController to handle actions on manage configuration.
 *
 * @class ManageController
 * @constructor
 * @extends Controller
 */
function ManageController() {
  Controller.call(this);
}

module.exports = ManageController;
util.inherits(ManageController, Controller);

/**
 * Gets plugin's configuration.
 *
 * @method getConfigurationAction
 */
ManageController.prototype.getConfigurationAction = function(request, response, next) {
  response.send({
    port: manageConf.port,
    frontalPort: manageConf.frontalPort,
    browsersNamespace: manageConf.browsersNamespace,
    devicesNamespace: manageConf.devicesNamespace
  });
};
