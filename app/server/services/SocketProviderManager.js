'use strict';

var path = require('path');
var openVeoAPI = require('@openveo/api');
var configDir = openVeoAPI.fileSystem.getConfDir();
var SocketProvider = process.requireManage('app/server/services/SocketProvider.js');
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;

/**
 * The stored socketProviders
 *
 * @property socketProviders
 * @type {Array}
 */
var socketProviders = [];

/**
 * Manage socket.io connexions
 *
 * @class SocketProviderManager
 * @constructor
 */
function SocketProviderManager() {
}

module.exports = SocketProviderManager;

/**
 * Permits to load a SocketProvider and connect it
 *
 * @method load
 */
SocketProviderManager.load = function() {
  var socketProvider = new SocketProvider(namespace);

  socketProvider.connect(function() {
    socketProviders.push(socketProvider);
  });
};

/**
 * Get all SocketProviders
 *
 * @method getAllSocketProviders
 * @returns {Array} An array of socketProviders
 */
SocketProviderManager.getAllSocketProviders = function() {
  return socketProviders;
};

/**
 * Retrieve a socketProvider with the device namespace
 *
 * @method gtSocketProviderByNamespace
 * @param {String} namespace The device namespace
 * @returns {SocketProvider}
 */
SocketProviderManager.getSocketProviderByNamespace = function(namespace) {
  return socketProviders.find(function(socketProvider) {
    return socketProvider.ioDevice.name == namespace;
  });
};

/**
 * Retrieve the devices for a SocketProvider
 *
 * @param namespace
 * @returns {Array} An array of connected devices
 */
SocketProviderManager.getDevicesFromSocketManagerByNamespace = function(namespace) {
  var socketProvider = this.getSocketProviderByNamespace(namespace);

  return socketProvider.getDevices();
};
