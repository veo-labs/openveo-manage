'use strict';

/**
 * @module manage
 */

/**
 * Holds the browsers' pilot singleton.
 *
 * @class browsersPilotManager
 * @static
 */

var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');

/**
 * The browsers' pilot.
 *
 * @property pilot
 * @type BrowserPilot
 * @private
 */
var pilot = null;

/**
 * Sets the browsers' pilot singleton.
 *
 * @method set
 * @static
 * @param {BrowserPilot} pilot The new browsers' pilot
 */
module.exports.set = function(newPilot) {
  if (newPilot && newPilot instanceof BrowserPilot)
    pilot = newPilot;
};

/**
 * Gets browsers' pilot singleton.
 *
 * @method get
 * @static
 * @return {BrowserPilot|Null} The browsers' pilot
 */
module.exports.get = function() {
  return pilot;
};

/**
 * Removes browsers' pilot singleton from the manager.
 *
 * @method remove
 * @static
 */
module.exports.remove = function() {
  pilot = null;
};
