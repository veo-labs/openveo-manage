#!/usr/bin/env node

/**
 * Builds back office client files.
 *
 * It needs to be run from project root directory.
 *
 * Usage:
 *
 * $ build
 */

'use strict';

const os = require('os');
const path = require('path');
const util = require('util');
const nanoid = require('nanoid').nanoid;
const {imageProcessor} = require('@openveo/api');

/**
 * Logs given message to stdout with a prefix.
 *
 * @param {String} message the message to log
 */
function log(message) {
  console.log(`build > ${message}`);
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

  await compileIconsSprite(
    resolveFilesPaths(iconsFilesPaths, path.join(backOfficeClientPath, 'compass/sass/sprites')),
    path.join(imagesDirectoryPath, 'sprite.png')
  );
}

main();
