"use strict";

const _ = require('lodash');
const r = require('rethinkdb');
const Model = require(__dirname + '/../classes/Model');
const Promise = require('bluebird');

class RethinkDB extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);
    
    this.dbName = database.name;
    
    let self = this;
    let ready = new Promise(function(resolve, reject) {
      r.connect({host: 'localhost', port: 28015}, function(err, _conn) {
        self.conn = _conn;
        resolve(self.conn);
        if (err) {
          reject();
          console.error('No connection to database');
          process.exit(1);
        }
      });
    });
    
    this.indexedFields = [];
    this._ready = ready.then(() => {
      return r.dbList().run(this.conn);
    }).then(databases => {
      if (databases.indexOf(database.name) < 0) {
        return r.dbCreate(database.name).run(this.conn);
      }
    }).then(() => {
      return r.db(database.name).tableList().run(this.conn);
    }).then(tables => {
      if (tables.indexOf(this.name) < 0) {
        return r.db(database.name).tableCreate(this.name).run(this.conn);
      }
    }).then(() => {
      return r.db(database.name).table(this.name).indexList().run(this.conn);
    }).then(indexes => {
      let promises = [];
      Object.keys(this.jsonSchema.properties).forEach((key) => {
        let field = this.jsonSchema.properties[key];
        if (typeof field.reverse !== 'undefined' || field.indexed === true) {
          this.indexedFields.push(key);
          if (indexes.indexOf(key) < 0) {
            let promise = r.db(database.name).table(this.name).indexCreate(key).run(this.conn).then(() => {
              return r.db(database.name).table(this.name).indexWait().run(this.conn);
            });
            promises.push(promise);
          }
        }
      });
      return Promise.all(promises);
    });
  }
  
  ready() {
    return Promise.resolve(this._ready);
  }
  
  read(data, fieldNames) {
    return r.db(this.dbName).table(this.name).get(data.id).pluck(fieldNames).run(this.conn).then((row) => {
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
    var query = r.db(this.dbName).table(this.name);
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
    return query.run(this.conn).then((data) => {
      return data;
    });
  }
  
  list(filters, limit, offset, fieldNames, sort, ascending) {
    var query = r.db(this.dbName).table(this.name);
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
    return query.run(this.conn).then((cursor) => {
      return cursor.toArray();
    }).then((rows) => {
      rows.forEach((row) => {
        return this.fillNulls(row, fieldNames);
      });
      return rows;
    });
  }
  
  create(data) {
    return r.db(this.dbName).table(this.name).insert(data).run(this.conn).then(() => {
      return data;
    });
  }
  
  update(data) {
    var id = data.id;
    data = _.omit(data, ['id']);
    return r.db(this.dbName).table(this.name).get(id).update(data).run(this.conn).then(() => {
      return {id: id};
    });
  }
  
  remove(data) {
    return r.db(this.dbName).table(this.name).get(data.id).delete().run(this.conn).then(() => {
      return {id: data.id};
    });
  }
}

module.exports = RethinkDB;
