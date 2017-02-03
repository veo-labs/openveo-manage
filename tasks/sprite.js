'use strict';

// Generate sprites
// For more information about Grunt spritesmith, have a look at https://www.npmjs.com/package/grunt-spritesmith
module.exports = {

  // Icons
  icons: {
    src: '<%= project.sass %>/sprites/*.png',
    dest: '<%= project.beAssets %>/images/sprite.png',
    destCss: '<%= project.sass %>/modules/_sprite.scss',
    imgPath: '../images/sprite.png',
    cssFormat: 'scss'
  }

};
