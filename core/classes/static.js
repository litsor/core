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
    const handler = koaStatic(path, {
      maxage: 86400000
    });
    this.http.use('static', 10, (ctx, next) => handler(ctx, next));
  }

  shutdown() {
    this.http.unuse('static');
  }
}

Static.require = ['Http', 'Config'];

module.exports = Static;
