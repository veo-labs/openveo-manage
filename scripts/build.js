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

const {imageProcessor} = require('@openveo/api');
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
  return util.promisify(imageProcessor.generateSpriteFreely)(
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
  const imagesDirectoryPath = path.join(assetsPath, 'be/images');
  const backOfficeClientCssPath = path.join(assetsPath, 'be/css');
  const backOfficeClientPath = './app/client/admin';
  const backOfficeClientScssPath = path.join(backOfficeClientPath, 'compass/sass');
  const iconsSpriteDistPath = path.join(imagesDirectoryPath, 'sprite.png');
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

  log(`Compile back office client SCSS files into ${backOfficeClientCssPath}`);
  await compileScssFiles(backOfficeClientScssPath, backOfficeClientCssPath, environment === 'production');

  log(`Generate icons sprite to ${iconsSpriteDistPath}`);
  await compileIconsSprite(
    resolveFilesPaths(iconsFilesPaths, path.join(backOfficeClientPath, 'compass/sass/sprites')),
    iconsSpriteDistPath
  );

  if (environment === 'production') {
    const backOfficeClientDirectoryPath = path.join(backOfficeClientPath, 'js');
    const backOfficeClientDistPath = path.join(assetsPath, applicationConf.backOffice.scriptFiles.prod[0]);

    log(`Compile back office client JavaScript files to ${backOfficeClientDistPath}`);
    await compileJavaScriptFiles(
      resolveFilesPaths(applicationConf.backOffice.scriptFiles.dev, backOfficeClientDirectoryPath),
      backOfficeClientDistPath
    );
  }
}

main();
