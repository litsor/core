'use strict';

const _ = require('lodash');
const BlueGate = require('bluegate');

const Storage = require('./Storage');
const GraphQLEndpoint = require('./GraphQLEndpoint.js');
const Authentication = require('./Authentication.js');

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
      this.instances.graphql = new GraphQLEndpoint(this.app, this.storage, config.graphql);
    }

    this.app.error(function() {
      console.log(this.error);
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
