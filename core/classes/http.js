'use strict';

const {createServer} = require('http');
const {promisify} = require('util');
const destroyable = require('server-destroy');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

class Http {
  constructor({Config, Log}) {
    this.log = Log;

    this.port = parseInt(Config.get('/port', 80), 10);
    this.app = new Koa();

    this.app.use(async (ctx, next) => {
      ctx.correlationId = this.log.generateCorrelationId();
      await next();
    });

    this.app.use((ctx, next) => this.logRequest(ctx, next));

    this.app.use(bodyParser({
      jsonLimit: Config.get('/bodyParser_jsonLimit', '1mb'),
      textLimit: Config.get('/bodyParser_textLimit', '1mb'),
      formLimit: Config.get('/bodyParser_formLimit', '56kb')
    }));
    this.app.use((ctx, next) => {
      if (ctx.request.headers.origin) {
        ctx.response.set({
          'Access-Control-Allow-Origin': ctx.request.headers.origin,
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,POST,DELETE,PATCH',
          'Access-Control-Allow-Headers': 'authorization,content-type',
          'Access-Control-Allow-Credentials': 'true'
        });
      }
      if (ctx.request.method === 'OPTIONS') {
        ctx.response.body = {};
        return;
      }
      return next();
    });
    this.app.use((ctx, next) => this.handleRequest(ctx, next, this.firstMiddleware));

    this.middleware = {};
    this.firstMiddleware = null;
  }

  async logRequest(ctx, next) {
    const start = new Date();
    try {
      await next();
      const done = () => {
        const status = ctx.status || 500;
        const time = Date.now() - start;
        ctx.res.removeListener('finish', done);
        ctx.res.removeListener('close', done);
        this.log.log({
          correlationId: ctx.correlationId,
          severity: status >= 400 && status !== 404 ? 'warning' : 'debug',
          message: `${ctx.method} ${ctx.originalUrl} ${status} ${time}ms`
        });
      };

      ctx.res.once('finish', done);
      ctx.res.once('close', done);
    } catch (err) {
      const status = err.status || 500;
      this.log.log({
        correlationId: ctx.correlationId,
        severity: status === 500 ? 'error' : (status >= 400 ? 'warning' : 'debug'),
        message: `${ctx.method} ${ctx.originalUrl} ${status} ${err.message}`,
        ...(err.properties || {})
      });
      ctx.response.status = status;
      // @todo: Create a nicer error page.
      ctx.response.body = err.expose ? err.message : 'Internal server error';
    }
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
    })).sort((a, b) => a.weight - b.weight).forEach(({name}) => {
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
    if (this.port) {
      await this.server.listen(this.port);
    }
    destroyable(this.server);
  }

  async shutdown() {
    this.server.destroy = promisify(this.server.destroy);
    await this.server.destroy();
  }
}

Http.singleton = true;
Http.require = ['Config', 'Log'];

module.exports = Http;
