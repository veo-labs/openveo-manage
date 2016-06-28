'use strict';

// Modules dependencies
var socket = require('socket.io');

function socketManager() {
  this.io = socket(this.app);
}

modules.exports = socketManager;