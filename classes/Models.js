"use strict";

const _ = require('lodash');
const globby = require('globby');

const Model = require(__dirname + '/Model.js');

class Models {
  constructor(models) {
    this.models = models;
    this.engines = {};
    this.instances = {};
    this.plugins = {};
    this.pluginFields = {};
    
    this.ready = new Promise((resolve, reject) => {
      globby([__dirname + '/../engines/*.js']).then((files) => {
        files.forEach((file) => {
          let name = file.match(/\/([^\/]+)\.js$/)[1];
          this.engines[name] = require(file);
        });
        Object.keys(models).forEach((name) => {
          let engine = this.models[name].engine;
          if (typeof this.engines[engine] === 'undefined') {
            throw Error('Unknown engine ' + engine + ' in model ' + name);
          }
          try {
            this.instances[name] = new this.engines[engine](this.models[name]);
          }
          catch (error) {
            console.log(error.stack);
          }
        });
        return globby([__dirname + '/../plugins/*.js']);
      }).then((files) => {
        files.forEach((file) => {
          let name = file.match(/\/([^\/]+)\.js$/)[1];
          this.plugins[name] = new (require(file))(this);
        });
        Object.keys(this.plugins).forEach((name) => {
          let plugin = this.plugins[name];
          this.pluginFields = _.merge(this.pluginFields, plugin.getFields());
        });
        resolve();
      }).catch((error) => {
        console.log(error);
      });
    });
  }
  
  has(name) {
    return this.ready.then(() => {
      return typeof this.instances[name] !== 'undefined';
    });
  }
  
  get(name) {
    return this.ready.then(() => {
      return this.instances[name];
    });
  };
  
  hasPluginField(model, field) {
    var name = model.name + '.' + field.name;
    return typeof this.pluginFields[name] !== 'undefined';
  };
  
  getPluginFieldValue(model, field, id, context) {
    var name = model.name + '.' + field.name;
    return this.pluginFields[name](model, field, id, context);
  };
}

module.exports = Models;
