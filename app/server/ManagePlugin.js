'use strict';

// Module dependencies
var util = require('util');
var express = require('express');
var async = require('async');
var openVeoAPI = require('@openveo/api');

/**
 * Creates a ManagePlugin.
 *
 * @class ManagePlugin
 * @constructor
 * @extends Plugin
 */
function ManagePlugin() {

  /**
   * Creates a public router
   * It will be automatically mounted on /manage/ by the core
   *
   * Manage public router.
   *
   * @property router
   * @type Router
   */
  this.router = express.Router();

  /**
   * Creates a private router
   * All routes associated to the private router require a back end authentication
   * It will be automatically mounted on /be/manage/ by the core
   *
   * Manage private router.
   *
   * @property router
   * @type Router
   */
  this.privateRouter = express.Router();

  /**
   * Creates a Web Service router
   * All routes associated to the Web Service router will be part of the Web Service
   * It will be automatically mounter on /manage/ by the core (but on another server)
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
    // Set new providers
    // new ExampleProvider(database)
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

  }

  callback();
};
