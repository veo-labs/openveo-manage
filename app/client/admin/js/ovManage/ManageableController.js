'use strict';

/* global interact, Ps */
(function(app) {

  /**
   * @module ov.manage
   */

  /**
   * Controls the view responsible of a list of manageables.
   *
   * @class ManageManageableController
   * @static
   */
  function ManageableController(
    $q,
    $scope,
    $rootScope,
    $filter,
    $timeout,
    $location,
    $element,
    ManageFactory,
    GroupFactory,
    DeviceFactory,
    entityService,
    MANAGE_NAME,
    MANAGE_DEVICE_STATES) {
    var self = this,
      actionEl = document.querySelector('.item-detail .action-page'),
      detailEl = document.querySelector('.item-detail .detail-page'),
      historyEl = document.querySelector('.item-detail .history-page');

    /**
     * Indicates if a drag & drop is on the move.
     *
     * @property currentlyDragging
     * @type Boolean
     */
    self.currentlyDragging = false;

    /**
     * Double clicks promise.
     *
     * @property doubleClickPromise
     * @type Promise
     */
    self.doubleClickPromise = null;

    /**
     * Defines an ui-state for a manageable.
     *
     * @method addUiState
     * @private
     * @param {HTMLElement} target The target manageable
     * @param {String} uiState The ui-state to set for the manageable
     */
    function addUiState(target, uiState) {
      var element = (angular.element(target).scope().$parent.device) ?
        angular.element(target).scope().$parent.device : angular.element(target).scope().group;

      if (!element['ui-state']) {
        element['ui-state'] = [];
      }
      element['ui-state'].push(uiState);
      $scope.$apply();
    }

    /**
     * Removes an ui-state for a manageable.
     *
     * @method removeUiState
     * @private
     * @param {HTMLElement} target The target manageable
     * @param {String} uiState The ui-state to remove for the manageable
     */
    function removeUiState(target, uiState) {
      var element = (angular.element(target).scope().device) ?
        angular.element(target).scope().device : angular.element(target).scope().group;
      var index = element['ui-state'].indexOf(uiState);

      element['ui-state'].splice(index, 1);
      $scope.$apply();
    }

    /**
     * Handles drag move event on manageables.
     *
     * @method dragMoveListener
     * @private
     * @param {Event} event The drag event
     */
    function dragMoveListener(event) {
      var element = angular.element(event.target),
        x = (parseFloat(element.attr('data-x')) || 0) + event.dx,
        y = (parseFloat(element.attr('data-y')) || 0) + event.dy;

      // Translate the element
      element.css({
        '-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)',
        transform: 'translate(' + x + 'px, ' + y + 'px)'
      });

      // Update the position attributes
      element.attr('data-x', x);
      element.attr('data-y', y);
    }

    /**
     * Resets the manageable element to its initial position.
     *
     * @method resetPosition
     * @private
     * @param {HTMLElement} target the element to reset
     */
    function resetPosition(target) {
      var element = angular.element(target);

      // Set transition duration for reset
      element.css({
        '-webkit-transition-duration': '.35s',
        'transition-duration': '.35s',
        '-webkit-transform': 'translate(0, 0)',
        transform: 'translate(0, 0)'
      });
      element.parent().css({
        'z-index': 2
      });

      // Update the position attributes
      element.attr('data-x', 0);
      element.attr('data-y', 0);
    }

    /**
     * Sets position of the target element to the dropzone element.
     *
     * @method mergePosition
     * @private
     * @param {HTMLElement} target the dropzone element
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
        '-webkit-transition-duration': '.5s',
        'transition-duration': '.5s',
        '-webkit-transform': 'translate(' + x + 'px, ' + y + 'px)',
        transform: 'translate(' + x + 'px, ' + y + 'px)'
      });

      removeUiState(target, 'can-drop');
    }

    /**
     * Sets items as draggable.
     *
     * @method draggable
     * @private
     */
    function draggable() {
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
          addUiState(event.target, 'drag');
          self.currentlyDragging = true;

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
     * Adds a device to a group.
     *
     * @method addDeviceToGroup
     * @private
     * @param {String} deviceId The id of the device to add to the group
     * @param {String} groupId The id of group
     * @return {Promise} Promise resolving when device is added
     */
    function addDeviceToGroup(deviceId, groupId) {
      var p = $q.defer();
      var device = DeviceFactory.getDevice(deviceId);
      var group = GroupFactory.getGroup(groupId);
      var isCollision = DeviceFactory.isGroupSchedulesCollision(device.id, group);

      if (isCollision) {
        $scope.$emit('setAlert',
                     'danger',
                     $filter('translate')('MANAGE.GROUP.ADD_DEVICE_SCHEDULES_COLLISION_ERROR', null, {
                       deviceName: $filter('translate')(device.name),
                       groupName: $filter('translate')(group.name)
                     })
        );
        p.reject();
      } else {
        ManageFactory.addDeviceToGroup(deviceId, groupId).then(function() {
          GroupFactory.addDeviceToGroup(device, groupId);
          p.resolve();
        }, function(error) {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.GROUP.ADD_DEVICE_ERROR', null, {
            code: error.code,
            name: $filter('translate')(group.name)
          }), 4000);
          p.reject(error);
        });
      }

      return p.promise;
    }

    /**
     * Sets drag drop zones.
     *
     * @method dragDropDevice
     * @private
     */
    function dragDropDevice() {
      interact('.dropzone').dropzone({

        // only accept elements matching this CSS selector
        accept: '.draggable',

        // Require a 25% element overlap for a drop to be possible
        overlap: 0.25,

        ondragenter: function(event) {
          addUiState(event.target, 'can-drop');
          addUiState(event.relatedTarget, 'drop-target');
        },
        ondragleave: function(event) {
          removeUiState(event.relatedTarget, 'drop-target');
          removeUiState(event.target, 'can-drop');
        },
        ondrop: function(event) {
          var relatedTarget = angular.element(event.relatedTarget),
            target = angular.element(event.target);

          mergePosition(event.target, event.relatedTarget);
          removeUiState(event.target, 'can-drop');
          removeUiState(event.relatedTarget, 'drop-target');

          $timeout(function() {

            if (!target.hasClass('group')) {

              // No group
              // Create it
              ManageFactory.createGroup().then(function(group) {
                GroupFactory.addGroup(group);

                // Add both devices (the dragged one and the target one)
                // to the new group
                addDeviceToGroup(relatedTarget.attr('data-id'), group.id);
                addDeviceToGroup(target.attr('data-id'), group.id);

              }, function(error) {
                $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.GROUP.CREATE_ERROR', null, {
                  code: error.code
                }), 4000);
                resetPosition(relatedTarget);
                resetPosition(target);
              });

            } else {

              // Add dragged device to the target group
              addDeviceToGroup(relatedTarget.attr('data-id'), target.attr('data-id')).catch(function() {
                resetPosition(relatedTarget);
              });

            }

            $scope.$apply();
          }, 350);
        }
      });
    }

    /**
     * Initializes the scrollBars for device detail window.
     *
     * @method initScrollbar
     * @private
     */
    function initScrollbar() {

      // Recreate elements to avoid errors
      actionEl = document.querySelector('.item-detail .action-page');
      detailEl = document.querySelector('.item-detail .detail-page');
      historyEl = document.querySelector('.item-detail .history-page');

      actionEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      detailEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      historyEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');

      Ps.initialize(actionEl);
      Ps.initialize(detailEl);
      Ps.initialize(historyEl);
    }

    /**
     * Updates the scrollbars on device detail change.
     *
     * @method updateScrollbar
     * @private
     */
    function updateScrollbar() {
      actionEl.scrollTop = 0;
      detailEl.scrollTop = 0;
      historyEl.scrollTop = 0;

      Ps.update(actionEl);
      Ps.update(detailEl);
      Ps.update(historyEl);
    }

    /**
     * Destroys scrollbars when device detail is closed.
     *
     * @method destroyScrollbar
     * @private
     */
    function destroyScrollbar() {
      Ps.destroy(actionEl);
      Ps.destroy(detailEl);
      Ps.destroy(historyEl);
    }

    /**
     * Toggles the detail panel corresponding to the given manageable.
     *
     * @method toggleDetails
     * @param {String} id The manageable id
     * @param {Boolean} isGroup true if the manageable is a group, false if it is a device
     * @private
     */
    function toggleDetails(id, isGroup) {
      if (!$scope.manage.openedItem) {

        // No manageable loaded in the detail panel yet

        // Set the selected manageable
        $rootScope.$broadcast('manageable.load', id, isGroup);

        $scope.manage.openedItem = id;
        $scope.manage.showDetail = true;
        $scope.organizeLayout($scope.manage.showDetail);

        initScrollbar();
      } else if ($scope.manage.openedItem == id) {

        // Manageable to load in the panel is the one already loaded
        // Close the panel
        $rootScope.$broadcast('manageable.closeDetails');

      } else {

        // Manageable to load in the details panel is a different manageable
        // Display new manageable details
        // And activate first tab

        $scope.manage.openedItem = id;
        $scope.manage.showDetail = false;
        $scope.setActivePage(0);

        $rootScope.$broadcast('manageable.load', id, isGroup);
        $scope.manage.showDetail = true;
        updateScrollbar();
      }
    }

    /**
     * Opens the detail view corresponding to the given group.
     *
     * @method openGroup
     * @param {String} id The group id
     * @private
     */
    function openGroup(id) {
      $rootScope.$broadcast('manageable.closeDetails');
      $scope.manage.showDetail = false;
      $location.path('manage/group-detail/' + id);
      $scope.manage.absUrl = $location.absUrl();
      destroyScrollbar();
    }

    /**
     * Handles clicks and double clicks on manageable items to toggle details or open groups.
     *
     * @method handleManageableClick
     * @param {Event} The click event
     */
    self.handleManageableClick = function(event) {
      var manageableId = event.currentTarget.getAttribute('data-id');
      var isGroup = angular.element(event.currentTarget).hasClass('group');

      if (self.doubleClickPromise) {
        $timeout.cancel(self.doubleClickPromise);
        self.doubleClickPromise = null;

        // Double click

        // Only for groups
        if (isGroup && manageableId)
          openGroup(manageableId);

        return;
      }

      self.doubleClickPromise = $timeout(function() {

        // Single click
        self.doubleClickPromise = null;
        toggleDetails(manageableId, isGroup);

      }, 200);
    };

    /**
     * Adds pending/refused device to the accepted list of devices.
     *
     * @method addToAcceptedDevices
     * @param {Object} device The device to accept
     * @param {String} device.id The device's id
     */
    self.addToAcceptedDevices = function(device) {
      ManageFactory.updateDeviceState(device.id, MANAGE_DEVICE_STATES.ACCEPTED).then(function() {
        ManageFactory.askForDevicesSettings([device.id]);
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_ACCEPTED_ERROR', null, {
          code: error.code
        }), 4000);
      });
    };

    /**
     * Adds the new device to the refused list of devices.
     *
     * @method addToRefusedDevices
     * @param {Object} device The device object
     * @param {String} device.id The device's id
     */
    self.addToRefusedDevices = function(device) {
      ManageFactory.updateDeviceState(device.id, MANAGE_DEVICE_STATES.REFUSED).catch(function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.ADD_REFUSED_ERROR', null, {
          code: error.code
        }), 4000);
      });
    };

    // Manage drag and drop events
    if ($element.hasClass('devices')) {
      draggable();
      dragDropDevice();
    }

  }

  app.controller('ManageManageableController', ManageableController);
  ManageableController.$inject = [
    '$q',
    '$scope',
    '$rootScope',
    '$filter',
    '$timeout',
    '$location',
    '$element',
    'ManageFactory',
    'ManageGroupFactory',
    'ManageDeviceFactory',
    'entityService',
    'MANAGE_NAME',
    'MANAGE_DEVICE_STATES'
  ];

})(angular.module('ov.manage'));
