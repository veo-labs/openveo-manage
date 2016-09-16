'use strict';

(function(angular) {

  var app = angular.module('ov.manage', [
    'ov.i18n',
    'ov.socketIO'
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

  /*
   * Configures the ov.manage application by adding new routes.
   */
  app.config(['$routeProvider', function($routeProvider) {

    // routing
    $routeProvider.when('/manage', {
      templateUrl: '/manage/be/views/manage.html',
      controller: 'ManageController',
      controllerAs: 'vm',
      title: 'MANAGE.PAGE_TITLE',
      access: 'manage-access-page',
      resolve: {
        devices: ['manageService', function(manageService) {
          return manageService.getDevices();
        }],
        groups: ['manageService', function(manageService) {
          return manageService.getGroups();
        }],
        group: ['manageService', '$route', function(manageService, $route) {
          var id = $route.current.params.id;
          if (!id) {
            return null;
          }
          return manageService.getGroup(id);
        }]
      }
    });
    $routeProvider.when('/manage/group-detail/:id', {
      templateUrl: '/manage/be/views/group-detail.html',
      controller: 'ManageController',
      controllerAs: 'vm',
      title: 'MANAGE.GROUP_DETAIL.PAGE_TITLE',
      access: 'manage-group-detail-access-page',
      resolve: {
        devices: ['manageService', function(manageService) {
          return manageService.getDevices();
        }],
        groups: ['manageService', function(manageService) {
          return manageService.getGroups();
        }],
        group: ['manageService', '$route', function(manageService, $route) {
          var id = $route.current.params.id;

          return manageService.getGroup(id);
        }]
      }
    });

  }]);

  app.constant('manageName', 'manage');

})(angular);
