'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Sequence = require('./sequence');
const QueryError = require('./query-error');
const Ids = require('./ids');

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
    this.dummyId = new Ids(0).id;
  }

  ready() {
    return true;
  }

  executeCount(data) {
    const filters = data;
    return Promise.resolve(this.ready()).then(() => {
      return this.count(filters);
    });
  }
  count() {
    throw new Error('Count operation is not supported for ' + this.constructor.name);
  }

  executeList(data, fieldNames) {
    const limit = typeof data.limit === 'number' ? data.limit : 10;
    const offset = typeof data.offset === 'number' ? data.offset : 0;
    const sort = typeof data.sort === 'string' ? data.sort : 'id';
    const ascending = sort[0] !== '!';
    const filters = _.omit(data, ['limit', 'offset', 'sort']);
    return Promise.resolve(this.ready()).then(() => {
      return this.list(filters, fieldNames, {limit, offset, sort, ascending});
    });
  }
  list() {
    throw new Error('List operation is not supported for ' + this.constructor.name);
  }

  executeRead(data, fieldNames) {
    const validation = this.validateKey(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.read(data, fieldNames);
    });
  }
  read() {
    throw new Error('Read operation is not supported for ' + this.constructor.name);
  }

  executeCreate(data, fieldNames, dry) {
    this.fillDefaults(data);
    const validation = this.validateInput(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    if (dry) {
      data.id = this.dummyId;
      return data;
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.sequence.get();
    }).then(id => {
      data.id = id;
      return this.create(data);
    });
  }
  create() {
    throw new Error('Create operation is not supported for ' + this.constructor.name);
  }

  executeUpdate(data, fieldNames, dry) {
    // Validate data, but without the undefined values.
    // Only ensure that these fields are not required fields.
    const validateData = _.clone(data);
    Object.keys(data).forEach(key => {
      if (data[key] === null) {
        if (this.jsonSchema.required.indexOf(key) >= 0) {
          throw new QueryError([{message: 'is a required field', field: key}]);
        }
        delete validateData[key];
      }
    });
    const validation = this.validatePatch(validateData);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    if (dry) {
      return data;
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.update(data);
    });
  }
  update() {
    throw new Error('Update operation is not supported for ' + this.constructor.name);
  }

  executeRemove(data, fieldNames, dry) {
    const validation = this.validateKey(data);
    if (!validation.valid) {
      throw new QueryError(validation.errors);
    }
    if (dry) {
      return {id: data.id};
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.remove(data);
    });
  }
  remove() {
    throw new Error('Delete operation is not supported for ' + this.constructor.name);
  }
}

module.exports = Model;
