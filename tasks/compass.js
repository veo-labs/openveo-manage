'use strict';

// Compass / SASS compilation
// For more information about Grunt compass, have a look at https://www.npmjs.com/package/grunt-contrib-compass
module.exports = {

  // Build the back office stylesheet
  // Use grunt compass:admin --with-source-maps to add source maps generation
  admin: {
    options: {
      sourcemap: process.withSourceMaps,
      sassDir: '<%= project.sass %>',
      cssDir: '<%= project.beCSSAssets %>',
      environment: 'production',
      outputStyle: 'compressed',
      specify: '<%= project.sass %>/manage.scss',
      force: true
    }
  }

};
