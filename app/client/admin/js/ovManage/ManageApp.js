'use strict';

(function(angular) {

  var app = angular.module('ov.manage', [
    'ov.i18n'
  ]);

  /*
   * Configures the ov.manage application by adding new routes.
   */
  app.config(['$routeProvider', function($routeProvider) {

    // route example
    $routeProvider.when('/manage', {
      templateUrl: '/manage/be/views/manage.html',
      controller: 'ManageController',
      controllerAs: 'vm',
      title: 'MANAGE.PAGE_TITLE',
      access: 'manage-access-page',
      resolve: {
        results: ['manageService', function(manageService) {
          return manageService.loadDevices();
        }]
      }
    });

  }]);

})(angular);
