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
