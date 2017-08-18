'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const HttpError = require('http-errors');

const Sequence = require('./sequence');
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
    throw new HttpError(400, `Operation "count" is not supported by model`);
  }

  executeList(data, fieldNames) {
    const limit = typeof data.limit === 'number' ? data.limit : 10;
    const offset = typeof data.offset === 'number' ? data.offset : 0;
    const sort = typeof data.sort === 'string' ? data.sort.replace('!', '') : 'id';
    const ascending = typeof data.sort === 'string' ? data.sort.substring(0, 1) !== '!' : true;
    const filters = _.omit(data, ['limit', 'offset', 'sort']);
    return Promise.resolve(this.ready()).then(() => {
      return this.list(filters, fieldNames, {limit, offset, sort, ascending});
    });
  }
  list() {
    throw new HttpError(400, `Operation "list" is not supported by model`);
  }

  executeRead(data, fieldNames) {
    const validation = this.validateKey(data);
    if (!validation.valid) {
      throw new HttpError(400, 'Validation failed', {errors: this.translateErrors(validation.errors)});
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.read(data, fieldNames);
    });
  }
  read() {
    throw new HttpError(400, `Operation "read" is not supported by model`);
  }

  executeCreate(data, fieldNames, dry) {
    // Treat nulls as "not provided". The nulls would otherwise raise "wrong type" errors.
    data = this.removeNulls(data);
    this.fillDefaults(data);
    const validation = this.validateInput(data);
    if (!validation.valid) {
      throw new HttpError(400, 'Validation failed', {errors: this.translateErrors(validation.errors)});
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
    throw new HttpError(400, `Operation "create" is not supported by model`);
  }

  executeUpdate(data, fieldNames, dry) {
    // Validate data, but without the undefined values.
    // Only ensure that these fields are not required fields.
    const validateData = _.clone(data);
    const errors = [];
    Object.keys(data).forEach(key => {
      if (data[key] === null) {
        if (this.jsonSchema.required.indexOf(key) >= 0) {
          errors.push({
            message: `Field "${key}" is required`
          });
        }
        delete validateData[key];
      }
    });
    const validation = this.validatePatch(validateData);
    if (errors.length > 0 || !validation.valid) {
      throw new HttpError(400, 'Validation failed', {
        errors: _.union(errors, this.translateErrors(validation.errors))
      });
    }
    if (dry) {
      return data;
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.update(data);
    });
  }
  update() {
    throw new HttpError(400, `Operation "update" is not supported by model`);
  }

  executeRemove(data, fieldNames, dry) {
    const validation = this.validateKey(data);
    if (!validation.valid) {
      throw new HttpError(400, 'Validation failed', {errors: this.translateErrors(validation.errors)});
    }
    if (dry) {
      return {id: data.id};
    }
    return Promise.resolve(this.ready()).then(() => {
      return this.remove(data);
    });
  }
  remove() {
    throw new HttpError(400, `Operation "delete" is not supported by model`);
  }

  removeNulls(input) {
    const data = _.clone(input);
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });
    return data;
  }

  translateErrors(errors) {
    return errors.map(error => {
      let message = '';
      if (error.field) {
        message += `Field "${error.field}" `;
      }
      if (error.message) {
        message += error.message;
      }
      // @todo: The error object should include a path component.
      // @see http://facebook.github.io/graphql/#sec-Data
      return {
        message
      };
    });
  }
}

module.exports = Model;
