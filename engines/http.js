'use strict';

const Url = require('url');

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
      if (this.httpOperations.list.moreLink) {
        this.listMoreLinkTransformer = new Transformation(this.httpOperations.list.moreLink);
      }
    }
    if (typeof this.httpOperations.read !== 'undefined') {
      this.httpOperations.read = _.defaults(this.httpOperations.read, {});
      if (typeof this.httpOperations.read.template !== 'object') {
        throw new Error('Model.httpOperations.read.template is not defined or not an object');
      }
      this.readTransformer = new Transformation(this.httpOperations.read.template);
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

  getRequestUri(method, parameters) {
    if (typeof this.httpOperations[method] === 'undefined') {
      throw new Error('Read method is not configured');
    }
    let uriTemplate = this.httpOperations[method].uri;
    uriTemplate = this.replaceTokens(uriTemplate, _.pick(this.parameters, 'baseUri'), false);
    uriTemplate = this.replaceTokens(uriTemplate, _.omit(this.parameters, 'baseUri'));
    return this.replaceTokens(uriTemplate, parameters);
  }

  castTypes(data) {
    Object.keys(this.jsonSchema.properties).forEach(name => {
      if (typeof data[name] === 'undefined' || data[name] === null) {
        return;
      }
      const type = this.jsonSchema.properties[name].type;
      if (type === 'integer') {
        data[name] = parseInt(data[name], 10);
      }
      if (type === 'number' || type === 'float') {
        data[name] = parseFloat(data[name], 10);
      }
      if (type === 'boolean') {
        data[name] = Boolean(data[name]);
      }
      if (type === 'string') {
        data[name] = String(data[name]);
      }
    });
    return data;
  }

  read(data) {
    const uriTemplate = this.getRequestUri('read', _.omit(data, 'id'));
    const uri = uriTemplate.split('{id}').join(data.id);
    return Needle.getAsync(uri, {json: true}).catch(() => {
      throw new Error(`Unable to connect to "${uri}"`);
    }).then(response => {
      if (response.statusCode >= 300) {
        throw new Error('Retrieved error code from remote server: ' + response.statusCode);
      }
      const input = {
        headers: response.headers,
        body: response.body
      };
      let output = this.readTransformer.transform(input);
      if (output !== null) {
        output.id = data.id;
        output = this.castTypes(output);
      }
      return output;
    });
  }

  list(filters, fieldNames, options) {
    const strategy = this.listMoreLinkTransformer ? 'more-link' : 'pages';
    const offset = options.offset;
    const uriTemplate = this.getRequestUri('list', filters);
    let results = [];
    const maxResults = this.httpOperations.list.maxPages * this.httpOperations.list.itemsPerPage;
    let nextUri;
    return Bluebird.resolve(_.range(0, this.httpOperations.list.maxPages)).each(index => {
      if (nextUri === null) {
        return;
      }
      // The results array should have at least index * itemsPerPage items,
      // if not. the preceding query returned less than itemsPerPage results
      // which means that we already reached the end of the list.
      // Also skip the request when we already reached maxResults, which
      // can occur when the requests return more than itemsPerPage results.
      if (results.length >= index * this.httpOperations.list.itemsPerPage && results.length < maxResults) {
        let uri;
        if (nextUri) {
          uri = nextUri;
        } else {
          uri = uriTemplate.split('{offset}').join(results.length + offset + this.httpOperations.list.offsetBase);
        }
        return Needle.getAsync(uri, {json: true}).catch(() => {
          throw new Error(`Unable to connect to "${uri}"`);
        }).then(response => {
          if (response.statusCode >= 300) {
            throw new Error('Retrieved error code from remote server: ' + response.statusCode);
          }
          const input = {
            headers: response.headers,
            body: response.body
          };
          const pageItems = this.listTransformer.transform(input);
          if (!(pageItems instanceof Array)) {
            throw new Error('List template should return an array');
          }
          results = _.concat(results, pageItems);
          if (strategy === 'more-link') {
            nextUri = this.listMoreLinkTransformer.transform(input);
            if (nextUri !== null) {
              nextUri = Url.resolve(uri, nextUri);
            }
          }
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