#!/usr/bin/env node

/**
 * Builds back office client files.
 *
 * It needs to be run from project root directory.
 *
 * Usage:
 *
 * # Build only back office client SCSS files with source maps
 * # Same as `build development`
 * $ build
 * $ build development
 *
 * # Build back office client SCSS and JavaScript files for production
 * $ build production
 */

'use strict';

const {exec} = require('child_process');
const os = require('os');
const path = require('path');
const util = require('util');

const openVeoApi = require('@openveo/api');
const nanoid = require('nanoid').nanoid;

require('../processRequire.js');
const applicationConf = require('../conf.js');

const environment = process.argv[2];

/**
 * Logs given message to stdout with a prefix.
 *
 * @param {String} message the message to log
 */
function log(message) {
  console.log(`build > ${message}`);
}

/**
 * Compiles and concat JavaScript files.
 *
 * @param {Array} filesPaths The list of files paths to compile and concat
 * @param {String} outputPath The file output path
 * @return {Promise} Promise resolving when JavaScript files have been compiled
 */
async function compileJavaScriptFiles(filesPaths, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `npx uglifyjs -c -m -o ${outputPath} -- ${filesPaths.join(' ')}`;
    log(`${process.cwd()} > ${command}`);
    exec(command, {cwd: process.cwd()}, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

/**
 * Compiles back office client icons sprite.
 *
 * @return {Promise} Promise resolving when sprite has been generated
 */
function compileIconsSprite(iconsFilesPaths, outputFilePath) {
  return util.promisify(openVeoApi.imageProcessor.generateSpriteFreely)(
    iconsFilesPaths,
    outputFilePath,
    90,
    path.join(os.tmpdir(), nanoid())
  );
}

/**
 * Compiles back office client SCSS files.
 *
 * @param {String} scssDirectoryPath The path where to find SCSS files
 * @param {String} outputPath The destination directory path
 * @param {Boolean} [production] true to build for production, false otherwise
 * @return {Promise} Promise resolving when SCSS files have been compiled
 */
async function compileScssFiles(scssDirectoryPath, outputPath, production) {
  return new Promise((resolve, reject) => {
    const command = `compass compile -c ./compass.rb \
--force \
--sass-dir ${scssDirectoryPath} \
--css-dir ${outputPath} \
${production ? '-e production -s compressed --no-sourcemap' : ''}
`;
    log(`${process.cwd()} > ${command}`);
    exec(command, {cwd: process.cwd()}, (error, stdout, stderr) => {
      if (error) return reject(error);
      console.log(stdout);
      return resolve();
    });
  });
}

/**
 * Resolves given files paths with the given prefix.
 *
 * @param {Array} filesPaths The list of files paths to resolve
 * @return {Array} The list of resolved files paths
 */
function resolveFilesPaths(filesPaths, prefix) {
  return filesPaths.map((filePath) => {
    return path.join(prefix, filePath);
  });
}

/**
 * Builds back office JavaScript files.
 */
async function main() {
  const assetsPath = './assets';
  const buildPath = './build';
  const backDistPath = path.join(assetsPath, 'be');
  const backImagesDistPath = path.join(assetsPath, 'be/images');
  const backCssDistPath = path.join(backDistPath, 'css');
  const backSourcesPath = './app/client/admin';
  const backJsPath = path.join(backSourcesPath, 'js');
  const backScssPath = path.join(backSourcesPath, 'compass/sass');
  const backScssBuildPath = path.join(buildPath, 'scss');
  const backMainCssBuildPath = path.join(backScssBuildPath, 'manage.css');
  const backMainCssDistPath = path.join(backCssDistPath, 'manage.css');
  const backIconsSpriteDistPath = path.join(backImagesDistPath, 'sprite.png');
  const iconsFilesPaths = [
    'camera-disconnected.png',
    'camera-ko.png',
    'camera-ok.png',
    'device-disconnected.png',
    'device-ko.png',
    'device-ok.png',
    'device-starting.png',
    'mini-device.png',
    'screen-disconnected.png',
    'screen-ko.png',
    'screen-ok.png'
  ];

  log(`Copy back office SCSS files to ${backScssBuildPath}`);
  await util.promisify(openVeoApi.fileSystem.copy.bind(openVeoApi.fileSystem))(
    backScssPath,
    backScssBuildPath
  );

  log(`Compile back office client SCSS files into ${backCssDistPath}`);
  await compileScssFiles(backScssBuildPath, backScssBuildPath, environment === 'production');

  log(`Generate icons sprite to ${backIconsSpriteDistPath}`);
  await compileIconsSprite(
    resolveFilesPaths(iconsFilesPaths, path.join(backSourcesPath, 'compass/sass/sprites')),
    backIconsSpriteDistPath
  );

  if (environment === 'production') {
    const backOfficeClientDistPath = path.join(assetsPath, applicationConf.backOffice.scriptFiles.prod[0]);

    log(`Copy back office CSS files to ${backCssDistPath}`);
    await util.promisify(openVeoApi.fileSystem.copy.bind(openVeoApi.fileSystem))(
      backMainCssBuildPath,
      backMainCssDistPath
    );

    log(`Compile back office client JavaScript files to ${backOfficeClientDistPath}`);
    await compileJavaScriptFiles(
      resolveFilesPaths(applicationConf.backOffice.scriptFiles.dev, backJsPath),
      backOfficeClientDistPath
    );
  } else {
    log(`Copy back office CSS and SCSS files to ${backCssDistPath}`);
    await util.promisify(openVeoApi.fileSystem.copy.bind(openVeoApi.fileSystem))(
      backScssBuildPath,
      backCssDistPath
    );
  }
}

main();
