# Introduction

OpenVeo back end is written using AngularJS and SASS / Compass. SASS files need to be compiled to generate the CSS and JavaScript files can be minified and aggregated for better performance.

OpenVeo does not automatically compile SASS and JavaScript files for his plugins. Thus OpenVeo Manage compiles his own SASS and JavaScript files.

# Compiling for development

You can compile the plugin for development using:

    npm run build:development

You compile automatically the plugin when a file has changed using:

    npm run watch

# Compiling for production

You can compile the plugin for production using:

    npm run build

You'll find compiled CSS files in **assets/be/css** and compiled JavaScript files in **assets/be/js**.
