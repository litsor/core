'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Query = require('./query');

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
    let fnKey;
    const accessOperations = ['read', 'list', 'count'];
    const type = (accessOperations.indexOf(operation) >= 0) ? 'access' : 'mutation';
    if (typeof field === 'undefined' || field === null) {
      fnKey = model.accessMapping.model[type];
    } else {
      if (typeof model.accessMapping.model.properties[field] === 'undefined') {
        // Field does not exist in model. Probably a plugin field.
        // @todo: Implement access permissions for plugins.
        return true;
      }
      fnKey = model.accessMapping.model.properties[field][type];
    }
    const cacheKey = fnKey + ':' + JSON.stringify(data);
    if (typeof this.accessCache[cacheKey] !== 'undefined') {
      return this.accessCache[cacheKey];
    }
    const fnFields = model.accessMapping.functions[fnKey].fields;
    const fn = model.accessMapping.functions[fnKey].function;
    let item;

    if (operation === 'create') {
      // The access function can be dependent on default values.
      model.fillDefaults(data);
    }

    const missingFields = _.difference(fnFields, Object.keys(data));
    if (missingFields.length > 0 && typeof data.id === 'string') {
      const fields = missingFields.join(' ');
      const id = data.id.replace(/[^\w]/g, '');
      const gql = `{item:${model.name}(id:$id){${fields}}}`;
      item = new Query(models, gql, {id}).execute().then(result => {
        return result.item;
      });
    } else {
      item = Promise.resolve(data);
    }
    return item.then(_item => {
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
        gql = `{User(id:$id){ ${gql} }}`;
        throw new Query(models, gql, undefined, {id: this.user.id}).execute().then(result => {
          queryResult = result.User;
        });
      };
      return Promise.resolve().then(() => {
        try {
          return fn(item, this.user, query, operation);
        } catch (err) {
          if (err instanceof Promise) {
            return err.then(() => {
              return fn(item, this.user, query, operation);
            });
          }
          throw err;
        }
      }).then(access => {
        this.accessCache[cacheKey] = access;
        return access;
      });
    });
  }
}

module.exports = Context;
