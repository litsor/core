'use strict';

const _ = require('lodash');
const BlueGate = require('bluegate');

const Storage = require('./Storage');
const GraphQLEndpoint = require('./GraphQLEndpoint.js');

class Application {
  constructor(config) {
    _.defaults(config, {
      port: 80,
      storage: {},
      graphql: {
        enabled: true
      }
    });
    this.app = new BlueGate({log: false});

    this.storage = new Storage(config.storage);

    this.instances = {};
    if (config.graphql.enabled) {
      this.instances.graphql = new GraphQLEndpoint(this.app, this.storage, config.graphql);
    }

    this.app.error(function() {
      console.log(this.error);
    });

    this._ready = this.app.listen(config.port);
  }

  ready() {
    return this.ready;
  }

  close() {
    return this.app.close();
  }
}

module.exports = Application;
