'use strict';

(function(app) {

  /**
   * Defines the manage controller
   */
  function ManageController($scope, $filter, $timeout, results, manageService) {
    var self = this;

    self.devices = results.devices;
    self.groups = results.groups;

    /**
     * Define an ui-state for a device
     *
     * @param target The target device or group
     * @param {String} uiState The ui-state to set for the device
     */
    function setUiState(target, uiState) {
      var element = (angular.element(target).scope().device) ?
        angular.element(target).scope().device : angular.element(target).scope().groups;

      if (!element['ui-state']) {
        element['ui-state'] = [];
      }
      element['ui-state'].push(uiState);
      $scope.$apply();
      console.log(element);
    }

    /**
     * Remove a ui-state for a device
     *
     * @param target The target device or group
     * @param {String} uiState The ui-state to remove for the device
     */
    function removeUiState(target, uiState) {
      var element = (angular.element(target).scope().device) ?
        angular.element(target).scope().device : angular.element(target).scope().groups;
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
        '-webkit-transition-duration': '1s',
        'transition-duration': '1s',
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
              self.groups = results.groups;
              self.devices = results.devices;
              $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.GROUP.ADD_SUCCESS'), 4000);
            });
          }, 500);
        }
      });
    }

    draggable();
    dragDropDevice();
  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = ['$scope', '$filter', '$timeout', 'results', 'manageService'];

})(angular.module('ov.manage'));
