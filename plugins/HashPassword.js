'use strict';

const Plugin = require('../classes/Plugin');
const Password = require('../classes/Password');

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
      // Hash password if value is a non-empty string.
      // Empty strings will trigger an out-of-memory error in pbkdf2.
      if (typeof data[field] === 'string' && data[field].length > 0) {
        data[field] = this.password.hash(data[field]);
      }
    });
    return data;
  }
}

module.exports = HashPassword;
