'use strict';

const path = require('path');

// Set module root directory
process.rootManage = __dirname;

// Define a new method on process object to be able to require
// a module with a path relative to plugin's root directory
process.requireManage = function(filePath) {
  return require(path.join(process.rootManage, filePath));
};
