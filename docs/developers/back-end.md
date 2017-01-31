# Introduction

The plugin back end pages are loaded by [OpenVeo](https://github.com/veo-labs/openveo-core).

As expected by OpenVeo, a plugin defines a module **ov.plugin-name**.

# Modules

## Main module (**ov.plugin-name**)

The following script presents the global structure of the main module:

```javascript
'use strict';

(function(angular) {

  var app = angular.module('ov.boiler', [
    'ov.i18n' // Core module translation
  ]);

  /*
   * Configures the ov.boiler application by adding new routes.
   */
  app.config(['$routeProvider', function($routeProvider) {

    // Add route /boiler/list with authentication.
    // Also retrieve the list of boilers
    $routeProvider.when('/boiler/list', {
      templateUrl: '/boiler/be/views/list.html',
      controller: 'BoilerController',
      title: 'BOILER.LIST.PAGE_TITLE',
      access: 'boiler-access-list', // permission initialize in conf.js
      resolve: {
        boilers: ['boilerService', function(boilerService) {
          return boilerService.loadBoilers();
        }]
      }
    });
  }]);

})(angular);
```


In order to have a functional and secure route you have to configure some informations in the conf.js file:

```javascript
'use strict';

module.exports = {
  routes: {
    public: { // all your public routes go there
    },
    private: { // Define a private action to a route
      'get /getBoilers': 'app/server/controllers/BoilerController.getBoilersAction'
    },
    ws: { // Your web-service routes
    }
  },
  entities: { // Define your entity controller
    boilers: 'app/server/controllers/BoilerController'
  },
  permissions: [ // Create a route permission
    {
      id: 'boiler-access-list',
      name: 'BOILER.PERMISSIONS.ACCESS_LIST',
      paths: [
        'get /boiler/getBoilers'
      ]
    }
  ],
  backOffice: {
    menu: [ // Generate an entry menu in the back-end
      {
        weight: -50,
        label: 'BOILER.MENU.BOILER',
        subMenu: [
          {
            label: 'BOILER.MENU.LIST',
            path: 'boiler/list',
            permission: 'boiler-access-list-page'
          }
        ]
      }
    ],
    scriptLibFiles: { // Insert here the javascript libriries you want to load
      base: [],
      dev: [],
      prod: []
    },
    scriptFiles: { // Insert here your custom javascript files
      base: [],
      dev: [ // The files you will load in dev mode, minified with a Grunt task
        '/boiler/ovBoiler/BoilerApp.js',
        '/boiler/ovBoiler/BoilerController.js',
        '/boiler/ovBoiler/BoilerService.js'
      ],
      prod: [ // The file you will load in prod mode, minified/compiled with a Grunt task
        '/boiler/be/js/openveoBoiler.js'
      ]
    },
    cssFiles: [ // Your css file generated with a Grunt task
      '/boiler/be/css/boiler.css'
    ]
  },
};
```
