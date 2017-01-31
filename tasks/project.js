'use strict';

var path = require('path');

module.exports = {
  basePath: path.join(__dirname, '..'),
  app: '<%= project.basePath %>/app',
  be: '<%= project.app %>/client/admin',
  front: '<%= project.app %>/client/front',
  beJS: '<%= project.be %>/js/',
  frontJS: '<%= project.front %>/js/',
  sass: '<%= project.be %>/compass/sass',
  beAssets: '<%= project.basePath %>/assets/be',
  beCSSAssets: '<%= project.beAssets %>/css',
  beJSAssets: '<%= project.beAssets %>/js',
  uglify: '<%= project.basePath %>/build/uglify'
};
