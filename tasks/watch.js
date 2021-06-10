'use strict';

// Watch files for modifications
// For more information about Grunt watch, have a look at https://www.npmjs.com/package/grunt-contrib-watch
module.exports = {

  // Generate sprite on each png file modification
  sprite: {
    files: '**/sprites/*.png',
    tasks: ['sprite']
  },

  // Automatically rebuild back office when a file is modified
  'back-office': {
    files: [
      '<%= project.be %>/**/*',
      '<%= project.beViewsAssets %>/**/*',
      '<%= project.root %>/conf.js'
    ],
    tasks: [
      'build-back-office-client'
    ]
  }

};
