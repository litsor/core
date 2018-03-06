'use strict';

const Koa = require('koa');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');

class Http {
  constructor({Config}) {
    this.port = Config.get('/port', 80);
    this.app = new Koa();
    this.app.use(logger());
    this.app.use(bodyParser());
    this.app.use(cors());
  }

  use(callback) {
    this.app.use(callback);
  }

  async startup() {
    await this.app.listen(this.port);
  }

  async shutdown() {
    await this.app.close();
  }
}

Http.singleton = true;
Http.require = ['Config'];

module.exports = Http;
