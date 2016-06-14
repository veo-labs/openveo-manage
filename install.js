'use strict';

// Module dependencies
var path = require('path');
var fs = require('fs');
var os = require('os');
var async = require('async');
var openVeoAPI = require('@openveo/api');
var confDir = path.join(openVeoAPI.fileSystem.getConfDir(), 'manage');

var exit = process.exit;

// Set module root directory
process.rootManage = __dirname;
process.requireManage = function(filePath) {
  return require(path.join(process.rootManage, filePath));
};

/**
 * Creates conf directory if it does not exist.
 */
function createConfDir(callback) {
  openVeoAPI.fileSystem.mkdir(confDir, callback);
}

/**
 * Creates loggers configuration file if it does not exist.
 */
function createLoggerConf(callback) {
  var confFile = path.join(confDir, 'loggerConf.json');
  var defaultPath = path.join(os.tmpdir(), 'openveo', 'logs');
  var conf = {
    manage: {
      fileName: path.join(defaultPath, 'openveo-manage.log').replace(/\\/g, '/'),
      level: 'info',
      maxFileSize: 1048576,
      maxFiles: 2
    }
  };

  fs.exists(confFile, function(exists) {
    if (exists) {
      process.stdout.write(confFile + ' already exists\n');
      callback();
    } else
      fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
  });
}


// Launch installation
async.series([
  createConfDir,
  createLoggerConf
], function(error, results) {
  if (error)
    throw error;
  else {
    process.stdout.write('Installation complete');
    exit();
  }
});
