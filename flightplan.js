'use strict';

/* eslint node/no-unpublished-require: 0 */

/**
 * Flightplan plans.
 *
 * Requirements to executes flightplan:
 * - node
 * - npm
 * - flightplan cli(npm install -g flightplan)
 *
 * unit task:
 * Execute OpenVeo Manage unit tests.
 *
 * unit environment variables:
 * - TRAVIS_BRANCH: The name of the openveo-manage branch to test (default: develop)
 * - OPENVEO_CORE_BRANCH: The name of the openveo-core branch to test on (default: develop)
 * - OPENVEO_API_BRANCH: The name of the openveo-api branch to test with (default: develop)
 * - OPENVEO_TEST_BRANCH: The name of the openveo-test branch to test with (default: develop)
 * - OPENVEO_REST_NODEJS_CLIENT_BRANCH: The name of the openveo-rest-nodejs-client branch to test
 *   with (default: develop)
 * - OPENVEO_DEVICES_API_BRANCH: The name of the openveo-devices-api branch to test with (default: develop)
 *
 * unit options:
 * - skipInstall: Skip installation, execute tests directly
 *
 * unit usage:
 * - fly unit:local
 * - fly unit:local --skipInstall
 */

var path = require('path');
var plan = require('flightplan');
var openVeoApi = require('@openveo/api');

var workingDirectory = path.normalize('build/working');
var projectDirectory = path.join(workingDirectory, 'node_modules/@openveo/manage');
var homeDirectory = openVeoApi.fileSystem.getConfDir();
var manageBranch = process.env.TRAVIS_BRANCH || 'develop';
var coreBranch = process.env.OPENVEO_CORE_BRANCH || 'develop';
var apiBranch = process.env.OPENVEO_API_BRANCH || 'develop';
var testBranch = process.env.OPENVEO_TEST_BRANCH || 'develop';
var restNodejsClientBranch = process.env.OPENVEO_REST_NODEJS_CLIENT_BRANCH || 'develop';
var devicesApiBranch = process.env.OPENVEO_DEVICES_API_BRANCH || 'develop';

// Add a local target
plan.target('local');

// Create working directory where plans will be executed
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  // Remove working directory if it exists
  local.rm('-Rf ' + workingDirectory);

  // The -p option does not work on Node.js command prompt
  // If it fails use mkdir command without options
  if (local.exec('mkdir -p ' + workingDirectory, {failsafe: true}).code === 1)
    local.mkdir(workingDirectory);
});

// Install OpenVeo Core
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-core');

  try {

    // Checkout project specific branch or tag into working directory
    local.exec('git clone --branch=' +
               coreBranch +
               ' --single-branch https://github.com/veo-labs/openveo-core.git ' +
               workingDirectory);

    // Create openveo configuration directory
    var coreConfigurationDirectory = path.join(homeDirectory, 'core');

    if (local.exec('test -e ' + coreConfigurationDirectory, {failsafe: true}).code === 1) {
      if (local.exec('mkdir -p ' + coreConfigurationDirectory, {failsafe: true}).code === 1)
        local.mkdir(coreConfigurationDirectory);
    }

    // Copy configuration files if not always present
    var configurationFiles = ['conf.json', 'databaseTestConf.json', 'loggerTestConf.json', 'serverTestConf.json'];

    configurationFiles.forEach(function(configurationFile) {
      var destinationPath = path.join(coreConfigurationDirectory, configurationFile);
      if (local.exec('test -e ' + destinationPath, {failsafe: true}).code === 1)
        local.cp(path.normalize('tests/conf/core/' + configurationFile) + ' ' + destinationPath);
    });

    // Install openveo-core dependencies and compile sources
    local.with('cd ' + workingDirectory, function() {
      local.exec('npm install --ignore-scripts');
      local.exec('grunt prod');
    });

    local.log('openveo-core successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Install OpenVeo Manage
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-manage');

  try {

    // Checkout project
    local.exec('git clone --branch=' +
               manageBranch +
               ' --single-branch https://github.com/veo-labs/openveo-manage.git ' +
               projectDirectory);

    // Install openveo-manage dependencies and compile sources
    local.with('cd ' + projectDirectory, function() {
      local.exec('npm install --ignore-scripts');
      local.exec('grunt prod');
    });

    local.log('openveo-manage successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Install OpenVeo API
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-api');

  try {

    var apiDirectory = path.join(workingDirectory, 'node_modules/@openveo/api');

    // Remove api directory if it exists
    local.rm('-Rf ' + apiDirectory);

    // Checkout project
    local.exec('git clone --branch=' +
               apiBranch +
               ' --single-branch https://github.com/veo-labs/openveo-api.git ' +
               apiDirectory);

    // Install openveo-api dependencies
    local.with('cd ' + apiDirectory, function() {
      local.exec('npm install');
    });

    // Remove @openveo dependencies if any
    local.rm('-Rf ' + path.join(apiDirectory, 'node_modules/@openveo'));

    local.log('openveo-api successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Install OpenVeo test
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-test');

  try {

    var testDirectory = path.join(workingDirectory, 'node_modules/@openveo/test');

    // Remove test directory if it exists
    local.rm('-Rf ' + testDirectory);

    // Checkout project
    local.exec('git clone --branch=' +
               testBranch +
               ' --single-branch https://github.com/veo-labs/openveo-test.git ' +
               testDirectory);

    // Install openveo-test dependencies
    local.with('cd ' + testDirectory, function() {
      local.exec('npm install');
    });

    // Remove @openveo dependencies if any
    local.rm('-Rf ' + path.join(testDirectory, 'node_modules/@openveo'));

    local.log('openveo-test successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Install OpenVeo REST Nodejs client
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-rest-nodejs-client');

  try {

    var restNodejsClientDirectory = path.join(workingDirectory, 'node_modules/@openveo/rest-nodejs-client');

    // Remove REST nodejs client directory if it exists
    local.rm('-Rf ' + restNodejsClientDirectory);

    // Checkout project
    local.exec('git clone --branch=' +
               restNodejsClientBranch +
               ' --single-branch https://github.com/veo-labs/openveo-rest-nodejs-client.git ' +
               restNodejsClientDirectory);

    // Install openveo-rest-nodejs-client dependencies
    local.with('cd ' + restNodejsClientDirectory, function() {
      local.exec('npm install');
    });

    // Remove @openveo dependencies if any
    local.rm('-Rf ' + path.join(restNodejsClientDirectory, 'node_modules/@openveo'));

    local.log('openveo-rest-nodejs-client successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Install OpenVeo Devices API client
plan.local(['unit'], function(local) {
  if (plan.runtime.options.skipInstall)
    return;

  local.log('Start installing openveo-devices-api');

  try {

    var devicesApiDirectory = path.join(workingDirectory, 'node_modules/@openveo/devices-api');

    // Remove REST nodejs client directory if it exists
    local.rm('-Rf ' + devicesApiDirectory);

    // Checkout project
    local.exec('git clone --branch=' +
               devicesApiBranch +
               ' --single-branch https://github.com/veo-labs/openveo-devices-api ' +
               devicesApiDirectory);

    // Install openveo-devices-api dependencies
    local.with('cd ' + devicesApiDirectory, function() {
      local.exec('npm install');
    });

    // Remove @openveo dependencies if any
    local.rm('-Rf ' + path.join(devicesApiDirectory, 'node_modules/@openveo'));

    local.log('openveo-devices-api successfully installed');
  } catch (e) {
    plan.abort(e.message);
  }
});

// Execute OpenVeo Manage unit tests
plan.local(['unit'], function(local) {
  try {
    local.with('cd ' + projectDirectory, function() {
      local.exec('grunt mochaTest');
    });
  } catch (e) {
    plan.abort(e.message);
  }
});
