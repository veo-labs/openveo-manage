# 4.0.0 / YYYY-MM-DD

## BREAKING CHANGES

- Drop support for NodeJS &lt; 12.4.0 and NPM &lt; 6.9.0

## DEPENDENCIES

- **async** has been upgraded from 2.1.4 to **3.2.0**
- **cookie** has been removed as it wasn't used for a long time
- **express** has been upgraded from 4.14.0 to **4.17.1**
- **interact.js** has been renamed into interactjs and upgraded from 1.2.6 to **1.9.7**
- **node-schedule** has been upgraded from 1.2.0 to **1.3.2**
- **perfect-scrollbar** has been upgraded from 0.6.12 to **1.5.0**
- **shortid** has been upgraded from 2.2.6 to **2.2.15**
- **chai** has been upgraded from 4.0.2 to **4.2.0**
- **chai-spies** has been upgraded from 0.7.1 to **1.0.0**
- **flightplan** has been upgraded from 0.6.17 to **0.6.20**
- **grunt** has been upgraded from 1.0.1 to **1.1.0**
- **grunt-cli** has been upgraded from 1.2.0 to **1.3.2**
- **grunt-contrib-compass** sub dependencies have been upgraded
- **grunt-contrib-uglify** has been upgraded from 2.0.0 to **4.0.1**
- **grunt-contrib-watch** has been upgraded from 1.0.0 to **1.1.0**
- **grunt-contrib-yuidoc** sub dependencies have been upgraded
- **grunt-eslint** has been upgraded from 19.0.0 to **22.0.0**
- **grunt-extends-config** has been upgraded from 0.9.5 to **0.9.7**
- **grunt-gh-pages** has been upgraded from 2.0.0 to **3.1.0**
- **grunt-karma** has been upgraded from 2.0.0 to **3.0.2**
- **grunt-mkdocs** has been upgraded from 0.2.0 to **1.0.1**
- **grunt-mocha-test** has been upgraded from 0.13.2 to **0.13.3**
- **grunt-spritesmith** has been upgraded from 6.3.1 to **6.8.0**
- **karma** has been upgraded from 1.3.0 to **4.4.1**
- **karma-chrome-launcher** has been upgraded from 2.0.0 to **3.1.0**
- **karma-firefox-launcher** has been upgraded from 1.0.0 to **1.3.0**
- **karma-ie-launcher** has been removed as no tests are performed on Internet Explorer
- **karma-phantomjs-launcher** has been upgraded from 1.0.2 to **1.0.4**
- **mocha** has been upgraded from 3.2.0 to **7.1.1**
- **mock-require** has been upgraded from 3.0.1 to **3.0.3**
- **pre-commit** sub dependencies have been upgraded
- **sinon** has been upgraded from 2.1.0 to **9.0.1**

# 3.0.0 / 2019-03-26

## BREAKING CHANGES

- OpenVeo Manage now requires OpenVeo Core >=8.0.0

## NEW FEATURES

- OpenVeo Manage does not use Bower anymore, it now uses NPM for both client and server dependencies

## BUG FIXES

- Fix "grunt remove:doc"

# 2.0.1 / 2018-10-16

## BUG FIXES

- Fix time and duration fields when planning a record. Fields weren't displayed anymore since OpenVeo Core 5.1.0
- Fix begin date picker when planning a record. It was possible to select a past date since OpenVeo Core 5.1.0
- Fix end date picker when planning a record. It was possible to select a date anterior to begin date since OpenVeo Core 5.1.0

# 2.0.0 / 2018-05-04

## BREAKING CHANGES

- OpenVeo Manage now requires OpenVeo Core 5.0.0
- Drop support for NodeJS &lt; 8.9.4 and NPM &lt; 5.6.0

## NEW FEATURES

- Add NPM npm-shrinkwrap.json file

# 1.1.0 / 2017-10-18

## NEW FEATURES

- Execute unit tests on Travis
- Some of the permissions in group "Other permissions" have been moved to other groups. "Access Manage page" permission and "Access Manage group detail page" have been moved to a new group "Manage".

## DEPENDENCIES

- **chai** has been upgraded from 3.5.0 to **4.0.2**

# 1.0.0 / 2017-05-04

Firt version of [OpenVeo](https://github.com/veo-labs/openveo-core) Manage plugin.
