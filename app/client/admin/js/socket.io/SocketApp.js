'use strict';

/**
 * Defines the ov.manage.socketIO module to build a socket.io client.
 *
 * @module ov.manage.socketIO
 * @main ov.manage.socketIO
 */
/* global io */
(function(angular) {

  var app = angular.module('ov.manage.socketIO', []);

  /**
   * Defines a ManageSocketService holding a socket.io client singleton.
   *
   * @module ov.manage.socketIO
   * @class ManageSocketService
   */
  function SocketService($location) {
    var socket = null;

    /**
     * Initializes a socket.io connection with the server if not already initialized.
     *
     * @method initSocket
     * @param {String} namespace socket.io namespace name to connect to
     * @param {Number} port socket.io server port to connect to
     * @return {Client} The socket.io client
     */
    function initSocket(namespace, port) {
      if (!socket)
        socket = io.connect($location.protocol() + '://' + $location.host() + ':' + port + namespace);

      return socket;
    }

    return {
      initSocket: initSocket
    };

  }

  app.factory('ManageSocketService', SocketService);
  SocketService.$inject = ['$location'];

})(angular);
