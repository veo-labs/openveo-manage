'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function ManageController($scope, $filter, $timeout, $window, $location, results, manageService) {
    var self = this,
      openedDevice = null;

    $scope.deviceSelected = false;
    $scope.absUrl = $location.absUrl();
    $scope.groups = results.groups;
    $scope.acceptedDevices = results.acceptedDevices;
    $scope.refusedDevices = results.refusedDevices;
    $scope.pendingDevices = results.pendingDevices;

    self.resize = 'normal';

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
     * Add a refused device to the accepted device
     * @param device
     */
    self.addToAcceptedDevice = function(device) {
      manageService.acceptDevice(device).then(function(results) {
        $scope.acceptedDevices = results.acceptedDevices;
        $scope.refusedDevices = results.refusedDevices;
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.REFUSED.REMOVE_SUCCESS'), 4000);
      });
    };

    /**
     * Go to the previous page
     */
    self.back = function() {
      $scope.deviceSelected = false;
      clearUiState('selected');
      $window.history.back();
    };

    // Manage drag and drop events
    draggable();
    dragDropDevice();

    // Manage click events
    clickDevice();
    dbClickGroupDevices();
  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = [
    '$scope',
    '$filter',
    '$timeout',
    '$window',
    '$location',
    'results',
    'manageService'
  ];

})(angular.module('ov.manage'));
