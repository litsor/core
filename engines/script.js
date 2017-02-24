'use strict';

const _ = require('lodash');

const Model = require('../classes/model');
const ScriptClass = require('../classes/script');

class Script extends Model {
  constructor(modelData, database, internalDatabase, storage) {
    super(modelData, database, internalDatabase);

    this.storage = storage;

    this.dbName = database.name;
    this.parameters = database.parameters;

    this.scripts = {};

    const operations = ['list', 'create', 'read', 'update', 'remove', 'count'];
    operations.forEach(operation => {
      if (modelData.jsonSchema[operation] instanceof Array) {
        const operationName = operation === 'remove' ? 'delete' : operation;
        this.scripts[operation] = new ScriptClass({
          name: `${operationName}${modelData.name}`,
          steps: modelData.jsonSchema[operation]
        }, this.storage);
      }
    });
  }

  ready() {
    return true;
  }

  read(data) {
    return this.scripts.read.run({
      id: data.id,
      options: _.omit(data, 'id'),
      config: this.parameters
    }).then(result => {
      return this.castTypes(result);
    });
  }

  list(filters, options) {
    return this.scripts.list.run({
      filters,
      options,
      config: this.parameters
    }).then(result => {
      return this.castTypes(result);
    });
  }

  create(data) {
    return this.scripts.create.run({
      data,
      config: this.parameters
    }).then(result => {
      return this.castTypes(result);
    });
  }

  update(data) {
    return this.scripts.update.run({
      data,
      config: this.parameters
    }).then(result => {
      return this.castTypes(result);
    });
  }

  remove(data) {
    return this.scripts.remove.run({
      id: data.id,
      options: _.omit(data, 'id'),
      config: this.parameters
    }).then(result => {
      return this.castTypes(result);
    });
  }

  count(data) {
    return this.scripts.count.run({
      data,
      config: this.parameters
    });
  }

  castTypes(data) {
    if (data instanceof Array) {
      return data.map(this.castTypes.bind(this));
    }
    Object.keys(this.jsonSchema.properties).forEach(name => {
      if (typeof data[name] === 'undefined' || data[name] === null) {
        return;
      }
      const type = this.jsonSchema.properties[name].type;
      if (type === 'integer') {
        data[name] = parseInt(data[name], 10);
      }
      if (type === 'number' || type === 'float') {
        data[name] = parseFloat(data[name], 10);
      }
      if (type === 'boolean') {
        data[name] = Boolean(data[name]);
      }
      if (type === 'string') {
        data[name] = String(data[name]);
      }
    });
    return data;
  }
}

module.exports = Script;
