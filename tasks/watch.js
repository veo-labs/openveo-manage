'use strict';

// Watch files for modifications
// For more information about Grunt watch, have a look at https://www.npmjs.com/package/grunt-contrib-watch
module.exports = {

  // Generate sprite on each png file modification
  sprite: {
    files: '**/sprites/*.png',
    tasks: ['sprite']
  },

  // Launch compass compilation on each SCSS files modification
  compass: {
    files: '**/*.scss',
    tasks: ['compass:dev']
  }
};
