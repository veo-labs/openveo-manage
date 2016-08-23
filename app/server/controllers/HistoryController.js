'use strict';

var path = require('path');
var shortid = require('shortid');
var errors = process.requireManage('app/server/httpErrors.js');
var openVeoAPI = require('@openveo/api');
var Controller = openVeoAPI.controllers.Controller;
var DeviceModel = process.requireManage('app/server/models/DeviceModel.js');
var GroupModel = process.requireManage('app/server/models/GroupModel.js');
var SocketProviderManager = process.requireManage('app/server/services/SocketProviderManager.js');
var configDir = openVeoAPI.fileSystem.getConfDir();
var manageConf = require(path.join(configDir, 'manage/manageConf.json'));
var namespace = manageConf.namespace;
var AccessError = openVeoAPI.errors.AccessError;


/**
 * Creates an HistoryController
 *
 * @class HistoryController
 * @constructor
 * @extends Controller
 */
function HistoryController() {
  Controller.call(this);
}

module.exports = HistoryController;

/**
 * Add a new historical to a device or a group.
 *
 * Parameters :
 *  - **id** The id of the device or group history to update
 *
 * Also expects data in body.
 *
 * @method addHistoryToEntityAction
 */
HistoryController.prototype.addHistoryToEntityAction = function(request, response, next) {
  if (request.params.id && request.body) {
    var model = (request.body.entityType === 'devices') ? new DeviceModel() : new GroupModel(),
      entityId = request.params.id,
      data = request.body,
      history = (data.history) ? data.history : [],
      socketProvider = SocketProviderManager.getSocketProviderByNamespace(namespace),
      newHistory = {
        id: shortid.generate(),
        date: new Date()
      };

    // Manage the type of action
    switch (data.action) {
      case 'UPDATE_NAME':
        newHistory.message = {
          data: 'MANAGE.HISTORY.UPDATE_NAME',
          groupName: null
        };
        history.push(newHistory);
        break;
      case 'START_RECORD':
        newHistory.message = {
          data: 'MANAGE.HISTORY.START_RECORD',
          groupName: null
        };
        history.push(newHistory);
        break;
      case 'STOP_RECORD':
        newHistory.message = {
          data: 'MANAGE.HISTORY.STOP_RECORD',
          groupName: null
        };
        history.push(newHistory);
        break;
      case 'ADD_DEVICE_TO_GROUP':
        newHistory.message = {
          data: 'MANAGE.HISTORY.ADD_DEVICE_TO_GROUP',
          groupName: data.groupName
        };
        history.push(newHistory);
        break;
      case 'REMOVE_DEVICE_FROM_GROUP':
        newHistory.message = {
          data: 'MANAGE.HISTORY.REMOVE_DEVICE_FROM_GROUP',
          groupName: data.groupName
        };
        history.push(newHistory);
        break;
      case 'TAG_RECORD':
        newHistory.message = {
          data: 'MANAGE.HISTORY.TAG_RECORD',
          groupName: null
        };
        history.push(newHistory);
        break;
      default:
        break;
    }

    model.update(entityId, {history: history}, function(error, updateCount) {
      if (error && (error instanceof AccessError))
        next(errors.ADD_HISTORY_FORBIDDEN);
      else if (error) {
        process.logger.error((error && error.message) || 'Fail updating',
          {method: 'addHistoryToEntityAction', entity: entityId});
        next(errors.ADD_HISTORY_ERROR);
      } else {

        // Update cached device
        if (data.entityType === 'devices') {
          socketProvider.updateDevice(entityId, history);
        }
        response.send({error: null, status: 'ok', history: history});
      }
    });
  } else {

    // Missing id of the device or the data
    next(errors.ADD_HISTORY_MISSING_PARAMETERS);
  }
};
