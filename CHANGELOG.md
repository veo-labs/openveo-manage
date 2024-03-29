# 6.1.0 / 2022-04-19

## NEW FEATURES

- Add a new message to the historic of all devices in a group when the group is removed
- Add a new message to group historic when a device belonging to the group is removed

# 6.0.1 / 2021-12-21

## BUG FIXES

- Fix scrollbar which wasn't always working in "Action", "Detail" and "History" tabs of the control panel. This issue first appeared in version 4.0.0.
- Fix device / group selected background color which wasn't accessible

# 6.0.0 / 2021-11-19

## BREAKING CHANGES

- No longer tested on NodeJS &lt; 16.3.0 and NPM &lt; 7.15.1
- Drop support for OpenVeo Core &lt; 10.0.0
- Remove continuous integration with Travis

## NEW FEATURES

- Improve code documentation by replacing Yuidoc by JSDoc

## DEPENDENCIES

- **chai** has been upgraded from 4.2.0 to **4.3.4**
- **eslint** has been upgraded from 22.0.0 to **23.0.0**
- **flightplan** has been removed
- **grunt** has been removed
- **grunt-cli** has been removed
- **grunt-contrib-compass** has been removed
- **grunt-contrib-concat** has been removed
- **grunt-contrib-uglify** has been removed
- **grunt-contrib-watch** has been removed
- **grunt-contrib-yuidoc** has been removed
- **grunt-eslint** has been removed
- **grunt-extend-config** has been removed
- **grunt-gh-pages** has been removed
- **grunt-init** has been removed
- **grunt-mkdocs** has been removed
- **grunt-mocha-test** has been removed
- **grunt-spritesmith** has been removed
- **interactjs** has been upgraded from 1.9.7 to **1.10.11**
- **mocha** has been upgraded from 7.1.1 to **9.1.1**
- **node-schedule** has been upgraded from 1.3.2 to **2.0.0**
- **perfect-scrollbar** has been upgraded from 1.5.0 to **1.5.2**
- **shortid** has been replaced by nanoid
- **sinon** has been upgraded from 9.0.1 to **11.1.2**
- **yuidoc-theme-blue** has been removed

# 5.0.1 / 2020-12-11

## BUG FIXES

- Fix recurrent (daily or weekly) schedules which weren't stopping on last occurrence

# 5.0.0 / 2020-11-19

## BREAKING CHANGES

- OpenVeo Manage now requires OpenVeo Devices API >= 3.1.0

## NEW FEATURES

- Add the possibility to add a name to a record
- Add support for weekly schedules in addition to daily schedules

## BUG FIXES

- Fix sort arrows on planning and history tables which were overlapping headers
- Remove focus outline on buttons and links of the panel
- Remove horizontal scrollbar sometimes appearing on the panel
- Disable start button when no encoder preset has been found, the encoder can't start without a preset
- Use localized date and time for scheduled record begin / end date time
- Fix undetected collision on daily records dates if the record was starting on a day and terminate the next day
- Remove group when one of the two remaining devices is removed

# 4.0.0 / 2020-05-04

## BREAKING CHANGES

- Drop support for NodeJS &lt; 12.4.0 and NPM &lt; 6.9.0

## BUG FIXES

- Fix JavaScript error when clicking on a group after disconnecting all its devices
- Fix group detail which wasn't updated when removing one of its devices

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
