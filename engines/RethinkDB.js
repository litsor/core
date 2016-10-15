"use strict";

const _ = require('lodash');
const r = require('rethinkdb');
const Model = require(__dirname + '/../classes/Model');

var conn;
var ready = new Promise(function(resolve, reject) {
  r.connect({host: 'localhost', port: 28015}, function(err, _conn) {
    conn = _conn;
    resolve(conn);
    if (err) {
      reject();
      console.error('No connection to database');
      process.exit(1);
    }
  });
});

class RethinkDB extends Model {
  constructor(data) {
    super(data);
    
    this.indexedFields = [];
    this._ready = ready.then(() => {
      // Create table if and ignore already exists error.
      return r.dbCreate('thesellapp').run(conn);
    }).catch((error) => {}).then(() => {
      // @todo: Database name from config.
      return r.db('thesellapp').tableCreate(this.name).run(conn);
    }).catch((error) => {
      // Ignore "already exists" errors.
    }).then(() => {
      let promises = [];
      Object.keys(this.jsonSchema.properties).forEach((key) => {
        this.indexedFields.push(key);
        let field = this.jsonSchema.properties[key];
        if (typeof field.reverse !== 'undefined' || field.indexed === true) {
          let promise = r.db('thesellapp').table(this.name).indexCreate(key).run(conn);
          promises.push(promise);
        }
      });
      return Promise.all(promises);
    });
  }
  
  ready() {
    return Promise.resolve(this._ready);
  }
  
  read(data, fieldNames) {
    return r.db('thesellapp').table(this.name).get(data.id).pluck(fieldNames).run(conn).then((row) => {
      return this.fillNulls(row, fieldNames);
    });
  }
  
  fillNulls(row, fieldNames) {
    fieldNames.forEach((key) => {
      if (typeof row[key] === 'undefined') {
        row[key] = null;
      }
    });
    return row;
  }
  
  count(filters) {
    var query = r.db('thesellapp').table(this.name);
    var indexedFilters = _.pick(filters, this.indexedFields);
    if (Object.keys(indexedFilters).length) {
      // @todo: Pick filter with highest cardinality.
      let index = Object.keys(indexedFilters)[0];
      query = query.getAll(filters[index], {index: index});
      filters = _.omit(filters, index);
    }
    if (Object.keys(filters).length) {
      query = query.filter(filters);
    }
    query = query.count();
    return query.run(conn).then((data) => {
      return data;
    });
  }
  
  list(filters, limit, offset, fieldNames, sort, ascending) {
    var query = r.db('thesellapp').table(this.name);
    var indexedFilters = _.pick(filters, this.indexedFields);
    if (Object.keys(indexedFilters).length) {
      // @todo: Pick filter with highest cardinality.
      let index = Object.keys(indexedFilters)[0];
      query = query.getAll(filters[index], {index: index});
      filters = _.omit(filters, index);
    }
    if (Object.keys(filters).length) {
      query = query.filter(filters);
    }
    query = query.orderBy(ascending ? sort : r.desc(sort));
    query = query.pluck(fieldNames).slice(offset, offset + limit);
    return query.run(conn).then((cursor) => {
      return cursor.toArray();
    }).then((rows) => {
      rows.forEach((row) => {
        return this.fillNulls(row, fieldNames);
      });
      return rows;
    });
  }
  
  create(data) {
    return r.db('thesellapp').table(this.name).insert(data).run(conn).then(() => {
      return data;
    });
  }
  
  update(data) {
    var id = data.id;
    data = _.omit(data, ['id']);
    return r.db('thesellapp').table(this.name).get(id).update(data).run(conn).then(() => {
      return {id: id};
    });
  }
  
  remove(data) {
    return r.db('thesellapp').table(this.name).get(data.id).delete().run(conn).then(() => {
      return {id: data.id};
    });
  }
}

module.exports = RethinkDB;
