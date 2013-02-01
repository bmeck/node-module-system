var fs = require('fs');
var path = require('path');
var createModuleSystem = require('../lib/index.js').createModuleSystem;

var absolute = function (path) { return normalize(path) == path };
var join = path.join;
var normalize = path.normalize;
var extname = path.extname;
var dirname = path.dirname;

exports.createNodeModuleSystem = function createNodeModuleSystem() {
   function load(module, resolvedPath) {
     var extension = extname(resolvedPath);
     var handler = extensions[extension] || extensions['.js'];
     module.require.extensions = extensions;
     module.require.cache = cache;
     cache[resolvedPath] = module;
     handler(module, resolvedPath);
     return module;
   }
   
   function resolve(module, modulePath) { 
     var isFile = /^(?:\.\,?|\/)/.test(modulePath);
     var resolvedPath;
     if (isFile) {
       resolvedPath = resolveFile(path.resolve(dirname(module.filename), modulePath));
     }
     else {
       resolvedPath = resolveNodeModule(modulePath, dirname(module.filename));
     }
     if (resolvedPath) return resolvedPath;
     throw new Error('module '+JSON.stringify(modulePath)+' not found');
   }
   
   function resolveFileExtension(possibleFile) {
      var extension, stat;
      try {
        stat = fs.statSync(possibleFile);
        if (stat.isFile()) return possibleFile;
      }
      catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      for (extension in extensions) {
         try {
           stat = fs.statSync(possibleFile+extension);
           if (stat.isFile()) return possibleFile+extension;
         }
         catch (e) {
           if (e.code !== 'ENOENT') throw e;
         }
      }
      return null;
   }
   
   function resolveFile(possibleFile) {
     var stat;
     // EXACT
     var foundFile = resolveFileExtension(possibleFile);
     if (foundFile) {
       return foundFile;
     }
     var dir = possibleFile;
     // INDEX?
     possibleFile = path.join(dir, 'index');
     foundFile = resolveFileExtension(possibleFile);
     if (foundFile) {
       return foundFile;
     }
     possibleFile = path.join(dir, 'package.json');
     try {
       stat = fs.statSync(possibleFile);
       if (stat.isFile()) {
         var pkg = JSON.parse(fs.readFileSync(possibleFile).toString());
         possibleFile = path.normalize(path.join(dir, pkg.main));
         // PACKAGE.MAIN?
         if (pkg.main) {
           possibleFile = path.normalize(path.join(dir, pkg.main));
           foundFile = resolveFileExtension(possibleFile);
           if (foundFile) {
             return foundFile;
           }
           // PACKAGE.MAIN INDEX?
           possibleFile = path.join(possibleFile, 'index');
         }
         else {
            // PACKAGE INDEX?
            possibleFile = path.normalize(path.join(dir, 'index'));
         }
         foundFile = resolveFileExtension(possibleFile);
         if (foundFile) {
           return foundFile;
         }
       }
     }
     catch (e) {
       if (e.code !== 'ENOENT') throw e;
     }
     return null;
   }
   
   function resolveNodeModule(name, modulesFolder) {
      var olddir, stat;
      do {
         var possiblePackage = path.join(modulesFolder, 'node_modules');
         try {
            stat = fs.statSync(possiblePackage);
            if (stat.isDirectory()) {
               var modulePath = resolveFile(path.join(modulesFolder, 'node_modules', name));
               if (modulePath) return modulePath;
            }
         }
         catch (e) {
            if (e.code !== 'ENOENT') throw e;
         }
         olddir = modulesFolder;
         modulesFolder = path.dirname(modulesFolder);
      } while (modulesFolder !== olddir);
      return null;
   }
   
   function cached(module, modulePath) {
      var cachedModule = builtins[modulePath] || cache[modulePath];
      if (cachedModule) {
         return cachedModule;
      }
      var resolvedPath = resolve(module, modulePath);
      return builtins[resolvedPath] || cache[resolvedPath] || null;
   }

   var builtins = {
      net: require('net'),
      http: require('http'),
      util: require('util'),
      stream: require('stream'),
      querystring: require('querystring'),
      https: require('https'),
      crypto: require('crypto'),
      tls: require('tls'),
      events: require('events'),
      assert: require('assert'),
      path: require('path'),
      fs: require('fs'),
      url: require('url')
   };
   var cache = {};
   
   var extensions = {
     '.js': function (module, filename) {
       var buffer = fs.readFileSync(filename);
       var fn = new Function('__filename', '__dirname', 'require', 'module', 'exports', buffer.toString());
       fn(filename, dirname(filename), module.require, module, module.exports);
     },
     '.json': function () {
       var buffer = fs.readFileSync(filename);
       module.exports = JSON.parse(buffer.toString());
     }
   };
   
   var ModuleSystem = createModuleSystem(cached, resolve, load);
   builtins.module = ModuleSystem;
   return ModuleSystem;
}