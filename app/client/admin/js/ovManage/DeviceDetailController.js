'use strict';

(function(app) {

  /**
   * Defines the device detail controller
   */
  function DeviceDetailController(
    $scope,
    $filter,
    $uibModal,
    deviceService,
    manageService,
    entityService,
    manageName
  ) {

    var self = this,
      activePage = 0,
      today = new Date();

    // The stored selected device
    self.selectedDevice = null;
    self.displayAction = false;

    // Datepicker options
    self.popupBegin = {
      opened: false,
      minDate: today
    };
    self.popupEnd = {
      opened: false
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

    /**
     * Close the device detail window
     */
    self.closeDetail = function() {
      if (self.selectedDevice)
        manageService.manageSelectedDevice(self.selectedDevice.id);
      $scope.manage.showDetail = false;
      $scope.manage.openedDevice = null;
      self.selectedDevice = null;
      deviceService.clearSelectedDevice();
      $scope.organizeLayout(false);
    };

    /**
     * Remove a device
     *
     * @param id
     */
    self.removeDevice = function(id) {
      if ($scope.group && $scope.group.devices.length == 2) {
        entityService.removeEntity('devices', manageName, id).then(function() {
          entityService.removeEntity('groups', manageName, $scope.group.id).then(function() {
            manageService.removeDevice(id);
            manageService.removeGroup($scope.group.id);
            self.closeDetail();
            $scope.back();
            $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_SUCCESS'), 4000);
          });
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_ERROR'), 4000);
        });
      } else {
        entityService.removeEntity('devices', manageName, id).then(function() {
          manageService.removeDevice(id);
          self.closeDetail();
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_ERROR'), 4000);
        });
      }
    };

    /**
     * Open a modal, apply callback on OK promise and remove device
     *
     * @param id
     */
    self.openRemoveModal = function(id) {
      var modalInstance = $uibModal.open({
        templateUrl: 'removeModal.html',
        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
          $scope.ok = function() {
            $uibModalInstance.close(true);
          };

          $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
          };
        }]
      });

      modalInstance.result.then(function() {
        self.removeDevice(id);
      }, function() {
        // Do nothing
      });
    };

    /**
     * Display the input to update the device name
     */
    self.displayDeviceNameForm = function() {
      self.selectedDeviceName = self.selectedDevice.name;
      self.selectedDevice.displayInputName = !self.selectedDevice.displayInputName;
    };

    /**
     * Update device name and send event to device
     *
     * @param name
     */
    self.updateName = function(name) {
      var model = (self.selectedDevice.devices) ? 'groups' : 'devices';

      entityService.updateEntity(model, manageName, self.selectedDevice.id, {name: name}).then(function() {
        self.selectedDevice.name = name;
        manageService.updateDevice(self.selectedDevice);
        self.selectedDevice.displayInputName = !self.selectedDevice.displayInputName;

        // Send event to save the new name (not for groups)
        if (!self.selectedDevice.devices) {
          $scope.socket.emit('update.name', {id: self.selectedDevice.id, name: name});
        }
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.UPDATE_NAME_SUCCESS'), 4000);
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.UPDATE_NAME_ERROR'), 4000);
      });
    };

    /**
     * Add verifications to display actions in device detail window
     *
     * @returns {boolean}
     */
    self.isDisplayAction = function() {
      if (self.selectedDevice) {
        if (self.selectedDevice.devices) {
          self.displayAction = true;
        } else if (!self.selectedDevice.status || self.selectedDevice.status === 'disconnected') {
          self.displayAction = false;
        } else {
          self.displayAction = true;
        }
      }

      return self.displayAction;
    };

    /**
     * Permits to merge date and time for a schedule
     *
     * @param {DateTime} date The date (begin or end) defined for a schedule
     * @param {DateTime} time The time (begin or end) defined for a schedule
     */
    function mergeDateTime(date, time) {
      var hours = time.getHours(),
        minutes = time.getMinutes();

      date.setHours(hours, minutes);

      return date;
    }

    /**
     * Save a schedule for a device or a group of devices TODO: node-schedule for CRON
     *
     * @param id
     */
    self.saveSchedule = function(id) {
      var dateTimeBegin = mergeDateTime(self.deviceSchedule.beginDate, self.deviceSchedule.beginTime),
        dateTimeEnd = mergeDateTime(self.deviceSchedule.endDate, self.deviceSchedule.endTime),
        scheduleToSave = {
          scheduleId: deviceService.generateId(),
          beginDate: dateTimeBegin,
          endDate: dateTimeEnd,
          preset: self.deviceSchedule.preset
        },
        schedules = (self.selectedDevice.schedules) ? self.selectedDevice.schedules : [],
        isGroup = self.selectedDevice.devices,
        entity = (isGroup) ? 'groups' : 'devices',
        ids = [],
        params = {
          entityId: id,
          entityType: entity,
          beginDate: dateTimeBegin,
          endDate: dateTimeEnd,
          preset: self.deviceSchedule.preset,
          deviceIds: []
        };

      if (self.deviceSchedule.$valid) {
        if (isGroup) {
          self.selectedDevice.devices.map(function(device) {
            ids.push(device.id);
          });
          params.deviceIds = ids;
          params.sessionId = self.selectedDevice.group;
        } else {
          params.deviceIds.push(self.selectedDevice.id);
        }

        // Prepare schedules for saving in database
        schedules.push(scheduleToSave);

        entityService.updateEntity(entity, manageName, id, {schedules: schedules}).then(function() {

          // Create the scheduled job
          deviceService.addScheduledJob({schedules: schedules, params: params}).then(function() {
            self.selectedDevice.schedules = schedules;
          });

          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.SAVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.SAVE_ERROR'), 4000);
        });
      }
    };

    /**
     * Remove a saved schedule
     *
     * @param id
     */
    self.removeSchedule = function(id) {

      // console.log(id);
    };

    /**
     * Start a new recording session for a device or a group of devices
     */
    self.startRecord = function() {
      var ids = [];

      // Verify if the device is a group
      if (self.selectedDevice.devices) {
        self.selectedDevice.devices.map(function(device) {
          ids.push(device.id);
        });

        $scope.socket.emit('session.start', {
          deviceIds: ids,
          sessionId: self.selectedDevice.group,
          preset: (self.deviceSchedule.preset) ? self.deviceSchedule.preset : null
        });
      } else {
        $scope.socket.emit('session.start', {
          deviceId: self.selectedDevice.id,
          preset: (self.deviceSchedule.preset) ? self.deviceSchedule.preset : null
        });
      }
    };

    /**
     * Stop the current recording session
     */
    self.stopRecord = function() {
      var ids = [];

      // Verify if the device is a group
      if (self.selectedDevice.devices) {
        self.selectedDevice.devices.map(function(device) {
          ids.push(device.id);
        });

        $scope.socket.emit('session.stop', {
          deviceIds: ids
        });
      } else {
        $scope.socket.emit('session.stop', {
          deviceIds: [self.selectedDevice.id]
        });
      }
    };

    /**
     * Create a new tag for the current recording session
     */
    self.tagRecord = function() {
      var ids = [];

      // Verify if the device is a group
      if (self.selectedDevice.devices) {
        self.selectedDevice.devices.map(function(device) {
          ids.push(device.id);
        });

        $scope.socket.emit('session.index', {
          deviceIds: ids
        });
      } else {
        $scope.socket.emit('session.index', {
          deviceIds: [self.selectedDevice.id]
        });
      }
    };

    // Listen event to load the selected device details on window opening
    $scope.$on('device.details', function(event) {
      self.selectedDevice = deviceService.getSelectedDevice();
      deviceService.updateState();
      self.isDisplayAction();
    });

    // Listen event to remove the selected device
    $scope.$on('closeDeviceDetails', function(event) {
      self.selectedDevice = null;
    });

    // Listen event to close device details window
    $scope.$on('close.window', function(event) {
      self.closeDetail();
    });

  }

  app.controller('DeviceDetailController', DeviceDetailController);
  DeviceDetailController.$inject = [
    '$scope',
    '$filter',
    '$uibModal',
    'deviceService',
    'manageService',
    'entityService',
    'manageName'
  ];

})(angular.module('ov.manage'));
