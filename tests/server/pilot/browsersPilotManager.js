'use strict';

var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var browsersPilotManager = process.requireManage('app/server/browsersPilotManager.js');
var BrowserPilot = process.requireManage('app/server/BrowserPilot.js');
var assert = chai.assert;

chai.should();
chai.use(spies);

// browsersPilotManager.js
describe('browsersPilotManager', function() {

  afterEach(function() {
    browsersPilotManager.remove();
  });

  it('should be able to set / get the browsers\' pilot for the whole application', function() {
    var expectedPilot = new BrowserPilot(
      new openVeoApi.emitters.AdvancedEmitter(),
      new openVeoApi.socket.SocketNamespace()
    );
    browsersPilotManager.set(expectedPilot);

    assert.strictEqual(browsersPilotManager.get(), expectedPilot);
  });

  it('should not be able to set something which is not a BrowserPilot', function() {
    browsersPilotManager.set({});
    assert.isNull(browsersPilotManager.get());
  });

});
