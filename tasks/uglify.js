'use strict';

// Obfuscate javascript files
// For more information about Grunt uglify, have a look at https://www.npmjs.com/package/grunt-contrib-uglify
module.exports = {

  // Obfuscate client manage's JavaScript files
  manage: {
    files: [
      {

        // Enable dynamic expansion
        expand: true,

        // Base path for patterns
        cwd: '<%= project.beJS %>/',

        // Match all JavaScript files
        src: ['ovManage/*.js'],

        // Set destination directory
        dest: '<%= project.uglify %>/',

        // Generated files extension
        ext: '.min.js'

      }
    ]
  }

};
