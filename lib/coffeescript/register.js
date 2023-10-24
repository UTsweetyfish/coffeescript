// Generated by CoffeeScript 2.7.0
(function() {
  var CoffeeScript, Module, binary, cacheSourceMaps, child_process, ext, findExtension, fork, getRootModule, helpers, i, len, loadFile, nodeSourceMapsSupportEnabled, patchStackTrace, path, ref, ref1;

  CoffeeScript = require('./');

  child_process = require('child_process');

  helpers = require('./helpers');

  path = require('path');

  ({patchStackTrace} = CoffeeScript);

  // Check if Node's built-in source map stack trace transformations are enabled.
  nodeSourceMapsSupportEnabled = (typeof process !== "undefined" && process !== null) && (process.execArgv.includes('--enable-source-maps') || ((ref = process.env.NODE_OPTIONS) != null ? ref.includes('--enable-source-maps') : void 0));

  if (!(Error.prepareStackTrace || nodeSourceMapsSupportEnabled)) {
    cacheSourceMaps = true;
    patchStackTrace();
  }

  // Load and run a CoffeeScript file for Node, stripping any `BOM`s.
  loadFile = function(module, filename) {
    var js, options;
    options = module.options || getRootModule(module).options || {};
    // Currently `CoffeeScript.compile` caches all source maps if present. They
    // are available in `getSourceMap` retrieved by `filename`.
    if (cacheSourceMaps || nodeSourceMapsSupportEnabled) {
      options.inlineMap = true;
    }
    js = CoffeeScript._compileFile(filename, options);
    return module._compile(js, filename);
  };

  // If the installed version of Node supports `require.extensions`, register
  // CoffeeScript as an extension.
  if (require.extensions) {
    ref1 = CoffeeScript.FILE_EXTENSIONS;
    for (i = 0, len = ref1.length; i < len; i++) {
      ext = ref1[i];
      require.extensions[ext] = loadFile;
    }
    // Patch Node's module loader to be able to handle multi-dot extensions.
    // This is a horrible thing that should not be required.
    Module = require('module');
    findExtension = function(filename) {
      var curExtension, extensions;
      extensions = path.basename(filename).split('.');
      if (extensions[0] === '') {
        // Remove the initial dot from dotfiles.
        extensions.shift();
      }
      // Start with the longest possible extension and work our way shortwards.
      while (extensions.shift()) {
        curExtension = '.' + extensions.join('.');
        if (Module._extensions[curExtension]) {
          return curExtension;
        }
      }
      return '.js';
    };
    Module.prototype.load = function(filename) {
      var extension;
      this.filename = filename;
      this.paths = Module._nodeModulePaths(path.dirname(filename));
      extension = findExtension(filename);
      Module._extensions[extension](this, filename);
      return this.loaded = true;
    };
  }

  // If we're on Node, patch `child_process.fork` so that Coffee scripts are able
  // to fork both CoffeeScript files, and JavaScript files, directly.
  if (child_process) {
    ({fork} = child_process);
    binary = require.resolve('../../bin/coffee');
    child_process.fork = function(path, args, options) {
      if (helpers.isCoffee(path)) {
        if (!Array.isArray(args)) {
          options = args || {};
          args = [];
        }
        args = [path].concat(args);
        path = binary;
      }
      return fork(path, args, options);
    };
  }

  // Utility function to find the `options` object attached to the topmost module.
  getRootModule = function(module) {
    if (module.parent) {
      return getRootModule(module.parent);
    } else {
      return module;
    }
  };

}).call(this);