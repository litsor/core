'use strict';

const _ = require('lodash');

const Plugin = require('../classes/plugin');
const Script = require('../classes/script');

class ProcessScripts extends Plugin {
  /**
   * Initialize plugin.
   */
  constructor(models, storage) {
    super(models, storage);
    this.analyseModels();
  }

  /**
   * Loop though models to find cascading fields.
   */
  analyseModels() {
    this.data = {};
    this.postprocessors = [];
    this.preprocessors = [];
    Object.keys(this.models).forEach(modelName => {
      if (this.models[modelName].jsonSchema.preprocess instanceof Array) {
        this.preprocessors.push(modelName);
      }
      if (this.models[modelName].jsonSchema.postprocess instanceof Array) {
        this.postprocessors.push(modelName);
      }
    });
  }

  process(model, operation, params, name, context) {
    return new Script({
      name: `${operation}${model.name}:${name}`,
      steps: this.models[model.name].jsonSchema[name]
    }, this.storage, context).run({
      operation,
      params
    }).then(response => response.params);
  }

  /**
   * List models that this plugin does Preprocessing for.
   */
  getPreprocessors() {
    return this.preprocessors;
  }

  /**
   * Execute preprocessing.
   */
  preprocess(models, model, operation, params, context) {
    return this.process(model, operation, params, 'preprocess', context);
  }

  /**
   * List models that this plugin does postprocessing for.
   */
  getPostprocessors() {
    return this.postprocessors;
  }

  /**
   * Execute postprocessing.
   */
  postprocess(models, model, operation, params, context) {
    return this.process(model, operation, params, 'postprocess', context);
  }
}

module.exports = ProcessScripts;
