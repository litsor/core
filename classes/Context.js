"use strict";

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
    var missingFields = _.difference(fnFields, Object.keys(data));
    if (missingFields.length && typeof data.id === 'string') {
      let fields = missingFields.join(' ');
      let id = data.id.replace(/[^\w]/g, '');
      let gql = `{item:${model.name}(id:"${id}"){${fields}}}`;
      item = new Query(models, gql).execute().then((result) => { return result.item; });
    }
    else {
      item = Promise.resolve(data);
    }
    return item.then((_item) => {
      item = _item;
      let query = () => {
        // @todo: Throw promise and retry access function when result is available?
      };
      let access = fn(item, this.user, query, operation);
      this.accessCache[cacheKey] = access;
      return access;
    });
  }
}

module.exports = Context;
