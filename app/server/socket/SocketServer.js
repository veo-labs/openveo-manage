'use strict';

var socket = require('socket.io');
var SocketNamespace = process.requireManage('app/server/socket/SocketNamespace.js');

/**
 * Creates a socket.io server.
 *
 * @class SocketServer
 * @constructor
 */
function SocketServer() {

  /**
   * The Socket.io server.
   *
   * @property io
   * @type {Server}
   */
  this.io = null;

  /**
   * The namespaces added to the server.
   *
   * @property namespaces
   * @type {Object}
   */
  this.namespaces = {};

}

module.exports = SocketServer;

/**
 * Starts the server.
 *
 * @method listen
 * @async
 * @param {Number} port The port to use for the server
 */
SocketServer.prototype.listen = function(port) {
  if (!this.io)
    this.io = socket(port);
};

/**
 * Adds a namespace to the server.
 *
 * @method addNamespace
 * @param {SocketNamespace} namespace The socket namespace to add
 * @param {String} name The namespace name
 */
SocketServer.prototype.addNamespace = function(namespace, name) {
  if ((namespace instanceof SocketNamespace) && name && this.io) {

    // Connect namespace to server
    namespace.connect(this.io, name);
    this.namespaces[name] = namespace;

  }
};

/**
 * Gets a namespace.
 *
 * @method getNamespace
 * @param {String} name The namespace name to retrieve
 * @return {SocketNamespace} The namespace
 */
SocketServer.prototype.getNamespace = function(name) {
  return this.namespaces[name];
};
