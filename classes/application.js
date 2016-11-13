'use strict';

const _ = require('lodash');
const BlueGate = require('bluegate');

const Storage = require('./storage');
const GraphqlEndpoint = require('./graphql-endpoint.js');
const Authentication = require('./authentication.js');

class Application {
  constructor(config) {
    config = _.defaults(config, {
      port: 80,
      storage: {},
      authentication: {},
      graphql: {
        enabled: true
      }
    });
    this.app = new BlueGate({log: false});

    this.storage = new Storage(config.storage);

    this.instances = {};
    this.instances.authentication = new Authentication(this.app, this.storage, config.authentication);
    if (config.graphql.enabled) {
      this.instances.graphql = new GraphqlEndpoint(this.app, this.storage, config.graphql);
    }

    this.app.error(request => {
      console.log(request.error);
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
