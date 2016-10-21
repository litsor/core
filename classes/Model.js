"use strict";

const _ = require('lodash');
const Promise = require('bluebird');

const Sequence = require(__dirname + '/Sequence.js');
const QueryError = require(__dirname + '/QueryError');

class Model {
  constructor(modelData, database, internalDatabase) {
    this.name = modelData.name;
    this.jsonSchema = modelData.jsonSchema;
    this.validateFull = modelData.validateFull;
    this.validateKey = modelData.validateKey;
    this.validateInput = modelData.validateInput;
    this.validatePatch = modelData.validatePatch;
    this.accessMapping = modelData.accessMapping;
    this.fillDefaults = modelData.fillDefaults;
    
    this.sequence = new Sequence(this.name, internalDatabase);
  }
  
  ready() {
    return true;
  }
  
  executeCount(data) {
    let filters = data;
    return Promise.resolve(this.ready()).then(() => {
      return this.count(filters);
    });
  }
  
  executeList(data, fieldNames) {
    let limit = typeof data.limit === 'number' ? data.limit : 10;
    let offset = typeof data.offset === 'number' ? data.offset : 0;
    let sort = typeof data.sort === 'string' ? data.sort : 'id';
    let ascending = sort[0] !== '!';
    let filters = _.omit(data, ['limit', 'offset', 'sort']);
    return Promise.resolve(this.ready()).then(() => {
      return this.list(filters, limit, offset, fieldNames, sort, ascending);
    });
  }
  
  executeRead(data, fieldNames) {
    var validation = this.validateKey(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.read(data, fieldNames);
    });
  }
  
  executeCreate(data) {
    this.fillDefaults(data);
    var validation = this.validateInput(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.sequence.get();
    }).then((id) => {
      data.id = id;
      return this.create(data);
    });
  }
  
  executeUpdate(data) {
    // Validate data, but without the undefined values.
    // Only ensure that these fields are not required fields.
    var validateData = _.clone(data);
    Object.keys(data).forEach(key => {
      if (data[key] === null) {
        if (this.jsonSchema.required.indexOf(key) >= 0) {
          throw new QueryError([{message: 'is a required field', field: key}]);
        }
        delete validateData[key];
      }
    });
    var validation = this.validatePatch(validateData);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.update(data);
    });
  }
  
  executeRemove(data) {
    var validation = this.validateKey(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.remove(data);
    });
  }
}

module.exports = Model;
