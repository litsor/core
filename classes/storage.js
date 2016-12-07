'use strict';

const Crypto = require('crypto');

const _ = require('lodash');
const Bluebird = require('bluebird');
const Fs = Bluebird.promisifyAll(require('fs-extra'));

const ModelsCompiler = require('./models-compiler');
const Models = require('./models');
const Query = require('./query');

class Storage {
  constructor(options) {
    options = _.defaults(options, {
      databases: {},
      cacheDir: '/tmp/cache',
      modelsDir: 'models'
    });
    options.databases = _.defaults(options.databases, {
      internal: {}
    });
    options.databases.internal = _.defaults(options.databases.internal, {
      engine: 'redis',
      host: 'redis',
      port: 6379,
      prefix: ''
    });

    this.options = options;

    this.generateModels();
  }

  generateModels() {
    Fs.ensureDirSync(this.options.cacheDir);
    const cached = Fs.readdirSync(this.options.cacheDir);
    const dir = this.options.modelsDir;
    const compiler = new ModelsCompiler();
    const items = {};
    Fs.readdirSync(dir).forEach(file => {
      if (!file.match(/^.+\.yml$/)) {
        return;
      }
      const inputFile = `${dir}/${file}`;
      const contents = Fs.readFileSync(inputFile);
      const hash = Crypto.createHash('sha1').update(contents).digest('hex');
      const outputFile = this.options.cacheDir + '/' + hash + '.js';
      const name = file.match(/^(.+)\.yml$/)[1];
      if (cached.indexOf(`${hash}.js`) < 0) {
        compiler.generate(inputFile, outputFile);
      }
      const load = require;
      items[name] = load(outputFile);
    });
    this.models = new Models(items, this.options.databases);
  }

  query(query, context, args) {
    return new Query(this.models, query, context, args).execute();
  }
}

module.exports = Storage;
