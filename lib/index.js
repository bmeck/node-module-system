'use strict';
const assert = require('assert');

/**
 * @typedef {ReturnType<ReturnType<createModuleSystem>>} VirtualModule
 */

/**
 * helper that can be shared amongst multiple module systems
 * @param {VirtualModule} module 
 * @param {boolean} main
 */
function _load(module, main) {
  module.require.main = main;
  module.load();
  module.loaded = true;
  return module.exports;
}

/**
 * Creates a bare scaffold for a module system based upon how CJS works
 * in Node.js
 * @param {(VirtualModule, string) => VirtualModule | null} cached 
 * @param {(string) => string} resolve 
 * @param {(VirtualModule) => void} load 
 */
function createModuleSystem(cached, resolve, load) {
  /**
   * A shared state reference to the current main module
   * @type {Module | null}
   */
  var main = null;
  /**
   * @typedef {(string) => any} RequireFunction
   * @param {string} modulePath
   * @property {(string) => string} resolve
   */
  /**
   * @class
   * @param {string} filename 
   * @param {Module | null} parent
   */
  function Module(filename, parent) {
    let self = this;
    /**
     * @type {string}
     */
    this.id = filename;
    /**
     * managed by module system except for roots
     * @type {Module | null}
     */
    this.parent = parent;
    if (parent && parent.children) {
      parent.children.push(this);
    }
    /**
     * @type {RequireFunction}
     */
    this.require = this.require.bind(this);
    this.require.resolve = function (path) {
      return resolve(self, path);
    };
    /**
     * alias for id
     * @type {string}
     */
    this.filename = filename;
    /**
     * often replaced during load()
     * @type {any}
     */
    this.exports = {};
    /**
     * managed by module system
     * @type {boolean}
     */
    this.loaded = false;
    /**
     * managed by module system
     * @type {Module[]}
     */
    this.children = [];
  }
  /**
   * Attempts to load this module if it has not been
   * loaded already. Modules that have already been
   * loaded are expected to fail loading multiple times.
   * 
   * Note: the CJS workflow for errors during load() is
   * to remove the id from the cache
   */
  Module.prototype.load = function () {
    assert(this.loaded === false);
    load(this, this.filename);
    return this.exports;
  }
  /**
   * Loads a module relative to this Module and returns
   * that module's exports.
   * @param {string} modulePath
   * @returns {any}
   */
  Module.prototype.require = function (modulePath) {
    const resolvedPath = resolve(this, modulePath);
    const cachedModule = cached(this, resolvedPath);
    if (cachedModule) return cachedModule.exports;
    const newModule = new Module(resolvedPath, this);
    return _load(newModule, main);
  }
  /**
   * Runs the entrypoint to the Module graph.
   * 
   * This may be run multiple times, but will not
   * update the shared entrypoint binding for existing
   * modules. All new modules will use the entrypoint
   * for require.main.
   * 
   * @param {string} path
   * @returns {Module}
   */
  Module.runMain = function (path) {
    const resolvedPath = resolve(null, path);
    const newModule = new Module(resolvedPath, null);
    main = newModule;
    return _load(newModule, newModule);
  }
  return Module;
}
exports.createModuleSystem = createModuleSystem;
