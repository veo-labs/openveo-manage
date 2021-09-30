'use strict';

/**
 * @module manage/ManagePlugin
 */

var util = require('util');
var express = require('express');
var async = require('async');
var openVeoApi = require('@openveo/api');
var ScheduleManager = process.requireManage('app/server/ScheduleManager.js');
var DeviceProvider = process.requireManage('app/server/providers/DeviceProvider.js');
var GroupProvider = process.requireManage('app/server/providers/GroupProvider.js');
var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');
var Manager = process.requireManage('app/server/Manager.js');

/**
 * OpenVeo Manage Plugin.
 *
 * @class ManagePlugin
 * @constructor
 * @extends Plugin
 * @see {@link https://github.com/veo-labs/openveo-api|OpenVeo API documentation} for more information about Plugin and Router
 */
function ManagePlugin() {
  ManagePlugin.super_.call(this);

  Object.defineProperties(this,

    /** @lends module:manage/ManagePlugin~ManagePlugin */
    {

      /**
       * Manage public router.
       *
       * It will be automatically mounted on /manage/ by the core.
       *
       * @type {Router}
       * @instance
       * @readonly
       */
      router: {value: express.Router()},

      /**
       * Manage private router.
       *
       * All routes associated to the private router require a back end authentication.
       * It will be automatically mounted on /be/manage/ by the core.
       *
       * @type {Router}
       * @instance
       * @readonly
       */
      privateRouter: {value: express.Router()},

      /**
       * Manage web service router.
       *
       * All routes associated to the Web Service router will require a Web Service authentication.
       * It will be automatically mounted on /manage/ by the core (but on another server).
       *
       * @type {Router}
       * @instance
       * @readonly
       */
      webServiceRouter: {value: express.Router()}

    }

  );

}

module.exports = ManagePlugin;
util.inherits(ManagePlugin, openVeoApi.plugin.Plugin);

/**
 * Prepares plugin by creating required database indexes.
 *
 * Optional "init" method automatically called by core application
 * after plugin is loaded and before it is started.
 *
 * @param {callback} callback Function to call when it's done
 */
ManagePlugin.prototype.init = function(callback) {
  var database = process.api.getCoreApi().getDatabase();
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
 * Creates a manager to handle groups and devices through socket namespaces.
 *
 * Browsers (back end interfaces) are live-synchronized with connected devices.
 *
 * Optional "start" method automatically called by core application
 * after plugin is loaded and initialized.
 *
 * @param {callback} callback Function to call when it's done
 */
ManagePlugin.prototype.start = function(callback) {
  if (!process.isWebService) {
    var devicesApi = process.api.getApi('devices-api');
    var coreApi = process.api.getCoreApi();
    var deviceProvider = new DeviceProvider(coreApi.getDatabase());
    var groupProvider = new GroupProvider(coreApi.getDatabase());
    var DEVICES_TYPES = devicesApi.getDevicesTypes();
    var devicesPilot = devicesApi.getPilot(DEVICES_TYPES.VEOBOX);
    var browsersPilot = BrowserPilot.get();

    var manager = Manager.get(
      devicesPilot,
      browsersPilot,
      deviceProvider,
      groupProvider,
      new ScheduleManager()
    );

    manager.start(callback);
  } else
    callback();
};
