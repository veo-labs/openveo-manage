'use strict';

// Launch unit tests
// For more information about Grunt mochaTest, have a look at https://www.npmjs.com/package/grunt-mocha-test
module.exports = {

  // Launch server unit tests
  server: {
    options: {
      reporter: 'spec'
    },
    src: [
      'tests/server/init.js',
      'tests/server/controllers/*.js',
      'tests/server/manageables/*.js',
      'tests/server/providers/*.js',
      'tests/server/pilot/*.js',
      'tests/server/managers/*.js',
      'tests/server/migrations/*.js'
    ]
  }

};
