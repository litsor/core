"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const Fs = Promise.promisifyAll(require('fs-extra'));
const Crypto = require('crypto');

const ModelsCompiler = require(__dirname + '/ModelsCompiler');
const Models = require(__dirname + '/Models');
const Query = require(__dirname + '/Query');

var models = null;

class Storage {
  constructor(options) {
    // Fill in default options.
    options = _.defaults(options, {
      rethinkdb: {},
      redis: {},
      cacheDir: '/tmp/cache',
      modelsDir: 'models',
      pluginsDir: 'plugins'
    });
    options.redis = _.defaults(options.redis, {
      host: 'localhost',
      port: 6379
    });
    options.rethinkdb = _.defaults(options.rethinkdb, {
      host: 'localhost',
      port: 28015
    });
    this.options = options;
    
    this.generateModels();
  }
  
  generateModels() {
    if (models === null) {
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
      models = new Models(items);
    }
    this.models = models;
  }
  
  query(query, context, args) {
    return new Query(models, query, context, args).execute();
  }
}

module.exports = Storage;
