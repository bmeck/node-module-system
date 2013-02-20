# Node Module System

## What?

A means to create wrappers to common JS systems.

## Why?

1. Emulating and wrapping common JS modules with more complex things like `node_modules` and `package.json` support is annoying.
2. Override builtins for w/e common JS you are using.
3. Bundling Stuff Together (Browserify, Node2Exec, etc.)

## API

```
var createModuleSystem = require('module-system').createModuleSystem;
var ModuleSystem = createModuleSystem(cached,resolve,load);
ModuleSystem.runMain('main.js');
```

### createModuleSystem(cached, resolve, load) => Module constructor

#### cached(parentModule, resolvedPath) => cachedModule

Tell the module system if this should be loaded from a cache

#### resolve(contextModule, path) => resolvedPath

Take a context from an existing module and resolve the path relative to it.
If there is no context such as with `runMain`, the module argument will be null.

#### load(contextModule, resolvedPath) => void

Attach anything needed as contextModule.exports during this.

### Module constructor.runMain(path)

Bootstraps an environment and loads up the main module.

## LICENSE

The MIT License (MIT)

Copyright (c) 2013 Bradley Meck

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.