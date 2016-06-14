# What's OpenVeo Plugin Boilerplate ?

OpenVeo Plugin Boilerplate is an [OpenVeo](https://github.com/veo-labs/openveo-core) plugin stater.

This boilerplate permits to improve OpenVeo plugin development and provide a global structure to easily create your own plugin with some examples.
There is help to [write a plugin](http://veo-labs.github.io/openveo-core/2.0.0/developers/write-plugin/) in the OpenVeo Core documentation.

# Structure

There is the general structure of a plugin

```

.
├── app
│   ├── client          
│   │   └── admin
│   │       └── ovModuleName
│   └── server
│       ├── controllers
│       ├── models
│       ├── providers
│       ├── Plugin.js
│       └── httpErrors.js
├── assets
│   ├── be
│   │   ├── css
│   │   ├── js
│   │   └── views
│   └── lib 
├── build
│   └── uglify
│       └── ovModuleName    
├── docs
├── i18n
├── migrations
├── tasks
├── tests
│   ├── client
│   └── server
├── .bowerrc
├── .eslintrc
├── CHANGELOG.md
├── Gruntfile.js
├── README.md       
├── bower.json        
├── conf.js    
├── index.js
├── mkdocs.yml   
└── package.json
```

# Features

* Many Grunt tasks to manage (compile, minify, generate documention) your code - Ready to production
* Angular.js to manage back-end and front-end
* A Node.js server with Express.js ready to start
* No JQuery dependency
* Responsive Design
* The Sass preprocessor and Bootstrap
* Unit tests and e2e tests
* All the features of the [OpenVeo Core](http://veo-labs.github.io/openveo-core/2.0.0/developers/back-end/) are available in your plugin like i18n translation, alerts, CRUD controllers to manage your entities, a logger ... 
* The possibility to override all functions inherited from OpenVeo Core
* A full documentation to get into the OpenVeo solution
