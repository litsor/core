/* eslint-disable no-await-in-loop */
'use strict';

const globby = require('globby');

class Container {
  constructor() {
    this.filePatterns = [
      'classes/**/*.js'
    ];
    this.services = {
      Container: {
        service: Container,
        instance: this,
        singleton: true,
        require: []
      }
    };
  }

  async startup() {
    const include = require;
    const files = await globby(this.filePatterns);
    files.forEach(file => {
      const service = include(process.cwd() + '/' + file);
      const name = service.prototype.constructor.name;
      if (name && name !== 'Container') {
        this.services[name] = {
          service,
          instance: null,
          singleton: Boolean(service.singleton),
          require: service.require || []
        };
      }
    });
  }

  async shutdown() {
    const names = Object.keys(this.services);
    for (let i = 0; i < names.length; ++i) {
      const name = names[i];
      const instance = this.services[name].instance;
      if (instance && typeof instance.shutdown === 'function') {
        await instance.shutdown();
      }
    }
  }

  async getDependencies(require) {
    const dependencies = {};
    for (let i = 0; i < require.length; ++i) {
      const name = require[i];
      dependencies[name] = await this.get(name);
    }
    return dependencies;
  }

  async get(name) {
    if (typeof this.services[name] === 'undefined') {
      throw new TypeError('Unknown service ' + name);
    }
    const service = this.services[name];
    const Service = service.service;
    const params = await this.getDependencies(service.require);
    if (service.singleton) {
      if (service.instance) {
        return service.instance;
      }
      service.instance = new Service(params);
      if (typeof service.instance.startup === 'function') {
        await service.instance.startup();
      }
      return service.instance;
    }
    const instance = new Service(params);
    if (typeof instance.startup === 'function') {
      await instance.startup();
    }
    return instance;
  }

  set(name, instance) {
    this.services[name].instance = instance;
  }
}

Container.singleton = true;

module.exports = Container;
