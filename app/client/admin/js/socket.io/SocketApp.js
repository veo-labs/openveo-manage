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
  function SocketService($location, $rootScope, manageService) {
    var socket = null;

    /**
     * Initialize socket.io connexion with server
     */
    function initConnexion() {
      if (!socket) {
        /* global io */
        socket = io.connect('http://' + $location.host() + ':3002/client');

        // Hello listener
        socket.on('hello', function(device) {
          manageService.addDeviceConnected.push(device);
          $rootScope.$apply();
        });

        // Device update listener
        socket.on('update', function(data) {
          manageService.updateDevice(data);
          $rootScope.$apply();
        });

        // Device remove listener
        socket.on('remove.device', function(data) {
          manageService.removeDevice(data.id);
          $rootScope.$apply();
        });

        // Device accept or refused listener after hello
        socket.on('update.state', function(data) {
          manageService.removeDeviceConnected(data.device.id);
          manageService.updateDeviceState(data.device, data.state, data.newState);
          $rootScope.$apply();
        });

        // Add device to group listener
        socket.on('group.addDevice', function(data) {
          manageService.addDevicesToGroup(data.firstId, data.secondId, data.group);
        });

        // Remove device from a group listener
        socket.on('group.removeDevice', function(data) {
          manageService.removeDeviceFromGroup(data.deviceId, data.groupId);
        });

        // Group delete listener
        socket.on('remove.group', function(data) {
          manageService.removeGroup(data.id);
        });
      }

      return socket;
    }

    return {
      initConnexion: initConnexion
    };

  }

  app.factory('socketService', SocketService);
  SocketService.$inject = ['$location', '$rootScope', 'manageService'];

})(angular);
