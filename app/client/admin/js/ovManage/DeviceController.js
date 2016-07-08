'use strict';

(function(app) {

  /**
   * Defines the device controller for displaying details
   */
  function DeviceController(
    $scope,
    $filter,
    $timeout,
    $window,
    $location,
    manageService,
    entityService,
    manageName) {

    var self = this,
      openedDevice = null,
      activePage = 0;

    // Available state for device
    self.STATE_ACCEPTED = 'accepted';
    self.STATE_PENDING = 'pending';
    self.STATE_REFUSED = 'refused';

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
     * Add devices to a group, group is created if does not exist
     *
     * @param draggableId
     * @param dropzoneId
     * @param isGroup
     */
    function addDeviceToGroup(draggableId, dropzoneId, isGroup) {

      // Create the group if it's two devices
      if (!isGroup) {
        var group;

        entityService.addEntity('groups', manageName, {}).then(function(result) {
          group = result.data.entity;
          entityService.updateEntity('devices', manageName, draggableId, {group: group.id}).then(function() {});
          entityService.updateEntity('devices', manageName, dropzoneId, {group: group.id}).then(function() {});
          manageService.addDevicesToGroup(draggableId, dropzoneId, group).then(function() {});

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
        });
      } else {
        entityService.updateEntity('devices', manageName, draggableId, {group: dropzoneId}).then(function() {
          manageService.addDevicesToGroup(draggableId, dropzoneId).then(function() {});

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
        });
      }
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
          var relatedTarget = angular.element(event.relatedTarget),
            target = angular.element(event.target);

          mergePosition(event.target, event.relatedTarget);
          $timeout(function() {
            addDeviceToGroup(relatedTarget.attr('data-id'),
              target.attr('data-id'), target.hasClass('group'));
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
          $scope.manage.resize = 'small';
        } else {
          $scope.manage.resize = 'medium';
        }
      } else {
        $scope.manage.resize = 'normal';
      }
    }

    /**
     * Display the device/group detail on tile click
     */
    function clickDevice() {

      // Avoid to fired the same event multiple times
      var events = interact('.device > .well, .device-group > .group')._iEvents;
      if (Object.keys(events).length && events.tap) {
        delete events.tap;
      }

      interact('.device > .well, .device-group > .group').on('tap', function(event) {
        if (event.double) {
          return;
        }

        var deviceId = event.currentTarget.getAttribute('data-id');

        if (!openedDevice) {
          openedDevice = deviceId;
          $scope.manage.deviceSelected = true;
          setUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
          // deviceService.getDetails(deviceId);
        } else if (openedDevice == deviceId) {
          openedDevice = null;
          $scope.manage.deviceSelected = false;
          removeUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
        } else {
          openedDevice = deviceId;

          // removeUiState(deviceService.getTarget(), 'selected');
          $scope.clearUiState('selected');
          setUiState(event.currentTarget, 'selected');

          // deviceService.setTarget(event.currentTarget);
          // deviceService.getDetails(deviceId);
        }

        organizeLayout($scope.manage.deviceSelected);
        $scope.$apply();
      });
    }

    /**
     * Go to the group detail page on double click
     */
    function dbClickGroupDevices() {

      // Avoid to fired the same event multiple times
      var events = interact('.device-group > .group')._iEvents;
      if (Object.keys(events).length && events.doubletap) {
        delete events.doubletap;
      }

      interact('.device-group > .group').on('doubletap', function(event) {
        var groupId = event.currentTarget.getAttribute('data-id');

        $scope.manage.deviceSelected = false;
        $scope.clearUiState('selected');
        $location.path('manage/group-detail/' + groupId);
        $scope.manage.absUrl = $location.absUrl();
        $scope.$apply();
      });
    }

    /**
     * Remove a device from the device connexion object on user response
     *
     * @param {int} id The device id to remove
     */
    function removeDeviceConnected(id) {
      for (var i = 0; i < $scope.devicesConnexion.length; i++) {
        if ($scope.devicesConnexion[i].id == id) {
          $scope.devicesConnexion.splice(i, 1);
          break;
        }
      }
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
        $scope.socket.emit('device-detail', device.id);
        removeDeviceConnected(device.id);
        manageService.updateDeviceState(device, state, self.STATE_ACCEPTED).then(function() {
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
      var deviceToSave = {state: self.STATE_REFUSED};

      entityService.updateEntity('devices', manageName, device.id, deviceToSave).then(function() {
        removeDeviceConnected(device.id);
        manageService.updateDeviceState(device, state, self.STATE_REFUSED).then(function() {
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
    '$window',
    '$location',
    'manageService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
