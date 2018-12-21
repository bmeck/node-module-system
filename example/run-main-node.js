'use strict';
require('./node-module-system.js')
   .createNodeModuleSystem()
   .runMain(require('path').resolve(process.argv[2]));
