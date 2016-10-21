"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const Fs = Promise.promisifyAll(require('fs-extra'));
const Crypto = require('crypto');

const ModelsCompiler = require(__dirname + '/ModelsCompiler');
const Models = require(__dirname + '/Models');
const Query = require(__dirname + '/Query');

class Storage {
  constructor(options) {
    // Fill in default options.
    options = _.defaults(options, {
      databases: {},
      cacheDir: '/tmp/cache',
      modelsDir: 'models',
      pluginsDir: 'plugins'
    });
    options.databases = _.defaults(options.databases, {
      internal: {
        engine: 'redis',
        host: 'redis',
        port: 6379
      }
    });
    this.options = options;
    
    this.generateModels();
  }
  
  generateModels() {
    Fs.ensureDirAsync(this.options.cacheDir);
    let cached = Fs.readdirSync(this.options.cacheDir);
    let dir = this.options.modelsDir;
    let compiler = new ModelsCompiler();
    let items = {};
    Fs.readdirSync(dir).forEach((file) => {
      let inputFile = `${dir}/${file}`;
      let contents = Fs.readFileSync(inputFile);
      let hash = Crypto.createHash('sha1').update(contents).digest('hex');
      let outputFile = this.options.cacheDir + '/' + hash + '.js';
      let name = file.match(/^(.+)\.yml$/)[1];
      if (cached.indexOf(`${hash}.js`) < 0) {
        compiler.generate(inputFile, outputFile);
      }
      items[name] = require(outputFile);
    });
    this.models = new Models(items, this.options.databases);
  }
  
  query(query, context, args) {
    return new Query(this.models, query, context, args).execute();
  }
}

module.exports = Storage;
