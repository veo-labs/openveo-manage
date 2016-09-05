'use strict';

(function(app) {

  /**
   * Defines the device controller for displaying details
   */
  function DeviceController(
    $scope,
    $filter,
    $timeout,
    $location,
    $rootScope,
    manageService,
    entityService,
    manageName,
    deviceService) {

    var self = this;

    // Available state for device
    self.STATE_ACCEPTED = 'accepted';
    self.STATE_PENDING = 'pending';
    self.STATE_REFUSED = 'refused';

    self.lastDeviceSelected = null;

    /**
     * Define an ui-state for a device
     *
     * @param {Object} target The target device or group
     * @param {String} uiState The ui-state to set for the device
     */
    function setUiState(target, uiState) {
      var element = (angular.element(target).scope().$parent.device) ?
        angular.element(target).scope().$parent.device : angular.element(target).scope().group;

      if (!element['ui-state']) {
        element['ui-state'] = [];
      }
      element['ui-state'].push(uiState);
      $scope.$apply();
    }

    /**
     * Remove an ui-state for a device
     *
     * @param {Object} target The target device or group
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
     *
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
     *
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
     * @param {Object} target the dropzone element
     * @param {Object} relatedTarget target the dragged element to move
     */
    function mergePosition(target, relatedTarget) {
      var x = parseInt(target.getBoundingClientRect().left) -
          (relatedTarget.parentNode.getBoundingClientRect().left + 15),
        y = parseInt(target.getBoundingClientRect().top - relatedTarget.parentNode.getBoundingClientRect().top),
        element = angular.element(relatedTarget);

      if (target.classList.contains('group')) {
        x = parseInt(x + 41);
        y = parseInt(y - 66);
      }

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
     * @param {String} draggableId The id of the device to add to a group
     * @param {String} dropzoneId The id of the device or group
     * @param {Boolean} isGroup True if the dropzone is a group
     */
    function addDeviceToGroup(draggableId, dropzoneId, isGroup) {
      var group,
        firstDevice = manageService.getDevice(draggableId),
        secondDevice = (!isGroup) ? manageService.getDevice(dropzoneId) : null;

      // Create the group if it's two devices
      if (!isGroup) {

        entityService.addEntity('groups', manageName, {}).then(function(result) {
          group = result.data.entity;
          entityService.updateEntity('devices', manageName, draggableId, {group: group.id}).then(function() {

            // Update device scheduled jobs
            deviceService.toggleScheduledJobs(draggableId, null, 'createGroup');
          });
          entityService.updateEntity('devices', manageName, dropzoneId, {group: group.id}).then(function() {

            // Update device scheduled jobs
            deviceService.toggleScheduledJobs(dropzoneId, null, 'createGroup');
          });

          $rootScope.socket.emit('group.addDevice', {firstId: draggableId, secondId: dropzoneId, group: group});

          // Save to history
          manageService.addToHistory(draggableId, 'devices', 'ADD_DEVICE_TO_GROUP', firstDevice.history, group.name);
          manageService.addToHistory(dropzoneId, 'devices', 'ADD_DEVICE_TO_GROUP', secondDevice.history, group.name);

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.ADD_TO_GROUP_SUCCESS', '',
            {name: $filter('translate')(group.name)}), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_TO_GROUP_ERROR', '',
            {name: $filter('translate')(group.name)}), 4000);
        });
      } else {
        group = manageService.getGroup(dropzoneId);

        entityService.updateEntity('devices', manageName, draggableId, {group: dropzoneId}).then(function() {

          // Update device scheduled jobs
          deviceService.toggleScheduledJobs(draggableId, dropzoneId, 'addDeviceToGroup');

          $rootScope.socket.emit('group.addDevice', {firstId: draggableId, secondId: dropzoneId, group: null});

          // Save to history
          manageService.addToHistory(draggableId, 'devices', 'ADD_DEVICE_TO_GROUP', firstDevice.history, group.name);

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.ADD_TO_GROUP_SUCCESS', '',
            {name: $filter('translate')(group.name)}), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_TO_GROUP_ERROR', '',
            {name: $filter('translate')(group.name)}), 4000);
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
     * Initialize the scrollBars for device detail window
     */
    function initScrollbar() {
      var actionEl = document.querySelector('.device-detail .action-page'),
        detailEl = document.querySelector('.device-detail .detail-page'),
        historyEl = document.querySelector('.device-detail .history-page');

      actionEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      detailEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      historyEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');

      /* global Ps */
      Ps.initialize(actionEl);
      Ps.initialize(detailEl);
      Ps.initialize(historyEl);
    }

    /**
     * Display the device/group detail on tile click
     */
    function clickDevice() {

      // Avoid to fired the same event multiple times
      var events = interact('.device.accepted > .well, .device-group > .group')._iEvents;
      if (Object.keys(events).length && events.tap) {
        delete events.tap;
      }

      interact('.device.accepted > .well, .device-group > .group').on('tap', function(event) {
        if (event.double) {
          return;
        }

        var deviceId = event.currentTarget.getAttribute('data-id'),
          currentTarget = angular.element(event.currentTarget),
          selectedDevice;

        if (!$scope.manage.openedDevice) {

          // Set the selected device
          selectedDevice = deviceService.manageDeviceDetails(deviceId, currentTarget.hasClass('group'));
          manageService.manageSelectedDevice(deviceId, selectedDevice);
          self.lastDeviceSelected = deviceId;

          $scope.manage.openedDevice = deviceId;
          $scope.manage.showDetail = true;
          $scope.organizeLayout($scope.manage.showDetail);
        } else if ($scope.manage.openedDevice == deviceId) {
          selectedDevice = deviceService.manageDeviceDetails();
          manageService.manageSelectedDevice(deviceId, selectedDevice);
          self.lastDeviceSelected = null;

          $scope.manage.openedDevice = null;
          $scope.manage.showDetail = false;
          $scope.organizeLayout($scope.manage.showDetail);
        } else {
          $scope.manage.openedDevice = deviceId;
          $scope.manage.showDetail = false;

          // Add a latency to visualize the change of device detail
          $timeout(function() {
            selectedDevice = deviceService.manageDeviceDetails(deviceId, currentTarget.hasClass('group'));
            manageService.manageSelectedDevice(deviceId, selectedDevice, self.lastDeviceSelected);
            self.lastDeviceSelected = deviceId;

            $scope.manage.showDetail = true;
          }, 500);
        }

        initScrollbar();
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

        manageService.manageSelectedDevice(groupId);
        $scope.manage.showDetail = false;
        $location.path('manage/group-detail/' + groupId);
        $scope.manage.absUrl = $location.absUrl();
        $scope.$apply();
      });
    }

    /**
     * Add pending/refused device to the accepted list of devices
     *
     * @param {Object} device The device object
     * @param {String} state The old state of the device
     */
    self.addToAcceptedDevices = function(device, state) {
      var deviceToSave = {
        name: device.name,
        state: self.STATE_ACCEPTED
      };

      entityService.updateEntity('devices', manageName, device.id, deviceToSave).then(function() {

        // Ask for device detail
        $rootScope.socket.emit('settings', [device.id]);
        $rootScope.socket.emit('update.state', {device: device, state: state, newState: self.STATE_ACCEPTED});
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.ADD_ACCEPTED_SUCCESS'), 4000);
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_ACCEPTED_ERROR'), 4000);
      });
    };

    /**
     * Add the new device to the refused list of devices
     *
     * @param {Object} device The device object
     * @param {String} state The old state of the device
     */
    self.addToRefusedDevices = function(device, state) {
      var deviceToSave = {
        name: device.name,
        state: self.STATE_REFUSED
      };

      entityService.updateEntity('devices', manageName, device.id, deviceToSave).then(function() {
        $rootScope.socket.emit('update.state', {device: device, state: state, newState: self.STATE_REFUSED});
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.ADD_REFUSED_SUCCESS'), 4000);
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_REFUSED_ERROR'), 4000);
      });
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
    '$location',
    '$rootScope',
    'manageService',
    'entityService',
    'manageName',
    'deviceService'
  ];

})(angular.module('ov.manage'));
