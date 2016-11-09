"use strict";

const Promise = require('bluebird');
const _ = require('lodash');
const Query = require(__dirname + '/Query');

class Context {
  constructor() {
    this.user = {id: null};
    this.accessCache = {};
  }

  setUser(user) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  access(models, model, operation, data, field) {
    var fnKey;
    var accessOperations = ['read', 'list', 'count'];
    var type = (accessOperations.indexOf(operation) >= 0) ? 'access' : 'mutation';
    if (typeof field === 'undefined' || field === null) {
      fnKey = model.accessMapping.model[type];
    }
    else {
      if (typeof model.accessMapping.model.properties[field] === 'undefined') {
        // Field does not exist in model. Probably a plugin field.
        // @todo: Implement access permissions for plugins.
        return true;
      }
      fnKey = model.accessMapping.model.properties[field][type];
    }
    var cacheKey = fnKey + ':' + JSON.stringify(data);
    if (typeof this.accessCache[cacheKey] !== 'undefined') {
      return this.accessCache[cacheKey];
    }
    var fnFields = model.accessMapping.functions[fnKey].fields;
    var fn = model.accessMapping.functions[fnKey]['function'];
    var item;

    if (operation === 'create') {
      // The access function can be dependent on default values.
      model.fillDefaults(data);
    }

    var missingFields = _.difference(fnFields, Object.keys(data));
    if (missingFields.length && typeof data.id === 'string') {
      let fields = missingFields.join(' ');
      let id = data.id.replace(/[^\w]/g, '');
      let gql = `{item:${model.name}(id:"${id}"){${fields}}}`;
      item = new Query(models, gql).execute().then(result => { return result.item; });
    }
    else {
      item = Promise.resolve(data);
    }
    return item.then((_item) => {
      item = _item;

      // The access function may contain a query function.
      // The query function is asynchroneous, but used as:
      // 'q("rank").rank > i.rank', which should be interpreted as
      // q('{User{rank}}').then(result => result.User.rank > i.rank).
      // We do this in two steps. The q() throws a promise in the
      // first step and caches its result, after which it can
      // behave like a synchroneous function in the second step.
      let queryResult;
      const query = gql => {
        if (queryResult) {
          return queryResult;
        }
        gql = `{User(id:?){ ${gql} }}`;
        throw new Query(models, gql, [this.user.id]).execute().then(result => {
          queryResult = result.User;
        });
      };
      let access;
      return Promise.resolve().then(() => {
        try {
          return fn(item, this.user, query, operation);
        }
        catch (error) {
          if (error instanceof Promise) {
            return error.then(() => {
              return fn(item, this.user, query, operation);
            });
          }
          else {
            throw error;
          }
        }
      }).then(access => {
        this.accessCache[cacheKey] = access;
        return access;
      });
    });
  }
}

module.exports = Context;
