'use strict';

const _ = require('lodash');
const BlueGate = require('bluegate');

const Storage = require('./storage');
const GraphqlApi = require('./graphql-api.js');
const FilesApi = require('./files-api.js');
const Authentication = require('./authentication.js');

class Application {
  constructor(config) {
    config = _.defaults(config, {
      port: 80,
      storage: {},
      authentication: {},
      graphql: {
        enabled: true
      },
      files: {
        enabled: true
      }
    });
    this.app = new BlueGate({log: false});

    this.storage = new Storage(config.storage);

    this.instances = {};
    this.instances.authentication = new Authentication(this.app, this.storage, config.authentication);
    if (config.graphql.enabled) {
      this.instances.graphql = new GraphqlApi(this.app, this.storage, config.graphql);
    }
    if (config.files.enabled) {
      this.instances.files = new FilesApi(this.app, this.storage, config.files);
    }

    this.app.error(request => {
      if (process.env.debug) {
        console.log(request.error);
      }
    });

    this._ready = this.app.listen(config.port);
  }

  ready() {
    return this._ready;
  }

  close() {
    return this.app.close();
  }
}

module.exports = Application;
