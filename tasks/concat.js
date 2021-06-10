'use strict';

var applicationConf = process.requireManage('conf.js');

/**
 * Gets the list of minified JavaScript files from the given list of files.
 *
 * It will just replace ".js" by ".min.js".
 *
 * @param Array files The list of files
 * @return Array The list of minified files
 */
function getMinifiedJSFiles(files) {
  var minifiedFiles = [];
  files.forEach(function(path) {
    minifiedFiles.push('<%= project.uglify %>/' + path.replace('.js', '.min.js').replace('/manage/', ''));
  });
  return minifiedFiles;
}

module.exports = {
  'admin-js': {

    // Concatenate all back office JavaScript files
    src: getMinifiedJSFiles(applicationConf['backOffice']['scriptFiles']['dev']),

    // Concatenate all files into openveoManage.js
    dest: '<%= project.beJSAssets %>/openveoManage.js'

  }
};
