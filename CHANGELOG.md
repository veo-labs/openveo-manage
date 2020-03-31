# 4.0.0 / YYYY-MM-DD

## BREAKING CHANGES

- Drop support for NodeJS &lt; 12.4.0 and NPM &lt; 6.9.0

## DEPENDENCIES

- **async** has been upgraded from 2.1.4 to **3.2.0**
- **cookie** has been upgraded from 0.3.1 to **0.4.0**
- **express** has been upgraded from 4.14.0 to **4.17.1**
- **interact.js** has been renamed into interactjs and upgrade from 1.2.6 to **1.9.7**
- **node-schedule** has been upgraded from 1.2.0 to **1.3.2**
- **perfect-scrollbar** has been upgraded from 0.6.12 to **1.5.0**
- **shortid** has been upgraded from 2.2.6 to **2.2.15**
- **chai** has been upgraded from 4.0.2 to **4.2.0**
- **chai-spies** has been upgraded from 0.7.1 to **1.0.0**
- **flightplan** has been upgraded from 0.6.17 to **0.6.20**
- **grunt** has been upgraded from 1.0.1 to **1.1.0**
- **grunt-cli** has been upgraded from 1.2.0 to **1.3.2**

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
