"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const Crypto = require('crypto');

const Parser = require(__dirname + '/Parser');
const QueryError = require(__dirname + '/QueryError');

class Query {
  constructor(models, query, context, args) {
    // Allow us to omit the second argument.
    if (context instanceof Array && typeof args === 'undefined') {
      args = context;
      context = undefined;
    }

    this.models = models;

    // Process query arguments.
    query = this.injectArguments(query, args);

    this.query = query;
    this.context = context;
    try {
      this.parsed = typeof query === 'string' ? Parser(query) : query;
    }
    catch (error) {
      throw new QueryError([{message: error.message}]);
    }
  }

  injectArguments(query, args) {
    if (!(args instanceof Array)) {
      return query;
    }
    var token = Crypto.randomBytes(16).toString('base64');
    query = query.split('?').join(token);
    args.forEach((value) => {
      query = query.replace(token, JSON.stringify(value));
    });
    if (query.indexOf(token) >= 0) {
      throw new QueryError([{mssage: 'Too few arguments provided'}]);
    }
    return query;
  }

  getOperation(method) {
    let parts = method.name.match(/^([a-z]+)?([A-Z][\w]*)$/);
    if (!parts) {
      return 'read';
    }
    let operation = parts[1] ? parts[1] : 'read';
    operation = operation === 'delete' ? 'remove' : operation;
    return operation;
  }

  getModel(method) {
    let parts = method.name.match(/^([a-z]+)?([A-Z][\w]*)$/);
    if (parts) {
      return this.models.get(parts[2]);
    }
    else {
      throw new Error('Model does not exists');
    }
  }

  callMethod(method) {
    let parts = method.name.match(/^([a-z]+)?([A-Z][\w]*)$/);
    if (parts) {
      let operation = this.getOperation(method);

      // Allow us to get the logged in user by requesting readUser without params.
      // @todo: Move to some query preprocessing function.
      if (operation === 'read' && parts[2] === 'User' && !Object.keys(method.params).length && typeof this.context !== 'undefined') {
        var user = this.context.getUser();
        if (user.id) {
          method.params.id = user.id;
        }
      }

      // @todo: The model is already loaded in executeMethod(). Re-use that one.
      return this.models.has(parts[2]).then(exists => {
        if (exists) {
          var model;
          return this.models.get(parts[2]).then((_model) => {
            model = _model;
            if (this.context) {
              // Check entity-level access. Read, update and delete operations
              // are checked on id. Other parameters are not passed.
              // All params are passed for list and create operations.
              let id = typeof method.params.id === 'undefined' ? null : method.params.id;
              let data = {id: id};
              if (operation === 'list' || operation === 'create') {
                data = _.cloneDeep(method.params);
              }
              return this.context.access(this.models, model, operation, data, null);
            }
            else {
              // Context-free queries do not involve access checks.
              return true;
            }
          }).then((access) => {
            if (!access) {
              throw new QueryError([{message: 'Permission denied'}]);
            }
            
            let functionName = 'execute' + _.capitalize(operation);
            // We call the "executeOperation" function, but also check for
            // existence of the "operation" function, which indicates if the
            // models engine supports this operation.
            if (typeof model[operation] === 'function' && typeof model[functionName] === 'function') {
              return model[functionName](method.params, method.fieldNames);
            }
            else {
              throw new QueryError([{message: 'Operation ' + operation + ' is not supported by model'}]);
            }
          }).then((data) => {
            return {
              model: model,
              data: data
            };
          });
        }
      });
    }
  }

  extractFields(model, item, fields, fieldNames, reread) {
    var output = {__type: model.name};
    var promises = [];
    var missing = [];
    
    Object.keys(fields).forEach((alias) => {
      let field = fields[alias];
      let references;
      if (typeof model.jsonSchema.properties[field.name] !== 'undefined') {
        references = model.jsonSchema.properties[field.name].references;
      }
      
      let expand = typeof references !== 'undefined' && Object.keys(field.fields).length;
      if (item[field.name] === null) {
        // Do not expand empty references.
        expand = false;
      }
      
      if (typeof item[field.name] !== 'undefined' && !expand) {
        output[alias] = item[field.name];
      }
      
      if (typeof item[field.name] !== 'undefined' && expand) {
        let submethod = _.clone(field);
        submethod.name = references;
        submethod.params = {id: item[field.name]};
        let promise = this.executeMethod(submethod).then((fieldResult) => {
          output[alias] = fieldResult;
        });
        promises.push(promise);
      }
      
      if (this.models.hasPluginField(model, field)) {
        let promise = this.models.getPluginFieldValue(model, field, item.id, this.context).then((value) => {
          output[alias] = value;
        });
        promises.push(promise);
      }
    });
    return Promise.all(promises).then(() => {
      Object.keys(fields).forEach((alias) => {
        if (typeof output[alias] === 'undefined') {
          missing.push(fields[alias].name);
        }
      });
      if (missing.length && typeof item.id !== 'undefined' && reread) {
        return model.executeRead(_.pick(item, 'id'), missing).then((data) => {
          data = _.merge(data, item);
          return this.extractFields(model, data, fields, fieldNames, false);
        });
      }
      if (missing.length) {
        var error = missing.map((key) => {
          return {field: key, message: 'is unknown'};
        });
        throw new QueryError(error);
      }
      return output;
    });
  }

  checkFieldPermissions(model, id, fieldNames, operation) {
    if (!this.context) {
      return true;
    }
    var errors = [];
    return Promise.reduce(fieldNames, (access, field) => {
      return Promise.resolve(this.context.access(this.models, model, operation, {id: id}, field)).then((fieldAccess) => {
        if (!fieldAccess) {
          errors.push([{field: field, message: 'permission denied'}]);
        }
        return fieldAccess ? access : false;
      });
    }).then((access) => {
      if (!access) {
        throw new QueryError(errors);
      }
    }).done();
  }

  executeMethod(method) {
    let model;
    return this.getModel(method).then(_model => {
      model = _model;
      return this.preprocess(method, model);
    }).then((_method) => {
      method = _method;
      return this.callMethod(method);
    }).then((result) => {
      var isArray = result.data instanceof Array;
      var data = isArray ? result.data : [result.data];
      return Promise.resolve(data).each((item) => {
        let operation;
        let parts = method.name.match(/^([a-z]+)?([A-Z][\w]*)$/);
        if (parts) {
          operation = parts[1] ? parts[1] : 'read';
        }
        return this.checkFieldPermissions(result.model, item.id, method.fieldNames, 'read');
      }).map((item) => {
        if (typeof item === 'object') {
          return this.extractFields(result.model, item, method.fields, method.fieldNames, true);
        }
        else {
          // Operations MAY return scalar values (i.e. "count").
          return item;
        }
      }).then((items) => {
        return isArray ? items : items[0];
      });
    }).then((data) => {
      return this.postprocess(method, model, data);
    });
  }

  preprocess(method, model) {
    let preprocessors = this.models.getPreprocessors(model);
    let operation = this.getOperation(method);
    return Promise.resolve(preprocessors).each(plugin => {
      var result = plugin.preprocess(this.models, model, operation, method.params, this.context);
      return Promise.resolve(result).then(result => {
        method.params = result;
      });
    }).then(() => {
      return method;
    });
  }

  postprocess(method, model, data) {
    let postprocessors = this.models.getPostprocessors(model);
    let operation = this.getOperation(method);
    return Promise.resolve(postprocessors).each(plugin => {
      var result = plugin.postprocess(this.models, model, operation, data, this.context);
      return Promise.resolve(result).then(result => {
        data = result;
      });
    }).then(() => {
      return data;
    });
  }

  execute() {
    var output = {};
    return Promise.resolve(Object.keys(this.parsed)).each((alias) => {
      return Promise.resolve(this.executeMethod(this.parsed[alias])).then((result) => {
        output[alias] = result;
      });
    }).then(() => {
      return output;
    });
  }
}

module.exports = Query;
