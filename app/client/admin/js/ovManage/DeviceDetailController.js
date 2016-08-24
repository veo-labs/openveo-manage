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
        self.selectedDevice.displayInputName = !self.selectedDevice.displayInputName;
        self.selectedDevice.name = name;

        // Save to history
        manageService.addToHistory(self.selectedDevice.id, model, 'UPDATE_NAME', self.selectedDevice.history)
        .then(function(result) {
          self.selectedDevice.history = result.data.history;
        });

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
     * Save a schedule for a device or a group of devices
     *
     * @param id
     */
    self.saveSchedule = function(id) {
      var dateTimeBegin = mergeDateTime(self.deviceSchedule.schedule.beginDate,
        self.deviceSchedule.schedule.beginTime),
        dateTimeEnd = mergeDateTime(self.deviceSchedule.schedule.endDate, self.deviceSchedule.schedule.endTime),
        generatedId = deviceService.generateId(),
        scheduleToSave = {
          scheduleId: generatedId,
          beginDate: dateTimeBegin,
          endDate: dateTimeEnd,
          preset: self.deviceSchedule.schedule.preset
        },
        schedules = (self.selectedDevice.schedules) ? self.selectedDevice.schedules : [],
        isGroup = self.selectedDevice.devices,
        entity = (isGroup) ? 'groups' : 'devices',
        ids = [],
        params = {
          entityId: id,
          entityType: entity,
          scheduleId: generatedId,
          beginDate: dateTimeBegin,
          endDate: dateTimeEnd,
          preset: self.deviceSchedule.schedule.preset,
          deviceIds: []
        };

      // Verify dates
      if (dateTimeBegin >= dateTimeEnd) {
        self.deviceSchedule.$setValidity('schedule', false);
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.SCHEDULE.DATE_ERROR'), 4000);
      }

      // Verify if the new scheduled job is not in conflict with the existing jobs
      for (var i = 0; i < schedules.length; i++) {
        if ((dateTimeBegin >= new Date(schedules[i].beginDate) && dateTimeBegin <= new Date(schedules[i].endDate)) ||
          (dateTimeEnd >= new Date(schedules[i].beginDate) && dateTimeEnd <= new Date(schedules[i].endDate))) {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.SCHEDULE.CONFLICT_ERROR'), 4000);
          self.deviceSchedule.$setValidity('schedule', false);
          break;
        }
      }

      if (self.deviceSchedule.$valid) {
        if (isGroup) {
          self.selectedDevice.devices.map(function(device) {
            ids.push(device.id);
          });
          params.deviceIds = ids;
        } else {
          params.deviceIds.push(self.selectedDevice.id);
        }

        // Prepare schedules for saving in database
        schedules.push(scheduleToSave);

        entityService.updateEntity(entity, manageName, id, {schedules: schedules}).then(function() {

          // Create the scheduled job
          deviceService.addScheduledJob({schedules: schedules, params: params}).then(function() {});
          self.deviceSchedule.schedule = {};
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.SCHEDULE.SAVE_SUCCESS'), 4000);
        }, function() {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.SCHEDULE.SAVE_ERROR'), 4000);
        });
      }
    };

    /**
     * Update the form validity on change if its on error to retry validation
     */
    self.updateFormValidity = function() {
      if (!self.deviceSchedule.$valid) {
        self.deviceSchedule.$setValidity('schedule', true);
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
      var ids = [],
        model = (self.selectedDevice.devices) ? 'groups' : 'devices';

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
          deviceIds: [self.selectedDevice.id],
          preset: (self.deviceSchedule.preset) ? self.deviceSchedule.preset : null
        });
      }

      // Save to history
      manageService.addToHistory(self.selectedDevice.id, model, 'START_RECORD', self.selectedDevice.history, null)
      .then(function(result) {
        self.selectedDevice.history = result.data.history;
      });
    };

    /**
     * Stop the current recording session
     */
    self.stopRecord = function() {
      var ids = [],
        model = (self.selectedDevice.devices) ? 'groups' : 'devices';

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

      // Save to history
      manageService.addToHistory(self.selectedDevice.id, model, 'STOP_RECORD', self.selectedDevice.history, null)
      .then(function(result) {
        self.selectedDevice.history = result.data.history;
      });
    };

    /**
     * Create a new tag for the current recording session
     */
    self.tagRecord = function() {
      var ids = [],
        model = (self.selectedDevice.devices) ? 'groups' : 'devices';

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

      // Save to history
      manageService.addToHistory(self.selectedDevice.id, model, 'TAG_RECORD', self.selectedDevice.history, null)
      .then(function(result) {
        self.selectedDevice.history = result.data.history;
      });
    };

    /**
     * Remove a specific history
     *
     * @param {String} historyId The history id
     */
    self.removeHistory = function(historyId) {
      var model = (self.selectedDevice.devices) ? 'groups' : 'devices',
        history = self.selectedDevice.history,
        historyIndex = self.selectedDevice.history.findIndex(function(history) {
          return history.id === historyId;
        });

      // Update the history
      history.splice(historyIndex, 1);

      entityService.updateEntity(model, manageName, self.selectedDevice.id, {history: history}).then(function() {
        self.selectedDevice.history = history;
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.HISTORY.REMOVE_SUCCESS'), 4000);
      }, function() {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.HISTORY.REMOVE_ERROR'), 4000);
      });
    };

    /**
     * Open a modal, apply callback on OK promise and remove device
     *
     * @param {String} id The id of the object to remove
     * @param {String} action The type of action to realise
     */
    self.openRemoveModal = function(id, action) {
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
        switch (action) {
          case 'REMOVE_DEVICE':
            self.removeDevice(id);
            break;
          case 'REMOVE_SCHEDULE':
            self.removeSchedule(id);
            break;
          case 'REMOVE_HISTORY':
            self.removeHistory(id);
            break;
          default:
            break;
        }
      }, function() {
        // Do nothing
      });
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
