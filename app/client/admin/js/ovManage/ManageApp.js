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
    $routeProvider.when('/manage/todo', {
      templateUrl: '/manage/be/views/manage.html',
      controller: 'ManageController',
      title: 'MANAGE.TODO.PAGE_TITLE',
      access: 'manage-access-todo-page',
      resolve: {
        datas: ['manageService', function(manageService) {
          return manageService.loadDatas();
        }]
      }
    });

  }]);

})(angular);
