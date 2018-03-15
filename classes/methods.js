'use strict';

const {resolve} = require('path');
const globby = require('globby');
const Watch = require('watch');
const reload = require('require-reload')(require);

class Methods {
  constructor({Config, MethodTester, Container}) {
    this.config = Config;
    this.methodTester = MethodTester;
    this.container = Container;
    this.methods = {};
  }

  async readFiles(changedFile) {
    const files = await globby('methods/**/*.js');
    const output = {};
    const promises = [];
    files.forEach(file => {
      const filename = resolve(file);
      const name = filename.match(/\/([^/]+)\.js$/)[1];
      try {
        this.methods[name] = reload(filename);
        if (file === changedFile) {
          promises.push(this.methodTester.test(this.methods[name]));
        }
      } catch (err) {
        console.log(`Unable to load ${name}: ${err.message}`);
      }
    });
    await Promise.all(promises);
    return output;
  }

  async startup() {
    await this.readFiles();
    if (this.config.get('/reload', false)) {
      let first = true;
      Watch.watchTree('methods', changedFile => {
        if (first) {
          first = false;
          return;
        }
        console.log('Reloading methods');
        this.readFiles(changedFile);
      });
    }
  }

  async shutdown() {
    if (this.config.get('/reload', false)) {
      Watch.unwatchTree('methods');
    }
  }

  getNames() {
    return Object.keys(this.methods);
  }

  async get(name) {
    if (typeof this.methods[name] === 'undefined') {
      throw new TypeError(`No method found with name "${name}"`);
    }
    return this.methods[name];
  }

  async execute(name, input) {
    const method = await this.get(name);
    const dependencies = {};
    const promises = (method.requires || []).map(name => {
      return this.container.get(name);
    });
    (await Promise.all(promises)).forEach((item, index) => {
      dependencies[method.requires[index]] = item;
    });
    return method.execute({...(method.defaults || {}), ...input}, dependencies);
  }
}

Methods.singleton = true;
Methods.require = ['Config', 'MethodTester', 'Container'];

module.exports = Methods;
