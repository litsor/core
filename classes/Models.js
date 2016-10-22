"use strict";

const _ = require('lodash');
const globby = require('globby');

const Promise = require('bluebird');
const Model = require(__dirname + '/Model.js');

class Models {
  constructor(models, databases) {
    this.models = models;
    this.databases = databases;
    this.engines = {};
    this.instances = {};
    this.plugins = {};
    this.pluginFields = {};
    this.preprocessors = {};
    this.postprocessors = {};
    
    this.ready = new Promise((resolve, reject) => {
      globby([__dirname + '/../engines/*.js']).then(files => {
        files.forEach((file) => {
          let name = file.match(/\/([^\/]+)\.js$/)[1];
          this.engines[name] = require(file);
        });
        Object.keys(models).forEach((name) => {
          let databaseName = this.models[name].database;
          if (typeof this.databases[databaseName] === 'undefined') {
            throw Error('Unknown database ' + databaseName + ' in model ' + name);
          }
          let database = this.databases[databaseName];
          let engine = database.engine;
          if (typeof this.engines[engine] === 'undefined') {
            throw Error('Unknown engine ' + engine + ' in database ' + databaseName);
          }
          try {
            this.instances[name] = new this.engines[engine](this.models[name], database, this.databases.internal);
          }
          catch (error) {
            console.log(error.stack);
          }
          this.preprocessors[name] = [];
          this.postprocessors[name] = [];
        });
        return globby([__dirname + '/../plugins/*.js']);
      }).then((files) => {
        files.forEach((file) => {
          let name = file.match(/\/([^\/]+)\.js$/)[1];
          this.plugins[name] = new (require(file))(this.models);
        });
        Object.keys(this.plugins).forEach(name => {
          let plugin = this.plugins[name];
          
          // Fields.
          let fields = {};
          let names = plugin.getFields();
          names.forEach(name => {
            fields[name] = {
              plugin: plugin
            };
          });
          this.pluginFields = _.merge(this.pluginFields, fields);
          
          // Preprocess functions.
          plugin.getPreprocessors().forEach(name => {
            this.preprocessors[name].push(plugin);
          });
          
          // Postprocess functions.
          plugin.getPostprocessors().forEach(name => {
            this.postprocessors[name].push(plugin);
          });
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
  }
  
  hasPluginField(model, field) {
    var name = model.name + '.' + field.name;
    return typeof this.pluginFields[name] !== 'undefined';
  }
  
  getPluginFieldValue(model, field, id, context) {
    var name = model.name + '.' + field.name;
    return this.pluginFields[name].plugin.getValue(this, model, field, id, context);
  }
  
  getPreprocessors(model) {
    return this.preprocessors[model.name];
  }
  
  getPostprocessors(model) {
    return this.postprocessors[model.name];
  }
}

module.exports = Models;
