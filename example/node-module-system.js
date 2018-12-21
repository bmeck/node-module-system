'use strict';
const { statSync, readFileSync } = require('fs');
const builtinModules = new Set(require('module').builtinModules);
const { createModuleSystem } = require('../lib/index.js');
const JSON_parse = JSON.parse;
const { join, normalize, extname, dirname, resolve } = require('path');

/**
 * Attempts to emulate Node.js loader
 */
exports.createNodeModuleSystem = function createNodeModuleSystem() {
  /**
   * @type {{[id: string]: VirtualModule}}
   */
  const cache = {
    __proto__: null,
  };
  /**
   * @type {Map<string, ReturnType<typeof ModuleSystem>>}
   */
  const builtins = new Map();

  /**
   * @param {VirtualModule} module
   * @param {string} resolvedPath
   * @returns {VirtualModule}
   */
  function load(module, resolvedPath) {
    const extension = extname(resolvedPath);
    const handler = extensions[extension] || extensions['.js'];
    module.require.extensions = extensions;
    module.require.cache = cache;
    cache[resolvedPath] = module;
    handler(module, resolvedPath);
    return module;
  }

  /**
   * @param {VirtualModule} module
   * @param {string} modulePath
   * @returns {string}
   */
  function resolveRequire(module, modulePath) {
    if (builtinModules.has(modulePath)) {
      return modulePath;
    }
    const isRelative = /^\.?\.?(\/|$)/.test(modulePath);
    let resolvedPath;
    if (isRelative) {
      resolvedPath = resolveFile(resolve(module ? dirname(module.filename) : process.cwd(), modulePath));
    } else {
      resolvedPath = resolveNodeModule(modulePath, dirname(module.filename));
    }
    if (resolvedPath) return resolvedPath;
    throw new Error('module ' + JSON.stringify(modulePath) + ' not found');
  }

  function resolveFileExtension(possibleFile) {
    let extension, stat;
    try {
      stat = statSync(possibleFile);
      if (stat.isFile()) return possibleFile;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    for (extension in extensions) {
      try {
        stat = statSync(possibleFile + extension);
        if (stat.isFile()) return possibleFile + extension;
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
    }
    return null;
  }

  function resolveFile(possibleFile) {
    let stat;
    // EXACT
    const foundFile = resolveFileExtension(possibleFile);
    if (foundFile) {
      return foundFile;
    }
    const dir = possibleFile;
    // INDEX?
    possibleFile = join(dir, 'index');
    foundFile = resolveFileExtension(possibleFile);
    if (foundFile) {
      return foundFile;
    }
    possibleFile = join(dir, 'package.json');
    try {
      stat = statSync(possibleFile);
      if (stat.isFile()) {
        const pkg = JSON_parse(readFileSync(possibleFile).toString());
        possibleFile = normalize(join(dir, pkg.main));
        // PACKAGE.MAIN?
        if (pkg.main) {
          possibleFile = normalize(join(dir, pkg.main));
          foundFile = resolveFileExtension(possibleFile);
          if (foundFile) {
            return foundFile;
          }
          // PACKAGE.MAIN INDEX?
          possibleFile = join(possibleFile, 'index');
        } else {
          // PACKAGE INDEX?
          possibleFile = normalize(join(dir, 'index'));
        }
        foundFile = resolveFileExtension(possibleFile);
        if (foundFile) {
          return foundFile;
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return null;
  }

  function resolveNodeModule(name, modulesFolder) {
    let olddir, stat;
    do {
      const possiblePackage = join(modulesFolder, 'node_modules');
      try {
        stat = statSync(possiblePackage);
        if (stat.isDirectory()) {
          const modulePath = resolveFile(
            join(modulesFolder, 'node_modules', name)
          );
          if (modulePath) return modulePath;
        }
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      olddir = modulesFolder;
      modulesFolder = dirname(modulesFolder);
    } while (modulesFolder !== olddir);
    return null;
  }

  function cached(module, modulePath) {
    if (builtinModules.has(modulePath)) {
      if (!builtins.has(modulePath)) {
        const internal = new ModuleSystem(modulePath, null);
        internal.exports = require(modulePath);
        internal.loaded = true;
        builtins.set(modulePath, internal);
      }
      return builtins.get(modulePath);
    }
    const cachedModule = cache[modulePath];
    if (cachedModule) {
      return cachedModule;
    }
    const resolvedPath = resolveRequire(module, modulePath);
    return cache[resolvedPath] || null;
  }

  const ModuleSystem = createModuleSystem(cached, resolveRequire, load);
  /**
   * @typedef {ReturnType<typeof ModuleSystem>} VirtualModule
   */
  /**
   * @typedef {(module: VirtualModule, filename: string) => void} ExtensionHandlerFunction
   */
  /**
   * @type {{[extname: string]: ExtensionHandlerFunction}}
   */
  const extensions = {
    __proto__: null,
    '.js'(module, filename) {
      const body = readFileSync(filename, 'utf8');
      const fn = new Function(
        '__filename',
        '__dirname',
        'require',
        'module',
        'exports',
        body
      );
      fn(filename, dirname(filename), module.require, module, module.exports);
    },
    '.json'(module, filename) {
      const body = readFileSync(filename, 'utf8');
      module.exports = JSON.parse(body);
    },
  };
  builtins.set('module', ModuleSystem);
  return ModuleSystem;
};
