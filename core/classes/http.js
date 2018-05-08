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
    this.app.use((ctx, next) => this.handleRequest(ctx, next, this.firstMiddleware));

    this.middleware = {};
    this.firstMiddleware = null;
  }

  use(name, weight, callback) {
    this.middleware[name] = {name, weight, callback};
    this.update();
  }

  unuse(name) {
    delete this.middleware[name];
    this.update();
  }

  update() {
    let last;
    Object.keys(this.middleware).map(name => ({
      name,
      ...this.middleware[name]
    })).sort((a, b) => a.weight - b.weight).map(({name}, idx, list) => {
      if (last) {
        last.next = this.middleware[name];
      } else {
        this.firstMiddleware = this.middleware[name];
        this.firstMiddleware.next = null;
      }
      last = this.middleware[name];
    });
  }

  async handleRequest(ctx, next, middleware) {
    if (middleware) {
      return middleware.callback(ctx, () => this.handleRequest(ctx, next, middleware.next));
    }
    return next();
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
