'use strict';

(function(app) {

  /**
   * Defines the device controller for displaying details
   */
  function DeviceController($scope, $filter, $timeout, manageService, socketService, entityService, manageName) {
    var self = this,
      openedDevice = null,
      socket,
      activePage = 0;

    // Available state for device
    self.STATE_ACCEPTED = 'accepted';
    self.STATE_PENDING = 'pending';
    self.STATE_REFUSED = 'refused';

    $scope.devicesConnexion = [];

    // Get socket and define hello listener
    socket = socketService.getConnexion();
    socket.on('hello', function(data) {
      $scope.devicesConnexion.push(data);
      $scope.$apply();
    });

    /**
     * Define an ui-state for a device
     *
     * @param target The target device or group
     * @param {String} uiState The ui-state to set for the device
     */
    function setUiState(target, uiState) {
      var element = (angular.element(target).scope().device) ?
        angular.element(target).scope().device : angular.element(target).scope().group;

      if (!element['ui-state']) {
        element['ui-state'] = [];
      }
      element['ui-state'].push(uiState);
      $scope.$apply();
    }

    /**
     * Remove an ui-state for a device
     *
     * @param target The target device or group
     * @param {String} uiState The ui-state to remove for the device
     */
    function removeUiState(target, uiState) {
      var element = (angular.element(target).scope().device) ?
        angular.element(target).scope().device : angular.element(target).scope().group;
      var index = element['ui-state'].indexOf(uiState);

      element['ui-state'].splice(index, 1);
      $scope.$apply();
    }

    /**
     * Remove an ui-state from all devices
     * @param uiState
     */
    function clearUiState(uiState) {
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
    }


    /**
     * Move element on drag
     * @param {Object} event the user Event related to the dragEvent
     */
    function dragMoveListener(event) {
      var element = angular.element(event.target),
        x = (parseFloat(element.attr('data-x')) || 0) + event.dx,
        y = (parseFloat(element.attr('data-y')) || 0) + event.dy;

      // translate the element
      element.css({
        '-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)',
        transform: 'translate(' + x + 'px, ' + y + 'px)'
      });

      // update the position attributes
      element.attr('data-x', x);
      element.attr('data-y', y);
    }

    /**
     * Reset the device element to its initial position
     * @param {Object} target the element to reset position
     */
    function resetPosition(target) {
      var element = angular.element(target);

      // Set transition duration for reset
      element.css({
        '-webkit-transition-duration': '.5s',
        'transition-duration': '.5s',
        '-webkit-transform': 'translate(0, 0)',
        transform: 'translate(0, 0)'
      });
      element.parent().css({
        'z-index': 2
      });

      // update the position attributes
      element.attr('data-x', 0);
      element.attr('data-y', 0);
    }

    /**
     * Set position of the target element to the dropzone element
     *
     * @param target
     * @param relatedTarget
     */
    function mergePosition(target, relatedTarget) {
      var x = parseInt(target.getBoundingClientRect().left) -
          (relatedTarget.parentNode.getBoundingClientRect().left + 15),
        y = parseInt(target.getBoundingClientRect().top - relatedTarget.parentNode.getBoundingClientRect().top),
        element = angular.element(relatedTarget);

      element.css({
        '-webkit-transition-duration': '.75s',
        'transition-duration': '.75s',
        '-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)',
        transform: 'translate(' + x + 'px, ' + y + 'px)'
      });

      removeUiState(target, 'can-drop');
    }

    /**
     * Manage the dragging event
     */
    function draggable() {
      /* global interact */
      interact('.draggable').draggable({
        inertia: false,

        // Define the restricted area
        restrict: {
          restriction: '#page-content-wrapper',
          endOnly: true
        },
        autoScroll: true,

        onstart: function(event) {
          var element = angular.element(event.target);

          setUiState(event.target, 'drag');

          // Set transition duration for reset
          element.css({
            '-webkit-transition-duration': '0s',
            'transition-duration': '0s'
          });
          element.parent().css({
            'z-index': 1
          });
        },

        onmove: dragMoveListener,

        onend: function(event) {
          var target = event.target;

          if (!angular.element(target).hasClass('drop-target')) {
            removeUiState(target, 'drag');
            resetPosition(target);
          }
        }
      });
    }

    /**
     * Allow to drop element in dropzones
     */
    function dragDropDevice() {
      interact('.dropzone').dropzone({

        // only accept elements matching this CSS selector
        accept: '.draggable',

        // Require a 25% element overlap for a drop to be possible
        overlap: 0.25,

        ondragenter: function(event) {
          setUiState(event.target, 'can-drop');
          setUiState(event.relatedTarget, 'drop-target');
        },
        ondragleave: function(event) {
          removeUiState(event.relatedTarget, 'drop-target');
          removeUiState(event.target, 'can-drop');
        },
        ondrop: function(event) {
          mergePosition(event.target, event.relatedTarget);
          $timeout(function() {
            manageService.groupDevices(angular.element(event.relatedTarget).attr('data-id'),
              angular.element(event.target).attr('data-id')).then(function(results) {
              $scope.groups = results.groups;
              $scope.acceptedDevices = results.acceptedDevices;
              $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.GROUP.ADD_SUCCESS'), 4000);
            });
          }, 500);
        }
      });
    }

    /**
     * Permits to organize the view when the details is opened/closed
     *
     * @param opening
     */
    function organizeLayout(opening) {

      var screenWidth = $window.innerWidth,
        containerWidth = parseInt(document.getElementsByClassName('manage-container')[0].offsetWidth + 30),
        leftSpace = parseInt(screenWidth - containerWidth) / 2;

      if (opening && leftSpace <= 300) {
        if (containerWidth <= 750) {
          self.resize = 'small';
        } else {
          self.resize = 'medium';
        }
      } else {
        self.resize = 'normal';
      }
    }

    /**
     * Display the device/group detail on tile click
     */
    function clickDevice() {

      // Avoid to fired the same event multiple times
      var events = interact('.device > .well, .device-group > .well')._iEvents;
      if (Object.keys(events).length && events.tap) {
        delete events.tap;
      }

      interact('.devices .device > .well, .devices .device-group > .well').on('tap', function(event) {
        if (event.double) {
          return;
        }

        var deviceId = event.currentTarget.getAttribute('data-id');

        if (!openedDevice) {
          openedDevice = deviceId;
          $scope.deviceSelected = true;
          setUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
          // deviceService.getDetails(deviceId);
        } else if (openedDevice == deviceId) {
          openedDevice = null;
          $scope.deviceSelected = false;
          removeUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
        } else {
          openedDevice = deviceId;

          // removeUiState(deviceService.getTarget(), 'selected');
          clearUiState('selected');
          setUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
          // deviceService.getDetails(deviceId);
        }

        organizeLayout($scope.deviceSelected);
        $scope.$apply();
      });
    }

    /**
     * Go to the group detail page on double click
     */
    function dbClickGroupDevices() {

      // Avoid to fired the same event multiple times
      var events = interact('.device-group > .well')._iEvents;
      if (Object.keys(events).length && events.doubletap) {
        delete events.doubletap;
      }

      interact('.device-group > .well').on('doubletap', function(event) {
        $scope.deviceSelected = false;
        clearUiState('selected');
        $location.path('manage/group-detail/' + event.currentTarget.getAttribute('data-id'));
        $scope.$apply();
      });
    }

    /**
     * Add pending/refused device to the accepted list of devices
     *
     * @param device
     * @param state
     */
    self.addToAcceptedDevices = function(device, state) {
      var deviceToSave = {state: self.STATE_ACCEPTED};

      entityService.updateEntity('devices', manageName, device.id, deviceToSave).then(function() {
        
        // Ask for device detail
        socket.emit('device-detail', device.id);
        manageService.updateDevicesList(device, state, true).then(function() {
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        });
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
      });
    };

    /**
     * Add the new device to the refused list of devices
     *
     * @param device
     * @param state
     */
    self.addToRefusedDevices = function(device, state) {
      device.state = self.STATE_REFUSED;

      entityService.updateEntity('devices', manageName, device.id, device).then(function() {
        manageService.updateDevicesList(device, state, false).then(function() {
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        });
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
      });
    };

    /**
     * Define the active page index
     *
     * @param index
     */
    self.setActivePage = function(index) {
      activePage = index;
    };

    /**
     * Determine if the passed index is the active page index
     *
     * @param index
     * @returns {boolean}
     */
    self.isActivePage = function(index) {
      return activePage === index;
    };

    // Manage drag and drop events
    draggable();
    dragDropDevice();

    // Manage click events
    clickDevice();
    dbClickGroupDevices();

  }

  app.controller('DeviceController', DeviceController);
  DeviceController.$inject = [
    '$scope',
    '$filter',
    '$timeout',
    'manageService',
    'socketService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
