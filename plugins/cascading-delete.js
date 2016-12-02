'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');

const Plugin = require('../classes/plugin');
const Query = require('../classes/query');

class CascadingDelete extends Plugin {
  /**
   * Initialize plugin.
   */
  constructor(models) {
    super(models);
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
      const properties = this.models[modelName].jsonSchema.properties;
      Object.keys(properties).forEach(property => {
        const prop = properties[property];
        if (typeof prop.cascade === 'undefined') {
          return;
        }
        if (['before', 'after'].indexOf(prop.cascade) < 0) {
          throw new Error(`Invalid value for the cascade property for "${property}" in "${modelName}".`);
        }
        if (typeof prop.reverse === 'string' && typeof prop.references === 'string') {
          this.data[prop.references] = this.data[prop.references] || [];
          this.data[prop.references].push({
            mode: prop.cascade,
            model: modelName,
            field: property,
            skipPermissionsDuringCascade: Boolean(prop.skipPermissionsDuringCascade)
          });
          this[prop.cascade === 'before' ? 'preprocessors' : 'postprocessors'].push(prop.references);
        }
      });
    });
    this.postprocessors = _.uniq(this.postprocessors);
    this.preprocessors = _.uniq(this.postprocessors);
  }

  /**
   * Delete referenced items from a single object.
   */
  process(models, model, operation, id, context) {
    if (operation !== 'remove') {
      return Promise.resolve();
    }
    const promises = [];
    this.data[model.name].forEach(link => {
      if (link.skipPermissionsDuringCascade) {
        context = undefined;
      }
      promises.push(this.processField(models, context, link, id));
    });
    return Promise.all(promises).catch(err => {
      err.message += ' in cascading delete';
      throw err;
    });
  }

  /**
   * Delete referenced items from a single reference field.
   */
  processField(models, context, link, id) {
    const query = `{
      items: list${link.model} (${link.field}: $id, limit: 100) {
        id
      }
    }`;
    const args = {id};
    // Not that the list query is context free.
    // The access check can be based on filters not provided here, for example
    // when having a Post {group:1, user:2} where access check is on 'group'.
    // Cascading posts when deleting the user should not fail on the list query,
    // instead we will check the mutation access of the individual posts
    // by providing context to the delete query.
    const listQuery = new Query(models, query, args).execute();
    return Bluebird.resolve(listQuery).then(result => result.items).each(item => {
      const query = `{
        delete${link.model} (id: $id) {
          id
        }
      }`;
      const args = {id: item.id};
      return new Query(models, query, context, args).execute();
    });
  }

  /**
   * List models that this plugin does pReprocessing for.
   */
  getPreprocessors() {
    return this.preprocessors;
  }

  /**
   * Execute preprocessing.
   */
  preprocess(models, model, operation, params, context) {
    return this.process(models, model, operation, params.id, context).then(() => {
      return params;
    });
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
    return this.process(models, model, operation, params.id, context).then(() => {
      return params;
    });
  }
}

module.exports = CascadingDelete;
