"use strict";

const _ = require('lodash');
const r = require('rethinkdb');
const Model = require(__dirname + '/../classes/Model');
const Promise = require('bluebird');

class RestApi extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);

    database = _.defaults(database, {});

    this.dbName = database.name;

    let self = this;
    let ready = true;
  }

  ready() {
    return true;
  }

  read(data, fieldNames) {
    return {
      title: 'Test'
    };
  }

  count(filters) {
    return 0;
  }

  list(filters, limit, offset, fieldNames, sort, ascending) {
    return [];
  }

  create(data) {
    return data;
  }

  update(data) {
    return data;
  }

  remove(data) {
    return {id: data.id};
  }
}

module.exports = RestApi;
