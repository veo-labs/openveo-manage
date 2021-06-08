'use strict';

// Compass / SASS compilation
// For more information about Grunt compass, have a look at https://www.npmjs.com/package/grunt-contrib-compass
module.exports = {

  // Compile default theme SCSS for development
  dev: {
    options: {
      sourcemap: true,
      sassDir: '<%= project.sass %>',
      cssDir: '<%= project.beCSSAssets %>',
      environment: 'development',
      specify: '<%= project.sass %>/manage.scss',
      force: true
    }
  },

  // Compile default theme SCSS for distribution
  dist: {
    options: {
      sourcemap: false,
      sassDir: '<%= project.sass %>',
      cssDir: '<%= project.beCSSAssets %>',
      environment: 'production',
      outputStyle: 'compressed',
      specify: '<%= project.sass %>/manage.scss',
      force: true
    }
  }
};
