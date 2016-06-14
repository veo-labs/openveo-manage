'use strict';

// For more information about Grunt gh-pages, have a look at https://www.npmjs.com/package/grunt-gh-pages
module.exports = {

  // Plugin documentation
  doc: {
    options: {
      base: 'site',
      message: 'Auto-generated documentation for version <%= pkg.version %>',
      push: true,
      add: true
    },
    src: '**/*'
  }

};
