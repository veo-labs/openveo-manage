'use strict';

var path = require('path');
var openVeoApi = require('@openveo/api');

// Set module root directory
process.rootManage = path.join(__dirname, '../../');
process.requireManage = function(filePath) {
  return require(path.normalize(process.rootManage + '/' + filePath));
};

process.logger = openVeoApi.logger.add('openveo');
