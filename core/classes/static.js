'use strict';

const {resolve} = require('path');
const koaStatic = require('koa-static');

class Static {
  constructor({Http, Config}) {
    this.http = Http;
    this.config = Config;
  }

  startup() {
    const dataDir = this.config.get('/configDir', 'data');
    const path = resolve(dataDir, 'public');
    const handler = koaStatic(path, {});
    this.http.use('static', 10, (ctx, next) => {
      console.log('test');
      return handler(ctx, next);
    });
  }

  shutdown() {
    this.http.unuse('static');
  }
}

Static.require = ['Http', 'Config'];

module.exports = Static;
