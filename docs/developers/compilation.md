# Introduction

OpenVeo back end is written using AngularJS and SASS / Compass. SASS files need to be compiled to generate the CSS and JavaScript files can be minified and aggregated for better performance.

OpenVeo does not automatically compile SASS and JavaScript files for his plugins. Thus OpenVeo Plugin Boilerplate have to compile his own SASS and JavaScript files.

In order to manage those compilations, we use [Grunt](http://gruntjs.com/) - A Javascript task runner. Many tasks are already write, but you can write your own.
There are other tasks to launch [unit tests](/developers/unit-tests), [e2e tests](/developers/end-to-end-tests) or generate and publish documentation on Github pages.

# Compiling SASS files

You can compile the back end SASS files using the following command :

    grunt compass:dist

Or you can watch SASS files changes using the following command :

    grunt

# Compiling JavaScript files

You'll probably want to compile AngularJS files, in production, for better performance. You can do it using :

    grunt prod