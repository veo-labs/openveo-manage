'use strict';

// Module dependencies
var path = require('path');
var openVeoAPI = require('@openveo/api');
var configDir = openVeoAPI.fileSystem.getConfDir();

// Create socket logger
var loggerConf = require(path.join(configDir, 'manage/loggerConf.json'));
process.socketLogger = openVeoAPI.logger.add('openveo-manage-socket', loggerConf);

// Set module root directory
process.rootManage = __dirname;

// Define a new method on process object to be able to require
// a module with a path relative to plugin's root directory
process.requireManage = function(filePath) {
  return require(path.join(process.rootManage, filePath));
};

// Expose the ManagePlugin
module.exports = process.requireManage('app/server/ManagePlugin.js');
