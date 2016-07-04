'use strict';

/**
 * Manage the socket.io connexion between client/server
 *
 * @module ov.socketIO
 * @main ov.socketIO
 */
(function(angular) {

  var app = angular.module('ov.socketIO', []);

  /**
   * Defines a socket service.
   *
   * @module ov.socketIO
   * @class SocketService
   */
  function SocketService($location) {
    var socket = null;

    /**
     * Initialize socket.io connexion with server
     */
    function getConnexion() {
      if (!socket) {
        /* global io */
        socket = io.connect('http://' + $location.host() + ':3002/client');
      }

      return socket;
    }

    return {
      getConnexion: getConnexion
    };

  }

  app.factory('socketService', SocketService);
  SocketService.$inject = ['$location'];

})(angular);
