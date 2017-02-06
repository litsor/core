'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const Needle = Bluebird.promisifyAll(require('needle'));

const Transformation = require('../classes/transformation');
const Model = require('../classes/model');

class Http extends Model {
  constructor(modelData, database, internalDatabase) {
    super(modelData, database, internalDatabase);

    database = _.defaults(database, {
      parameters: {}
    });

    this.dbName = database.name;
    this.parameters = database.parameters;

    this.httpOperations = _.defaults(modelData.jsonSchema.httpOperations, {});
    if (typeof this.httpOperations.list !== 'undefined') {
      this.httpOperations.list = _.defaults(this.httpOperations.list, {
        maxPages: 1,
        itemsPerPage: 10,
        offsetBase: 0
      });
      if (typeof this.httpOperations.list.template !== 'object') {
        throw new Error('Model.httpOperations.list.template is not defined or not an object');
      }
      this.listTransformer = new Transformation(this.httpOperations.list.template);
    }
  }

  ready() {
    return true;
  }

  replaceTokens(input, tokens, urlEncode = true) {
    let output = input;
    Object.keys(tokens).forEach(key => {
      let value = tokens[key];
      if (urlEncode) {
        value = encodeURIComponent(value);
      }
      output = output.split(`{${key}}`).join(value);
    });
    return output;
  }

  list(filters, fieldNames, options) {
    const offset = options.offset;
    if (typeof this.httpOperations.list === 'undefined') {
      throw new Error('List method is not configured');
    }
    let uriTemplate = this.httpOperations.list.uri;
    uriTemplate = this.replaceTokens(uriTemplate, _.pick(this.parameters, 'baseUri'), false);
    uriTemplate = this.replaceTokens(uriTemplate, _.omit(this.parameters, 'baseUri'));
    uriTemplate = this.replaceTokens(uriTemplate, filters);
    let results = [];
    const maxResults = this.httpOperations.list.maxPages * this.httpOperations.list.itemsPerPage;
    return Bluebird.resolve(_.range(0, this.httpOperations.list.maxPages)).each(index => {
      // The results array should have at least index * itemsPerPage items,
      // if not. the preceding query returned less than itemsPerPage results
      // which means that we already reached the end of the list.
      // Also skip the request when we already reached maxResults, which
      // can occur when the requests return more than itemsPerPage results.
      if (results.length >= index * this.httpOperations.list.itemsPerPage && results.length < maxResults) {
        const uri = uriTemplate.split('{offset}').join(results.length + offset + this.httpOperations.list.offsetBase);
        return Needle.getAsync(uri, {json: true}).catch(() => {
          throw new Error(`Unable to connect to "${uri}"`);
        }).then(response => {
          if (response.statusCode >= 300) {
            throw new Error('Retrieved error code from remote server: ' + response.statusCode);
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

module.exports = Http;
