var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var browserify = require('browserify');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable;
var babelify = require("babelify");
// var shim = require('browserify-shim');

const PLUGIN_NAME = 'gulp-module-bundle';

function arrayStream(items) {
  var index = 0;
  var readable = new Readable({ objectMode: true });
  readable._read = function() {
    if(index < items.length) {
      readable.push(items[index]);
      index++;
    } else {
      readable.push(null);
    }
  };
  return readable;
}

function wrapWithPluginError(originalError){
  var message, opts;

  if ('string' === typeof originalError) {
    message = originalError;
  } else {
    // Use annotated message of ParseError if available.
    // https://github.com/substack/node-syntax-error
    message = originalError.annotated || originalError.message;
    // Copy original properties that PluginError uses.
    opts = {
      name: originalError.name,
      stack: originalError.stack,
      fileName: originalError.fileName,
      lineNumber: originalError.lineNumber
    };
  }

  return new PluginError(PLUGIN_NAME, message, opts);
}

module.exports = function(bsConf, bbConf){
  bsConf = bsConf || {};
  bbConf = bbConf || {};

  function transform(file, enc, cb){
    var self = this;

    if (file.isStream()) {
      self.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported'));
      return cb();
    }

    if(file.isDirectory()){
      return cb();
    }

    if(file.isNull()) {
      bsConf.entries = file.path;
    }

    if(file.isBuffer()) {
      bsConf.entries = arrayStream([file.contents]);
    }

    bsConf.basedir = path.dirname(file.path);

    // nobuiltins option
    if (!bsConf.builtins && bsConf.nobuiltins) {
      var nob = bsConf.nobuiltins;
      var builtins = require('./node_modules/browserify/lib/builtins.js');
      nob = 'string' == typeof nob ? nob.split(' ') : nob;

      for (var i = 0; i < nob.length; i++) {
        delete builtins[nob[i]];
      };

      bsConf.builtins = builtins;
    }

    var bundler = browserify(bsConf)
                     .transform(babelify.configure(bbConf));

    bundler.on('error', function(err) {
      self.emit('error', wrapWithPluginError(err));
      cb();
    });

    [
      'add',
      'require',
      'external',
      'ignore',
      'exclude',
      'plugin'
    ].forEach( function(method) {
      if (!bsConf[method]) return;
      [].concat(bsConf[method]).forEach(function (args) {
        bundler[method].apply(bundler, [].concat(args));
      });
    });

    var bStream = bundler.bundle(function(err, buf){
      if(err) {
        self.emit('error', wrapWithPluginError(err));
      } else {
        file.contents = buf;
        self.push(file);
      }
      cb();
    });
  }

  return through.obj(transform);
};
