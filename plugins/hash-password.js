'use strict';

const Plugin = require('../classes/plugin');
const Password = require('../classes/password');

class HashPassword extends Plugin {
  constructor(models) {
    super(models);

    // @todo: Need to get config for Password.
    this.password = new Password();

    this.encodeFields = {};
  }

  getPreprocessors() {
    const models = [];
    Object.keys(this.models).forEach(modelName => {
      this.encodeFields[modelName] = [];
      const properties = this.models[modelName].jsonSchema.properties;
      Object.keys(properties).forEach(property => {
        if (properties[property].hashPassword === true) {
          this.encodeFields[modelName].push(property);
          models.push(modelName);
        }
      });
    });
    return models;
  }

  preprocess(models, model, operation, data) {
    const fields = this.encodeFields[model.name];
    fields.forEach(field => {
      if (typeof data[field] === 'string' && data[field].length > 0) {
        // Hash password if value is a non-empty string.
        data[field] = this.password.hash(data[field]);
      }
      else {
        // Remove the property. This is useful in updates where we do not want to change
        // the password when the field is left empty.
        data[field] = undefined;
      }
    });
    return data;
  }
}

module.exports = HashPassword;
