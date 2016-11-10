"use strict";

const _ = require('lodash');
const Promise = require('bluebird');
const Needle = Promise.promisifyAll(require('needle'));

const Transformation = require('../classes/Transformation');
const Model = require('../classes/Model');

class RestApi extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);

    database = _.defaults(database, {
      parameters: {}
    });

    this.dbName = database.name;
    this.parameters = database.parameters;

    this.rest = _.defaults(modelData.jsonSchema.restapi, {});
    if (typeof this.rest.list !== 'undefined') {
      this.rest.list = _.defaults(this.rest.list, {
        maxPages: 1,
        itemsPerPage: 10,
        offsetBase: 0
      });
      if (typeof this.rest.list.template !== 'object') {
        throw new Error('Model.restapi.list.template is not defined or not an object');
      }
      this.listTransformer = new Transformation(this.rest.list.template);
    }

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

  replaceTokens(input, tokens, urlEncode = true) {
    let output = input;
    for (let key in tokens) {
      let value = tokens[key];
      if (urlEncode) {
        value = encodeURIComponent(value);
      }
      output = output.split(`{${key}}`).join(value);
    }
    return output;
  }

  list(filters, limit, offset, fieldNames, sort, ascending) {
    if (typeof this.rest.list === 'undefined') {
      throw new Error('List method is not configured for REST API');
    }
    let uriTemplate = this.rest.list.uri;
    uriTemplate = this.replaceTokens(uriTemplate, _.pick(this.parameters, 'baseUri'), false);
    uriTemplate = this.replaceTokens(uriTemplate, _.omit(this.parameters, 'baseUri'));
    uriTemplate = this.replaceTokens(uriTemplate, filters);
    let results = [];
    const maxResults = this.rest.list.maxPages * this.rest.list.itemsPerPage;
    return Promise.resolve(_.range(0, this.rest.list.maxPages)).each(index => {
      // The results array should have at least index * itemsPerPage items,
      // if not. the preceding query returned less than itemsPerPage results
      // which means that we already reached the end of the list.
      // Also skip the request when we already reached maxResults, which
      // can occur when the requests return more than itemsPerPage results.
      if (results.length >= index * this.rest.list.itemsPerPage && results.length < maxResults) {
        const uri = uriTemplate.split('{offset}').join(results.length + offset + this.rest.list.offsetBase);
        return Needle.getAsync(uri, {json: true}).catch(error => {
          throw new Error('Unable to connect to REST API');
        }).then(response => {
          if (response.statusCode >= 300) {
            throw new Error('Retrieved error code from REST API: ' + response.statusCode);
          }
          const pageItems = this.listTransformer.transform(response.body);
          if (!(pageItems instanceof Array)) {
            throw new Error('List template should return an array');
          }
          results = _.concat(results, pageItems);
        });
      }
    }).then(() => {
      return results.slice(0, maxResults);
    });
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
