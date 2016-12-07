'use strict';

(function(app) {

  /* global Ps */
  /**
   * Defines the item detail controller to manage view displaying details about a manageable
   * (either device or group).
   */
  function ItemDetailController(
    $scope,
    $filter,
    $uibModal,
    $timeout,
    $rootScope,
    ManageFactory,
    GroupFactory,
    DeviceFactory,
    ManageableFactory,
    entityService,
    MANAGE_NAME,
    DEVICE_STATUS,
    MANAGEABLE_TYPES
  ) {
    var self = this,
      today = new Date(),
      actionEl = document.querySelector('.item-detail .action-page'),
      detailEl = document.querySelector('.item-detail .detail-page'),
      historyEl = document.querySelector('.item-detail .history-page');

    // The actually selected item
    self.selectedItem = null;

    // Datepicker options
    self.popupBegin = {
      opened: false,
      minDate: today
    };
    self.popupEnd = {
      opened: false
    };

    // Minimum schedule duration allowed
    self.minDuration = new Date();
    self.minDuration.setHours(0);
    self.minDuration.setMinutes(1);
    self.minDuration.setSeconds(0);

    self.zeroTimeDate = new Date().setHours(0, 0, 0, 0);

    /**
     * Checks if two schedules are in conflict.
     *
     * @method checkSchedulesConflict
     * @private
     * @param {Object} schedule1 Schedule object with :
     *   - **Date** beginDate : The begin date of the schedule
     *   - **Date** duration : The schedule duration
     *   - **Boolean** recurrent : true is this is a daily schedule, false otherwise
     * @param {Object} schedule2 Schedule object with :
     *   - **Date** beginDate : The begin date of the schedule
     *   - **Date** duration : The schedule duration
     *   - **Boolean** recurrent : true is this is a daily schedule, false otherwise
     * @return {Boolean} true if there are in conflict, false otherwise
     */
    function checkSchedulesConflict(schedule1, schedule2) {
      var schedule1DateTimeBegin = new Date(schedule1.beginDate);
      var schedule1DateDailyEnd = new Date(schedule1.endDate);
      var schedule1DateTimeEnd = new Date(schedule1DateTimeBegin.getTime() + schedule1.duration);
      var schedule2DateTimeBegin = new Date(schedule2.beginDate);
      var schedule2DateDailyEnd = new Date(schedule2.endDate);
      var schedule2DateTimeEnd = new Date(schedule2DateTimeBegin.getTime() + schedule2.duration);

      if ((schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateTimeEnd) ||
        (schedule2DateTimeEnd >= schedule1DateTimeBegin && schedule2DateTimeEnd <= schedule1DateTimeEnd) ||
        (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateTimeEnd >= schedule1DateTimeEnd)) {

        // Conflict between schedules' dates :

        // Schedule2 start date is in schedule1 date interval
        // schedule1 : [------------]
        // schedule2 :   [------------]

        // schedule1 : [------------]
        // schedule2 :   [--------]

        // Schedule2 end date is in schedule1 date interval
        // schedule1 :   [------------]
        // schedule2 : [------------]

        // Schedule2 date interval cover the schedule1 date interval
        // schedule1 :   [------------]
        // schedule2 : [----------------]

        return true;
      }

      if (((schedule2DateTimeBegin >= schedule1DateTimeBegin && schedule2DateTimeBegin <= schedule1DateDailyEnd) ||
        (schedule2DateDailyEnd >= schedule1DateTimeBegin && schedule2DateDailyEnd <= schedule1DateDailyEnd) ||
        (schedule2DateTimeBegin <= schedule1DateTimeBegin && schedule2DateDailyEnd >= schedule1DateDailyEnd)) &&
         (schedule1.recurrent || schedule2.recurrent)) {

        // Daily schedule with conflicting dates
        // Compare only time

        var schedule1TimeBegin = schedule1DateTimeBegin.getHours() + ':' + schedule1DateTimeBegin.getMinutes();
        var schedule1TimeEnd = schedule1DateTimeEnd.getHours() + ':' + schedule1DateTimeEnd.getMinutes();
        var schedule2TimeBegin = schedule2DateTimeBegin.getHours() + ':' + schedule2DateTimeBegin.getMinutes();
        var schedule2TimeEnd = schedule2DateTimeEnd.getHours() + ':' + schedule2DateTimeEnd.getMinutes();

        if ((schedule2TimeBegin >= schedule1TimeBegin && schedule2TimeBegin <= schedule1TimeEnd) ||
          (schedule2TimeEnd >= schedule1TimeBegin && schedule2TimeEnd <= schedule1TimeEnd) ||
          (schedule2TimeBegin <= schedule1TimeBegin && schedule2TimeEnd >= schedule1TimeEnd)) {

          // Conflict between schedules' times :

          // Schedule2 start time is in schedule1 time interval
          // schedule1 : [------------]
          // schedule2 :   [------------]

          // schedule1 : [------------]
          // schedule2 :   [--------]

          // Schedule2 end time is in schedule1 time interval
          // schedule1 :   [------------]
          // schedule2 : [------------]

          // Schedule2 time interval cover the schedule1 time interval
          // schedule1 :   [------------]
          // schedule2 : [----------------]

          return true;
        }
      }

      return false;
    }

    /**
     * Validates that begin and end dates of the new scheduled job are not in conflicts with the other scheduled jobs.
     *
     * @method validateSchedule
     * @private
     * @param {Object} schedule Schedule object with :
     *   - **Date** beginDate The begin date of the schedule
     *   - **Date** endDate The end date of the schedule
     *   - **Number** duration The schedule duration in milliseconds
     *   - **Boolean** recurrent true is this is a daily schedule, false otherwise
     * @return {Boolean} true if valid, false otherwise
     */
    function validateSchedule(schedule) {
      var i = 0;

      var handleError = function(message) {
        $scope.$emit('setAlert', 'danger', message, 4000);
      };

      // Start date is after end date
      if (schedule.beginDate >= schedule.endDate) {
        handleError($filter('translate')('MANAGE.MANAGEABLE.BEGIN_END_DATES_ERROR'));
        return false;
      }

      // Start date is before actual date
      if (schedule.beginDate <= new Date()) {
        handleError($filter('translate')('MANAGE.MANAGEABLE.BEGIN_DATE_ERROR'));
        return false;
      }

      // Verify if the new scheduled job is not in conflict with the existing jobs
      if (self.selectedItem.schedules) {

        // Validates that the new schedule is not in conflict with one of the
        // selected item schedules
        for (i = 0; i < self.selectedItem.schedules.length; i++) {
          if (checkSchedulesConflict(self.selectedItem.schedules[i], schedule)) {
            handleError($filter('translate')('MANAGE.MANAGEABLE.CONFLICT_ERROR'));
            return false;
          }
        }

      }

      if (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) {
        var devicesInConflict = [];

        // Selected item is a group
        // Validates that the new schedule is not in conflict with one of the
        // schedules in group's devices
        for (i = 0; i < self.selectedItem.devices.length; i++) {
          var device = self.selectedItem.devices[i];
          var isConflict = false;

          for (var j = 0; j < device.schedules.length; j++) {
            if (checkSchedulesConflict(device.schedules[j], schedule)) {
              isConflict = true;
              break;
            }
          }

          if (isConflict)
            devicesInConflict.push(device.name);

        }

        if (devicesInConflict.length) {
          handleError($filter('translate')('MANAGE.MANAGEABLE.GROUP_DEVICES_CONFLICT_ERROR', null, {
            devices: devicesInConflict.join(', ')
          }));
          return false;
        }

      } else if (self.selectedItem.type === MANAGEABLE_TYPES.DEVICE && self.selectedItem.group) {

        // Selected item is a device associated to a group

        // Validate that the new schedule is not in conflict with one of the schedules in the device's group
        var group = GroupFactory.getGroup(self.selectedItem.group);

        if (group) {
          for (i = 0; i < group.schedules.length; i++) {
            if (checkSchedulesConflict(group.schedules[i], schedule)) {
              handleError($filter('translate')('MANAGE.MANAGEABLE.GROUP_CONFLICT_ERROR'));
              return false;
            }
          }
        }

      }

      return true;
    }

    /**
     * Displays an error message for each given errors.
     *
     * @method displayErrors
     * @private
     * @param {Array} errors The list of errors
     * @param {String} message The message to display for each error
     */
    function displayErrors(errors, message) {
      errors.forEach(function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')(message, null, {
          code: error.code,
          name: error.name
        }), 4000);
      });
    }

    /**
     * Closes the details panel.
     *
     * @method closeDetail
     */
    self.closeDetail = function() {
      $scope.manage.showDetail = false;
      $scope.manage.openedItem = null;
      $scope.organizeLayout(false);
      GroupFactory.setGroupsProperty('isSelected', false);
      DeviceFactory.setDevicesProperty('isSelected', false);

      $timeout(function() {
        $scope.setActivePage(0);
      }, 350);

      // Destroy scrollbars
      Ps.destroy(actionEl);
      Ps.destroy(detailEl);
      Ps.destroy(historyEl);
    };

    /**
     * Displays the input to update the device's name.
     *
     * @method displayDeviceNameForm
     */
    self.displayDeviceNameForm = function() {
      self.selectedItemName = $filter('translate')(self.selectedItem.name);
      self.selectedItem.displayInputName = !self.selectedItem.displayInputName;
    };

    /**
     * Updates device's name.
     *
     * @method updateName
     * @param {String} name The new device name
     */
    self.updateName = function(name) {
      var type = null;

      if (self.selectedItem.type === MANAGEABLE_TYPES.DEVICE)
        type = MANAGEABLE_TYPES.DEVICE;
      else
        type = MANAGEABLE_TYPES.GROUP;

      ManageFactory.updateName(self.selectedItem.id, name, type).then(function() {
        self.selectedItem.name = name;
        self.selectedItem.displayInputName = !self.selectedItem.displayInputName;
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.UPDATE_NAME_ERROR', null, {
          code: error.code
        }), 4000);
        self.selectedItem.displayInputName = !self.selectedItem.displayInputName;
      });
    };

    /**
     * Adds a new schedule.
     *
     * @method addSchedule
     */
    self.addSchedule = function() {
      var durationDate = self.itemSchedule.schedule.durationDate;
      var duration = ((durationDate.getHours() * 60) + durationDate.getMinutes()) * 60 * 1000;
      var type = (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) ? MANAGEABLE_TYPES.GROUP : MANAGEABLE_TYPES.DEVICE;

      // Add begin time to begin date
      self.itemSchedule.schedule.beginDate.setHours(self.itemSchedule.schedule.beginTime.getHours());
      self.itemSchedule.schedule.beginDate.setMinutes(self.itemSchedule.schedule.beginTime.getMinutes());

      var schedule = {
        beginDate: self.itemSchedule.schedule.beginDate,
        endDate: self.itemSchedule.schedule.endDate,
        duration: duration,
        recurrent: self.itemSchedule.schedule.recurrent,
        preset: self.itemSchedule.schedule.preset
      };

      if (validateSchedule(schedule)) {
        ManageFactory.addSchedule(self.selectedItem.id, schedule, type).then(function() {
          $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.MANAGEABLE.ADD_SCHEDULE_SUCCESS'), 4000);
        }, function(error) {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.ADD_SCHEDULE_ERROR', null, {
            code: error.code
          }), 4000);
        });
      }
    };

    /**
     * Validates the end date regarding the begin date.
     * End date should not be inferior to begin date.
     *
     * @method validateEndDate
     */
    self.validateEndDate = function() {
      if (self.itemSchedule.schedule.beginDate > self.itemSchedule.schedule.endDate)
        self.itemSchedule.schedule.endDate = new Date(self.itemSchedule.schedule.beginDate.getTime());
    };

    /**
     * Starts a new recording session on the selected manageable.
     *
     * @method startRecord
     */
    self.startRecord = function() {
      var ids = [];

      if (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) {

        // Manageable is a group
        // Start recording on its available devices
        self.selectedItem.devices.forEach(function(device) {
          if (device.status !== DEVICE_STATUS.STARTING &&
              device.status !== DEVICE_STATUS.STOPPING &&
              device.status.inputs.error)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedItem.id);

      // Start record
      var preset = (self.itemSchedule.schedule.preset) ? self.itemSchedule.schedule.preset : null;
      ManageFactory.startRecord(ids, self.selectedItem.group, preset).catch(function(errors) {
        displayErrors(errors, 'MANAGE.DEVICE.START_RECORD_ERROR');
      });
    };

    /**
     * Stops recording session on the selected manageable.
     *
     * @method startRecord
     */
    self.stopRecord = function() {
      var ids = [];

      if (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) {

        // Item is a group
        // Stop recording its started devices
        self.selectedItem.devices.forEach(function(device) {
          if (device.status === DEVICE_STATUS.STARTED)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedItem.id);

      // Stop record
      ManageFactory.stopRecord(ids).catch(function(errors) {
        displayErrors(errors, 'MANAGE.DEVICE.STOP_RECORD_ERROR');
      });
    };

    /**
     * Creates a new tag on the recording session of the selected manageable.
     *
     * @method startRecord
     */
    self.tagRecord = function() {
      var ids = [];

      if (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) {

        // Item is a group
        // Stop recording its started devices
        self.selectedItem.devices.forEach(function(device) {
          if (device.status === DEVICE_STATUS.STARTED)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedItem.id);

      // Tag record
      ManageFactory.tagRecord(ids).catch(function(errors) {
        displayErrors(errors, 'MANAGE.DEVICE.INDEX_RECORD_ERROR');
      });
    };

    /**
     * Gets selected manageable's preset's name.
     *
     * @method getPresetName
     * @param {String} id The preset id
     * @return {String|Null} The preset name or null if not found
     */
    self.getPresetName = function(id) {
      if (id) {
        var preset = ManageableFactory.getPreset(self.selectedItem, id);

        if (preset)
          return preset.name;
      }

      return null;
    };

    /**
     * Resets the action form.
     *
     * @method resetActionForm
     */
    self.resetActionForm = function() {
      var beginTimeDate = new Date();
      var durationDate = new Date();
      beginTimeDate.setHours(0);
      beginTimeDate.setMinutes(0);
      beginTimeDate.setSeconds(0);
      durationDate.setHours(0);
      durationDate.setMinutes(1);
      durationDate.setSeconds(0);
      self.itemSchedule = {
        schedule: {
          beginTime: beginTimeDate,
          durationDate: durationDate
        }
      };

      if ($scope.actionForm) {
        $scope.actionForm.$setPristine();
        $scope.actionForm.$setUntouched();
      }

      if (self.selectedItem) {
        var preset = self.selectedItem.presets && self.selectedItem.presets[0] && self.selectedItem.presets[0].id;
        self.itemSchedule.schedule.preset = preset;
        self.validatePreset(preset);
      }
    };

    /**
     * Removes a schedule from selected manageable.
     *
     * @method removeSchedule
     * @private
     * @param {String} scheduleId The schedule id
     */
    function removeSchedule(scheduleId) {
      var schedule = null;

      // Find schedule
      for (var i = 0; i < self.selectedItem.schedules.length; i++) {
        if (self.selectedItem.schedules[i].id === scheduleId) {
          schedule = self.selectedItem.schedules[i];
          break;
        }
      }

      var beginDate = new Date(schedule.beginDate);
      var endDate = new Date(beginDate.getTime() + schedule.duration);
      var beginTime = beginDate.getHours() + ':' + beginDate.getMinutes();
      var endTime = endDate.getHours() + ':' + endDate.getMinutes();
      var now = new Date();
      var nowTime = now.getHours() + ':' + now.getMinutes();
      var type = (self.selectedItem.type === MANAGEABLE_TYPES.GROUP) ? MANAGEABLE_TYPES.GROUP : MANAGEABLE_TYPES.DEVICE;

      if ((beginDate <= now && endDate >= now) ||
         (schedule.recurrent && beginTime <= nowTime && endTime >= nowTime && beginDate <= now)
      ) {

        // Schedule in progress
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.SCHEDULE_IN_PROGRESS_ERROR'), 4000);

      } else {
        ManageFactory.removeSchedule(self.selectedItem.id, scheduleId, type).then(function() {
          $scope.$emit('setAlert', 'success',
                       $filter('translate')('MANAGE.MANAGEABLE.REMOVE_SCHEDULE_SUCCESS'), 4000);
        }, function(error) {
          $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.REMOVE_SCHEDULE_ERROR', null, {
            code: error.code
          }), 4000);
        });
      }
    }

    /**
     * Removes an historic from selected manageable.
     *
     * @method removeHistoric
     * @private
     * @param {String} historicId The historic id
     */
    function removeHistoric(historicId) {
      var type = null;
      if (self.selectedItem.type === MANAGEABLE_TYPES.GROUP)
        type = MANAGEABLE_TYPES.GROUP;
      else
        type = MANAGEABLE_TYPES.DEVICE;

      ManageFactory.removeHistoric(self.selectedItem.id, historicId, type).then(function() {
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.MANAGEABLE.REMOVE_HISTORIC_SUCCESS'), 4000);
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.REMOVE_HISTORIC_ERROR', null, {
          code: error.code
        }), 4000);
      });
    }

    /**
     * Removes the whole history.
     *
     * @method removeHistory
     * @private
     */
    function removeHistory() {
      ManageFactory.removeHistory(self.selectedItem.id, self.selectedItem.type).then(function() {
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.MANAGEABLE.REMOVE_HISTORY_SUCCESS'), 4000);
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.REMOVE_HISTORY_ERROR', null, {
          code: error.code
        }), 4000);
      });
    }

    /**
     * Removes a device.
     *
     * @method removeDevice
     * @private
     * @param {String} id The id of the device to remove
     */
    function removeDevice(id) {
      ManageFactory.remove(id, MANAGEABLE_TYPES.DEVICE).then(function() {
        $scope.$emit('setAlert', 'success', $filter('translate')('MANAGE.DEVICE.REMOVE_SUCCESS'), 4000);
        $rootScope.$broadcast('item.closeDetails');
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.DEVICE.REMOVE_ERROR', null, {
          code: error.code
        }), 4000);
      });
    }

    /**
     * Opens a modal to remove something.
     *
     * @method openRemoveModal
     * @param {String} id The id of the object to remove
     * @param {String} action The type of action to perform
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
            removeDevice(id);
            break;
          case 'REMOVE_SCHEDULE':
            removeSchedule(id);
            break;
          case 'REMOVE_HISTORY':
            removeHistoric(id);
            break;
          case 'PURGE_HISTORY':
            removeHistory();
            break;
          default:
            break;
        }
      }, function() {
        // Do nothing
      });
    };

    /**
     * Validates the selected item inputs regarding the given preset id.
     *
     * It is not possible to start a recording session if the inputs of the
     * selected item does not correspond to the preset configuration.
     * e.g. It is not possible to start a recording session with slides extraction
     * without a desktop input.
     *
     * @method validatePreset
     * @param {String} presetId The id of the preset
     */
    self.validatePreset = function(presetId) {
      var model = self.selectedItem.type === MANAGEABLE_TYPES.DEVICE ? DeviceFactory : GroupFactory;
      model.validatePreset(self.selectedItem.id, presetId);
    };

    // Listen event to load the selected item details on window opening
    $scope.$on('item.load', function(event, itemId, isGroup) {
      if (self.selectedItem && self.selectedItem.id === itemId) {
        self.selectedItem.isSelected = true;
        return;
      }

      // Get the new selected item
      self.selectedItem = isGroup ? GroupFactory.getGroup(itemId) : DeviceFactory.getDevice(itemId);

      // Unselect all groups and all devices
      GroupFactory.setGroupsProperty('isSelected', false);
      DeviceFactory.setDevicesProperty('isSelected', false);

      // Select the new item
      self.selectedItem.isSelected = true;

      // Reset action form
      self.resetActionForm();

    });

    // Listen event to close item details window
    $scope.$on('item.closeDetails', function(event) {
      self.closeDetail();
    });

    // Listen event to go to the previous page
    $scope.$on('back', function(event) {
      $scope.back();
    });

    // Watch for preset changes
    $scope.$watch('vm.selectedItem.devices', function() {
      if (self.selectedItem && self.selectedItem.devices)
        self.validatePreset(self.itemSchedule.schedule.preset);
    }, true);
    $scope.$watch('vm.selectedItem.presets', function() {
      if (self.selectedItem) {
        var preset = self.selectedItem.presets && self.selectedItem.presets[0] && self.selectedItem.presets[0].id;
        self.itemSchedule.schedule.preset = preset;
        self.validatePreset(preset);
      }
    });

    // Listen to window resize event to update height of elements
    window.addEventListener('resize', function() {
      actionEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      detailEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
      historyEl.setAttribute('style', 'height:' + parseInt(window.innerHeight - 100) + 'px');
    });

    self.resetActionForm();
  }

  app.controller('ManageItemDetailController', ItemDetailController);
  ItemDetailController.$inject = [
    '$scope',
    '$filter',
    '$uibModal',
    '$timeout',
    '$rootScope',
    'ManageFactory',
    'ManageGroupFactory',
    'ManageDeviceFactory',
    'ManageManageableFactory',
    'entityService',
    'MANAGE_NAME',
    'MANAGE_DEVICE_STATUS',
    'MANAGE_MANAGEABLE_TYPES'
  ];

})(angular.module('ov.manage'));
