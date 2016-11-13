'use strict';

const _ = require('lodash');
const r = require('rethinkdb');
const Promise = require('bluebird');

const Model = require('../classes/model');

class RethinkDB extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);

    database = _.defaults(database, {
      host: 'localhost',
      port: 28015,
      name: 'restapir'
    });

    this.dbName = database.name;

    const ready = new Promise((resolve, reject) => {
      r.connect({host: database.host, port: database.port}, (err, _conn) => {
        this.conn = _conn;
        resolve(this.conn);
        if (err) {
          reject('No connection to database');
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
      const promises = [];
      Object.keys(this.jsonSchema.properties).forEach(key => {
        const field = this.jsonSchema.properties[key];
        if (typeof field.reverse !== 'undefined' || field.indexed === true) {
          this.indexedFields.push(key);
          if (indexes.indexOf(key) < 0) {
            const promise = r.db(database.name).table(this.name).indexCreate(key).run(this.conn).then(() => {
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
    return r.db(this.dbName).table(this.name).get(data.id).pluck(fieldNames).run(this.conn).then(row => {
      return this.fillNulls(row, fieldNames);
    });
  }

  fillNulls(row, fieldNames) {
    fieldNames.forEach(key => {
      if (typeof row[key] === 'undefined') {
        row[key] = null;
      }
    });
    return row;
  }

  count(filters) {
    let query = r.db(this.dbName).table(this.name);
    const indexedFilters = _.pick(filters, this.indexedFields);
    if (Object.keys(indexedFilters).length > 0) {
      // @todo: Pick filter with highest cardinality.
      const index = Object.keys(indexedFilters)[0];
      query = query.getAll(filters[index], {index});
      filters = _.omit(filters, index);
    }
    if (Object.keys(filters).length > 0) {
      query = query.filter(filters);
    }
    query = query.count();
    return query.run(this.conn).then(data => {
      return data;
    });
  }

  list(filters, limit, offset, fieldNames, sort, ascending) {
    let query = r.db(this.dbName).table(this.name);
    const indexedFilters = _.pick(filters, this.indexedFields);
    if (Object.keys(indexedFilters).length > 0) {
      // @todo: Pick filter with highest cardinality.
      const index = Object.keys(indexedFilters)[0];
      query = query.getAll(filters[index], {index});
      filters = _.omit(filters, index);
    }
    if (Object.keys(filters).length > 0) {
      query = query.filter(filters);
    }
    query = query.orderBy(ascending ? sort : r.desc(sort));
    query = query.pluck(fieldNames).slice(offset, offset + limit);
    return query.run(this.conn).then(cursor => {
      return cursor.toArray();
    }).then(rows => {
      rows.forEach(row => {
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
    const id = data.id;
    data = _.omit(data, ['id']);
    return r.db(this.dbName).table(this.name).get(id).update(data).run(this.conn).then(() => {
      return {id};
    });
  }

  remove(data) {
    return r.db(this.dbName).table(this.name).get(data.id).delete().run(this.conn).then(() => {
      return {id: data.id};
    });
  }
}

module.exports = RethinkDB;
