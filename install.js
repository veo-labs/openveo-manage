'use strict';

// Module dependencies
var readline = require('readline');
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

// Create a readline interface to interact with the user
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Creates conf directory if it does not exist.
 */
function createConfDir(callback) {
  openVeoAPI.fileSystem.mkdir(confDir, callback);
}

/**
 * Creates general configuration file if it does not exist.
 */
function createConf(callback) {
  var confFile = path.join(confDir, 'manageConf.json');
  var conf = {
    devicesNamespace: '/devices',
    browsersNamespace: '/browsers',
    port: 3002
  };

  async.series([
    function(callback) {
      fs.exists(confFile, function(exists) {
        if (exists)
          callback(new Error(confFile + ' already exists\n'));
        else
          callback();
      });
    },
    function(callback) {
      rl.question('Enter the socket.io namespace to use for devices (default: ' + conf.devicesNamespace + ') :\n',
      function(answer) {
        if (answer) conf.devicesNamespace = answer;
        callback();
      });
    },
    function(callback) {
      rl.question('Enter the socket.io namespace to use for browsers (default: ' + conf.browsersNamespace + ') :\n',
      function(answer) {
        if (answer) conf.browsersNamespace = answer;
        callback();
      });
    },
    function(callback) {
      rl.question('Enter the port to use for the socket.io server (default: ' + conf.port + ') :\n',
      function(answer) {
        if (answer) conf.port = Number(answer);
        callback();
      });
    }
  ],
  function(error, results) {
    if (error) {
      process.stdout.write(error.message);
      callback();
    } else {
      fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
    }
  });
}

/**
 * Creates loggers configuration file if it does not exist.
 */
function createLoggerConf(callback) {
  var confFile = path.join(confDir, 'loggerConf.json');

  fs.exists(confFile, function(exists) {
    if (exists) {
      process.stdout.write(confFile + ' already exists\n');
      callback();
    } else {
      var defaultPath = path.join(os.tmpdir(), 'openveo', 'logs');
      rl.question('Enter logger directory path for sockets (default: ' + defaultPath + ') :\n',
      function(answer) {
        var conf = {
          fileName: path.join((answer || defaultPath), 'openveo-socket.log').replace(/\\/g, '/'),
          level: 'info',
          maxFileSize: 1048576,
          maxFiles: 2
        };

        fs.writeFile(confFile, JSON.stringify(conf, null, '\t'), {encoding: 'utf8'}, callback);
      });
    }
  });
}

// Launch installation
async.series([
  createConfDir,
  createConf,
  createLoggerConf
], function(error, results) {
  if (error)
    throw error;
  else {
    process.stdout.write('Installation complete');
    exit();
  }
});
