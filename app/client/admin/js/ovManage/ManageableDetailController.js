'use strict';

(function(app) {

  /* global Ps */
  /**
   * Defines the manageable detail controller to manage view displaying details about a manageable.
   */
  function ManageableDetailController(
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

    // The actually selected manageable
    self.selectedManageable = null;

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
      var validationError = null;

      var handleError = function(message) {
        $scope.$emit('setAlert', 'danger', message, 4000);
      };

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP) {
        validationError = GroupFactory.isValidSchedule(self.selectedManageable.id, schedule);
        if (validationError) {
          handleError(validationError.message);
          return false;
        }
      } else if (self.selectedManageable.type === MANAGEABLE_TYPES.DEVICE) {
        var group = (self.selectedManageable.group) ? GroupFactory.getGroup(self.selectedManageable.group) : null;
        validationError = DeviceFactory.isValidSchedule(self.selectedManageable.id, schedule, group);
        if (validationError) {
          handleError(validationError.message);
          return false;
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
          name: $filter('translate')(error.name)
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
     * Displays the input to update the manageable's name.
     *
     * @method displayNameForm
     */
    self.displayNameForm = function() {
      self.selectedManageableName = $filter('translate')(self.selectedManageable.name);
      self.selectedManageable.displayInputName = !self.selectedManageable.displayInputName;
    };

    /**
     * Updates manageable's name.
     *
     * @method updateName
     * @param {String} name The new manageable name
     */
    self.updateName = function(name) {
      var type = null;

      if (self.selectedManageable.type === MANAGEABLE_TYPES.DEVICE)
        type = MANAGEABLE_TYPES.DEVICE;
      else
        type = MANAGEABLE_TYPES.GROUP;

      ManageFactory.updateName(self.selectedManageable.id, name, type).then(function() {
        self.selectedManageable.name = name;
        self.selectedManageable.displayInputName = !self.selectedManageable.displayInputName;
      }, function(error) {
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.UPDATE_NAME_ERROR', null, {
          code: error.code
        }), 4000);
        self.selectedManageable.displayInputName = !self.selectedManageable.displayInputName;
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
      var type = null;

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP)
        type = MANAGEABLE_TYPES.GROUP;
      else
        type = MANAGEABLE_TYPES.DEVICE;

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
        ManageFactory.addSchedule(self.selectedManageable.id, schedule, type).then(function() {
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

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP) {

        // Manageable is a group
        // Start recording on its available devices
        self.selectedManageable.devices.forEach(function(device) {
          if (device.status !== DEVICE_STATUS.STARTING &&
              device.status !== DEVICE_STATUS.STOPPING &&
              !device.inputs.error)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedManageable.id);

      // Start record
      var preset = (self.itemSchedule.schedule.preset) ? self.itemSchedule.schedule.preset : null;
      ManageFactory.startRecord(ids, self.selectedManageable.group, preset).catch(function(errors) {
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

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP) {

        // Item is a group
        // Stop recording its started devices
        self.selectedManageable.devices.forEach(function(device) {
          if (device.status === DEVICE_STATUS.STARTED)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedManageable.id);

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

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP) {

        // Item is a group
        // Stop recording its started devices
        self.selectedManageable.devices.forEach(function(device) {
          if (device.status === DEVICE_STATUS.STARTED)
            ids.push(device.id);
        });

      } else
        ids.push(self.selectedManageable.id);

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
        var preset = ManageableFactory.getPreset(self.selectedManageable, id);

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

      if (self.selectedManageable && self.selectedManageable.presets && self.selectedManageable.presets[0]) {
        var preset = self.selectedManageable.presets[0].id;
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
      for (var i = 0; i < self.selectedManageable.schedules.length; i++) {
        if (self.selectedManageable.schedules[i].id === scheduleId) {
          schedule = self.selectedManageable.schedules[i];
          break;
        }
      }

      var beginDate = new Date(schedule.beginDate);
      var endDate = new Date(beginDate.getTime() + schedule.duration);
      var beginTime = beginDate.getHours() + ':' + beginDate.getMinutes();
      var endTime = endDate.getHours() + ':' + endDate.getMinutes();
      var now = new Date();
      var nowTime = now.getHours() + ':' + now.getMinutes();
      var type = null;

      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP)
        type = MANAGEABLE_TYPES.GROUP;
      else
        type = MANAGEABLE_TYPES.DEVICE;

      if ((beginDate <= now && endDate >= now) ||
         (schedule.recurrent && beginTime <= nowTime && endTime >= nowTime && beginDate <= now)
      ) {

        // Schedule in progress
        $scope.$emit('setAlert', 'danger', $filter('translate')('MANAGE.MANAGEABLE.SCHEDULE_IN_PROGRESS_ERROR'), 4000);

      } else {
        ManageFactory.removeSchedule(self.selectedManageable.id, scheduleId, type).then(function() {
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
      if (self.selectedManageable.type === MANAGEABLE_TYPES.GROUP)
        type = MANAGEABLE_TYPES.GROUP;
      else
        type = MANAGEABLE_TYPES.DEVICE;

      ManageFactory.removeHistoric(self.selectedManageable.id, historicId, type).then(function() {
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
      ManageFactory.removeHistory(self.selectedManageable.id, self.selectedManageable.type).then(function() {
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
        $rootScope.$broadcast('manageable.closeDetails');
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
     * Validates the selected manageable's inputs regarding the given preset id.
     *
     * It is not possible to start a recording session if the inputs of the
     * selected manageable does not correspond to the preset configuration.
     * e.g. It is not possible to start a recording session with slides extraction
     * without a desktop input.
     *
     * @method validatePreset
     * @param {String} presetId The id of the preset
     */
    self.validatePreset = function(presetId) {
      var model = self.selectedManageable.type === MANAGEABLE_TYPES.DEVICE ? DeviceFactory : GroupFactory;
      model.validatePreset(self.selectedManageable.id, presetId);
    };

    // Listen event to load the selected manageable details
    $scope.$on('manageable.load', function(event, itemId, isGroup) {
      if (self.selectedManageable && self.selectedManageable.id === itemId) {
        self.selectedManageable.isSelected = true;
        return;
      }

      // Get the new selected manageable
      self.selectedManageable = isGroup ? GroupFactory.getGroup(itemId) : DeviceFactory.getDevice(itemId);

      // Unselect all manageables
      GroupFactory.setGroupsProperty('isSelected', false);
      DeviceFactory.setDevicesProperty('isSelected', false);

      // Select the new manageable
      self.selectedManageable.isSelected = true;

      // Reset action form
      self.resetActionForm();

    });

    // Listen event to close manageable details window
    $scope.$on('manageable.closeDetails', function(event) {
      self.closeDetail();
    });

    // Listen event to go to the previous page
    $scope.$on('back', function(event) {
      $scope.back();
    });

    // Watch for devices' changes
    $scope.$watch('vm.selectedManageable.devices', function() {
      if (self.selectedManageable && self.selectedManageable.devices)
        self.validatePreset(self.itemSchedule.schedule.preset);
    }, true);

    // Watch for preset changes
    $scope.$watch('vm.selectedManageable.presets', function() {
      if (self.selectedManageable && self.selectedManageable.presets && self.selectedManageable.presets[0]) {
        var preset = self.selectedManageable.presets[0].id;
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

  app.controller('ManageManageableDetailController', ManageableDetailController);
  ManageableDetailController.$inject = [
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
