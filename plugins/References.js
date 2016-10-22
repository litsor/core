'use strict';

const _ = require('lodash');
const Plugin = require('../classes/Plugin');
const Query = require('../classes/Query');

class References extends Plugin {
  getFields() {
    let models = this.models;
    this.fieldData = {};
    const fields = [];
    Object.keys(models).forEach(modelName => {
      const properties = models[modelName].jsonSchema.properties;
      Object.keys(properties).forEach(property => {
        if (typeof properties[property].reverse === 'string' && typeof properties[property].references === 'string') {
          const name = properties[property].references + '.' + properties[property].reverse;
          fields.push(name);
          this.fieldData[name] = {
            model: modelName,
            field: property
          };
        }
      });
    });
    return fields;
  }

  getValue(models, model, field, id, context) {
    field = _.cloneDeep(field);

    const name = model.name + '.' + field.name;
    const fieldData = this.fieldData[name];

    const limit = typeof field.params.limit === 'number' ? field.params.limit : 100;
    const offset = typeof field.params.offset === 'number' ? field.params.offset : 0;

    field.name = 'list' + fieldData.model;
    field.params = {limit, offset};
    field.params[fieldData.field] = id;
    const query = {items: field};
    if (field.fieldNames.length === 0) {
      field.fieldNames = ['id'];
      field.fields.id = {
        name: 'id',
        params: {},
        fields: {},
        fieldNames: []
      };
    }

    return new Query(models, query, context).execute().then(result => {
      return result.items;
    });
  }
}

module.exports = References;
