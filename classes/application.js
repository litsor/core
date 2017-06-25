'use strict';

const _ = require('lodash');
const BlueGate = require('bluegate');
const HttpError = require('http-errors');

const GraphqlApi = require('./graphql-api.js');
const FilesApi = require('./files-api.js');
const ScriptApi = require('./script-api.js');
const HttpCache = require('./http-cache.js');
const Authentication = require('./authentication.js');

class Application {
  constructor({Config, Storage, Log}) {
    const config = _.defaults(Config.get(), {
      port: 80,
      storage: {},
      authentication: {},
      graphql: {
        enabled: true
      },
      files: {
        enabled: true
      },
      script: {
        enabled: true
      }
    });
    this.app = new BlueGate({log: false});
    this.log = Log;

    this.storage = Storage;

    this.instances = {};
    this.instances.authentication = new Authentication(this.app, this.storage, config.authentication);
    if (config.graphql.enabled) {
      this.instances.graphql = new GraphqlApi(this.app, this.storage, config.graphql);
    }
    if (config.files.enabled) {
      this.instances.files = new FilesApi(this.app, this.storage, config.files);
    }
    if (config.script.enabled) {
      this.instances.script = new ScriptApi(this.app, this.storage, config.script);
    }
    this.instances.httpCache = new HttpCache(this.app, this.storage, config.httpCache);

    this.app.error(request => {
      if (request.error instanceof HttpError.HttpError) {
        request.status = request.error.status;
        let errors;
        if (request.error.expose) {
          if (request.error.errors instanceof Array) {
            errors = request.error.errors;
          } else {
            errors = [request.error.message];
          }
        } else {
          errors = ['An error occurred. Please try again later.'];
        }
        Object.keys(request.error.headers || {}).forEach(key => {
          request.setHeader(key, request.error.headers[key]);
        });
        return _.merge({errors}, request.error.body);
      }
      this.log.exception(request.error, `${request.method} ${request.path}: `);
    });

    this._ready = this.app.listen(config.port);
  }

  async startup() {
    await this._ready;
  }

  async shutdown() {
    await this.app.close();
  }
}

Application.singleton = true;
Application.require = ['Config', 'Storage', 'Log'];

module.exports = Application;
