'use strict';

const {createServer} = require('http');
const {promisify} = require('util');
const destroyable = require('server-destroy');
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
    this.server = createServer(this.app.callback());
    this.server.listen = promisify(this.server.listen);
    await this.server.listen(this.port);
    destroyable(this.server);
  }

  async shutdown() {
    this.server.destroy = promisify(this.server.destroy);
    await this.server.destroy();
  }
}

Http.singleton = true;
Http.require = ['Config'];

module.exports = Http;
