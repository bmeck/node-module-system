'use strict';
const virtualModuleSystem = require('./node-module-system.js')
   .createNodeModuleSystem();
// no cheating
// ensure we never populate external cache
Object.freeze(require.cache);
// to see it get angry, uncomment the following
// try {
//    require('../package.json')
// } catch (e) {
//    console.error(e)
// }
virtualModuleSystem.runMain(require('path').resolve(process.argv[2]));
