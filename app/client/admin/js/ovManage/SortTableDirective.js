'use strict';

(function(app) {

  /**
   * Creates a new Angular directive as an HTML attribute ov-sort-table to be able to create a sort table.
   *
   * @example
   *  <th ov-sort-table order="'name'" by="order" reverse="reverse">Name</th>
   *
   * @module ov.manage
   * @class ovSortTable
   */
  function ovSortTable() {

    return {
      restrict: 'A',
      transclude: true,
      template: '<a href="" title="Filter" ng-click="onClick()">' +
      '<span ng-transclude></span>' +
      '<span class="sort">' +
      '<i class="caret-top" ng-class="{\'\' : order === by && !reverse,  \'active\' : order === by && reverse}"></i>' +
      '<i class="caret" ng-class="{\'active\' : order === by && !reverse,  \'\' : order === by && reverse}"></i>' +
      '</span>' +
      '</a>',
      scope: {
        order: '=',
        by: '=',
        reverse: '=',
        fnSort: '&?'
      },
      link: function(scope) {
        scope.onClick = function() {
          if (scope.order === scope.by) {
            scope.reverse = !scope.reverse;
          } else {
            scope.by = scope.order;
            scope.reverse = false;
          }

          if (scope.fnSort !== undefined) {
            scope.fnSort({order: scope.order, reverse: scope.reverse});
          }
        };
      }
    };
  }

  app.directive('ovSortTable', ovSortTable);

})(angular.module('ov.manage'));