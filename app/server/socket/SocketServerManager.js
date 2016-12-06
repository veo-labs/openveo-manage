'use strict';

var SocketServer = process.requireManage('app/server/socket/SocketServer.js');

/**
 * The socket server singleton.
 *
 * @property server
 * @type {SocketServer}
 */
var server = null;

/**
 * Manages a socket server singleton.
 *
 * @class SocketServerManager
 * @constructor
 */
function SocketServerManager() {}

module.exports = SocketServerManager;

/**
 * Gets socket server singleton.
 *
 * @method getServer
 * @return {SocketServer} The socket server
 */
SocketServerManager.getServer = function() {
  if (!server)
    server = new SocketServer();

  return server;
};
