'use strict';

(function(app) {

  /**
   * Defines a manage controller example
   */
  function ManageController($scope, datas) {
    $scope.todo = datas.data || {};

    $scope.devices = [
      {
        name: 'Veobox 1',
      },
      {
        name: 'Veobox 2'
      }
    ];

    console.log($scope.devices);
  }

  app.controller('ManageController', ManageController);
  ManageController.$inject = ['$scope', 'datas'];

})(angular.module('ov.manage'));
