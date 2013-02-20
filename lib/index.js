var assert = require('assert');

function _load(module, main) {
  module.require.main = main;
  module.load();
  module.loaded = true;
  return module.exports;
}

exports.createModuleSystem = function (cached, resolve, load) {
  var main = null;
  function Module(filename, parent) {
    var self = this;
    this.id = filename;
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
    this.require = this.require.bind(this);
    this.require.resolve = function (path) {
      return resolve(self, path);
    }
    this.filename = filename;
    this.exports = {};
    this.loaded = false;
    this.children = [];
  }
  Module.prototype.load = function () {
    assert(this.loaded === false);
    load(this, this.filename);
    return this.exports;
  }
  Module.prototype.require = function (modulePath) {
    var resolvedPath = resolve(this, modulePath);
    var cachedModule = cached(this, resolvedPath);
    if (cachedModule) return cachedModule.exports;
    var newModule = new Module(resolvedPath, module);
    return _load(newModule, main);
  }
  Module.runMain = function (path) {
    var resolvedPath = resolve(null, path);
    var module = new Module(resolvedPath, null);
    main = module;
    return _load(module, module);
  }
  return Module;
}