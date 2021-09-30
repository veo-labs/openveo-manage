'use strict';

/**
 * Defines components responsible of the manage plugin back end pages.
 *
 * It creates two back end pages. One to display the list of devices and groups, the other
 * one to display the list of devices inside a group.
 *
 * @module ov.manage
 */
(function(angular) {

  var app = angular.module('ov.manage', [
    'ov.i18n',
    'ov.entity',
    'ov.socket'
  ]);

  app.run(['$rootScope', function($rootScope) {
    $rootScope.$on('$locationChangeStart', function(event, next, current) {

      // Specific for manage plugin
      if (current.lastIndexOf('manage') >= 0) {

        // url slug : shortening the url to stuff that follows after "#"
        current = current.slice(current.lastIndexOf('/be/') + 4, current.length);
        next = next.slice(next.lastIndexOf('/be/') + 4, next.length);
        if (current == 'manage' && next.lastIndexOf('manage/group-detail/') >= 0) {
          $rootScope.newAnimation = 'RL';
        } else if (current.lastIndexOf('manage/group-detail/') >= 0 && next == 'manage') {
          $rootScope.newAnimation = 'LR';
        } else {
          $rootScope.newAnimation = '';
        }
      }
    });
  }]);

  // Configures the ov.manage application by adding new routes.
  app.config(['$routeProvider', function($routeProvider) {

    // Same resolve for all routes
    var mainControllerResolve = {
      manageDevices: ['ManageDeviceFactory', function(DeviceFactory) {
        return DeviceFactory.getDevices();
      }],
      manageGroups: ['ManageGroupFactory', function(GroupFactory) {
        return GroupFactory.getGroups();
      }]
    };

    // Register the main route
    $routeProvider.when('/manage', {
      templateUrl: '/manage/be/views/manage.html',
      controller: 'ManageMainController',
      controllerAs: 'vm',
      title: 'MANAGE.PAGE_TITLE',
      access: 'manage-access-page',
      resolve: mainControllerResolve
    });

    // Register the group route
    $routeProvider.when('/manage/group-detail/:id', {
      templateUrl: '/manage/be/views/group-detail.html',
      controller: 'ManageMainController',
      controllerAs: 'vm',
      title: 'MANAGE.GROUP_DETAIL.PAGE_TITLE',
      access: 'manage-group-detail-access-page',
      resolve: mainControllerResolve
    });

  }]);

  // Plugin name
  app.constant('MANAGE_NAME', 'manage');

  // List of states available for a device
  app.constant('MANAGE_DEVICE_STATES', {
    ACCEPTED: 'accepted',
    PENDING: 'pending',
    REFUSED: 'refused',
    INCOMING: 'incoming'
  });

  // List of status available for a device
  app.constant('MANAGE_DEVICE_STATUS', {
    ERROR: 'error',
    STARTING: 'starting',
    STARTED: 'started',
    STOPPING: 'stopping',
    STOPPED: 'stopped',
    DISCONNECTED: 'disconnected'
  });

  // List of available templates
  app.constant('MANAGE_TEMPLATES', {
    CAMERA_ONLY: 'camera-only',
    PC_ONLY: 'slides-only'
  });

  // List of available manageable types
  app.constant('MANAGE_MANAGEABLE_TYPES', {
    DEVICE: 'device',
    GROUP: 'group'
  });

})(angular);
