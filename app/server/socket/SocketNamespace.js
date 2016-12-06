'use strict';

var util = require('util');
var events = require('events');

/**
 * Creates a new SocketNamespace to be added to a SocketServer.
 *
 * @example
 *
 *     // Example for implementing a new SocketNamespace named "CustomSocketNamespace"
 *
 *     // CustomSocketNamespace.js
 *
 *      function CustomSocketNamespace() {
 *        CustomSocketNamespace.super_.call(this);
 *      }
 *
 *      // CustomSocketNamespace must extend SocketNamespace
 *      util.inherits(CustomSocketNamespace, SocketNamespace);
 *      module.exports = CustomSocketNamespace;
 *
 *      CustomSocketNamespace.prototype.connect = function(socketServer, name) {
 *        CustomSocketNamespace.super_.prototype.connect.call(this, socketServer, name);
 *      };
 *
 * @class SocketNamespace
 * @constructor
 */
function SocketNamespace() {

  /**
   * The socket namespace.
   *
   * @property namespace
   * @type Namespace
   */
  this.namespace = null;

}

module.exports = SocketNamespace;
util.inherits(SocketNamespace, events.EventEmitter);

/**
 * Connects the namespace to the socket server.
 *
 * @method connect
 * @param {SocketServer} socketServer The socket server to connect to
 * @param {String} name The name to use to mount the namespace on the socket server
 */
SocketNamespace.prototype.connect = function(socketServer, name) {
  if (socketServer && name)
    this.namespace = socketServer.of(name);
};
