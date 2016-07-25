'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function ManageController($scope, $window, $location, results, group, socketService, manageService) {
    var devicesIds = [];

    // Initialize data
    if (group) {
      $scope.group = group; // Information of the group on detail page
    }
    $scope.acceptedDevices = results.acceptedDevices;
    $scope.groups = results.groups;
    $scope.refusedDevices = results.refusedDevices;
    $scope.pendingDevices = results.pendingDevices;
    $scope.manage = {
      resize: 'normal', // Permits to resize the devices tiles (normal/medium/small)
      openedDevice: null, // Contain the id of the selected device
      showDetail: false, // Used to add a class to the selected device
      absUrl: $location.absUrl() // The URL of the current page
    };

    $scope.socket = socketService.getConnexion();
    $scope.devicesConnexion = []; // Store all the new pending connexions

    /**
     * Initialize all socket.io listeners
     */
    function initializeListeners() {

      // Hello listener
      $scope.socket.on('hello', function(device) {
        $scope.devicesConnexion.push(device);
        $scope.$apply();
      });

      // Storage listener
      $scope.socket.on('settings.storage', function(device) {
        manageService.updateDevice(device);
      });

      // Device details listener
      $scope.socket.on('device.details', function(data) {

      });
    }

    /**
     * Remove an ui-state from all devices
     * @param uiState
     */
    $scope.clearUiState = function(uiState) {
      var index;

      $scope.groups.map(function(group) {
        if (group['ui-state']) {
          index = group['ui-state'].indexOf(uiState);
          if (index > -1) {
            group['ui-state'].splice(index, 1);
          }
        }
      });
      $scope.acceptedDevices.map(function(device) {
        if (device['ui-state']) {
          index = device['ui-state'].indexOf(uiState);
          if (index > -1) {
            device['ui-state'].splice(index, 1);
          }
        }
      });
    };

    /**
     * Permits to organize the view when the details is opened/closed
     *
     * @param opening
     */
    $scope.organizeLayout = function(opening) {

      var screenWidth = $window.innerWidth,
        containerWidth = parseInt(document.getElementsByClassName('manage-container')[0].offsetWidth + 30),
        leftSpace = parseInt(screenWidth - containerWidth) / 2;

      if (opening && leftSpace <= 300) {
        if (containerWidth <= 750) {
          $scope.manage.resize = 'small';
        } else {
          $scope.manage.resize = 'medium';
        }
      } else {
        $scope.manage.resize = 'normal';
      }
    };

    /**
     * Go to the previous page
     */
    $scope.back = function() {
      $scope.manage.showDetail = false;
      $scope.manage.openedDevice = null;
      $scope.clearUiState('selected');
      $scope.organizeLayout(false);
      $window.history.back();
      $scope.manage.absUrl = $location.absUrl();
    };

    // Initialize socket.io listeners
    initializeListeners();

    // Asks for devices settings
    $scope.acceptedDevices.map(function(device) {
      devicesIds.push(device.id);
    });
    $scope.socket.emit('settings', devicesIds);

  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = [
    '$scope',
    '$window',
    '$location',
    'results',
    'group',
    'socketService',
    'manageService'
  ];

})(angular.module('ov.manage'));
