'use strict';

var path = require('path');
var util = require('util');
var express = require('express');
var async = require('async');
var openVeoAPI = require('@openveo/api');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var SocketServerManager = process.requireManage('app/server/socket/SocketServerManager.js');
var ManageServer = process.requireManage('app/server/services/ManageServer.js');
var DevicesSocketNamespace = process.requireManage('app/server/services/namespaces/DevicesSocketNamespace.js');
var BrowsersSocketNamespace = process.requireManage('app/server/services/namespaces/BrowsersSocketNamespace.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));

/**
 * Creates a ManagePlugin.
 *
 * @class ManagePlugin
 * @constructor
 * @extends Plugin
 */
function ManagePlugin() {

  /**
   * Creates a public router.
   * It will be automatically mounted on /manage/ by the core.
   *
   * Manage public router.
   *
   * @property router
   * @type Router
   */
  this.router = express.Router();

  /**
   * Creates a private router.
   * All routes associated to the private router require a back end authentication.
   * It will be automatically mounted on /be/manage/ by the core.
   *
   * Manage private router.
   *
   * @property router
   * @type Router
   */
  this.privateRouter = express.Router();

  /**
   * Creates a Web Service router.
   * All routes associated to the Web Service router will be part of the Web Service.
   * It will be automatically mounted on /manage/ by the core (but on another server).
   *
   * Manage web service router.
   *
   * @property router
   * @type Router
   */
  this.webServiceRouter = express.Router();

  // Define routes directly here or in the configuration file

}

// Expose ManagePlugin
module.exports = ManagePlugin;

// Extends Plugin
util.inherits(ManagePlugin, openVeoAPI.Plugin);

/**
 * Prepares plugin by creating required database indexes.
 *
 * Optional "init" method automatically called by core application
 * after plugin is loaded and before it is started.
 *
 * @method init
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
ManagePlugin.prototype.init = function(callback) {

  var database = openVeoAPI.applicationStorage.getDatabase();
  var asyncFunctions = [];
  var providers = [
    new DeviceProvider(database),
    new GroupProvider(database)
  ];

  providers.forEach(function(provider) {
    if (provider.createIndexes) {
      asyncFunctions.push(function(callback) {
        provider.createIndexes(callback);
      });
    }
  });

  async.parallel(asyncFunctions, function(error, results) {
    callback(error);
  });
};

/**
 * Creates and starts a socket server to establish communication
 * with devices and browsers.
 *
 * Browsers (back end interfaces) are live-synchronized with connected devices.
 *
 * Optional "start" method automatically called by core application
 * after plugin is loaded and initialized.
 *
 * @method start
 * @async
 * @param {Function} callback Function to call when it's done with :
 *  - **Error** An error if something went wrong, null otherwise
 */
ManagePlugin.prototype.start = function(callback) {
  if (!process.isWebService) {

    // Start server
    var server = SocketServerManager.getServer();
    server.listen(manageConf.port);
    process.socketLogger.info('Start socket server on port ' + manageConf.port);

    // Add devices and browsers socket namespaces
    var devicesNamespace = new DevicesSocketNamespace();
    var browsersNamespace = new BrowsersSocketNamespace();
    server.addNamespace(devicesNamespace, manageConf.devicesNamespace);
    server.addNamespace(browsersNamespace, manageConf.browsersNamespace);
    process.socketLogger.info('Connect devices on namespace "' + manageConf.devicesNamespace + '"');
    process.socketLogger.info('Connect browsers on namespace "' + manageConf.browsersNamespace + '"');

    // Create a manage server to live synchronize browsers with devices information
    var manageServer = ManageServer.get(devicesNamespace, browsersNamespace);
    manageServer.connect(callback);

  } else
    callback();
};
