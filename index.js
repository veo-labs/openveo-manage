'use strict';

require('./processRequire.js');

// Expose the ManagePlugin
module.exports = process.requireManage('app/server/ManagePlugin.js');
