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
    log(`${process.cwd()} > Compile JavaScript files\n${command}`);
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
  log(`generate icons sprite to ${outputFilePath}`);
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
 * @return {Promise} Promise resolving when SCSS files have been compiled
 */
async function compileScssFiles() {
  return new Promise((resolve, reject) => {
    const command = `npm run build:scss${environment !== 'production' ? '-development' : ''}`;
    log(`${process.cwd()} > Compile SCSS files`);
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
  const imagesDirectoryPath = './assets/be/images';
  const backOfficeClientPath = './app/client/admin';
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

  await compileScssFiles();
  await compileIconsSprite(
    resolveFilesPaths(iconsFilesPaths, path.join(backOfficeClientPath, 'compass/sass/sprites')),
    path.join(imagesDirectoryPath, 'sprite.png')
  );

  if (environment === 'production') {
    const outputDirectoryPath = './assets/be/js';
    const backOfficeClientDirectoryPath = path.join(backOfficeClientPath, 'js');

    await compileJavaScriptFiles(
      resolveFilesPaths(applicationConf.backOffice.scriptFiles.dev, backOfficeClientDirectoryPath),
      path.join(outputDirectoryPath, 'openveoManage.js')
    );
  }
}

main();
