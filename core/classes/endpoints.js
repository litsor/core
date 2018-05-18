'use strict';

const escapeRegex = require('escape-string-regexp');
const ConfigFiles = require('./config-files');

class Endpoints extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);

    this.configName = 'endpoints';

    const {Http, ScriptsManager, Models, Input} = dependencies;

    this.scriptsManager = ScriptsManager;
    this.models = Models;
    this.input = Input;
    this.http = Http;

    this.paths = {};
  }

  startup() {
    super.startup();
    this.http.use('endpoints', 1, (ctx, next) => this.handleRequest(ctx, next));
  }

  shutdown() {
    super.shutdown();
    this.http.unuse('endpoints');
  }

  async publish() {
    this.paths = Object.keys(this.items).reduce((prev, id) => {
      const {method, path} = this.items[id];
      const paths = Array.isArray(path) ? path : [path];
      const pattern = new RegExp('^(' + paths.map(path => path.split(/\{[^}]+\}/).map(escapeRegex).join('[^/]+')).join('|') + ')$');
      prev[method] = prev[method] || [];
      prev[method].push({pattern, id});
      return prev;
    }, {});
  }

  getParams(route, ctx) {
    const params = Object.keys(route.params).reduce((prev, name) => {
      const item = route.params[name];
      let value;
      // @todo: Add values from path.
      if (item.in === 'query') {
        value = ctx.request.query[name];
      }
      if (item.in === 'body' && typeof ctx.request.body === 'object' && ctx.request.body !== null) {
        value = ctx.request.body[name];
      }
      value = typeof value === 'undefined' ? null : value;
      return {...prev, [name]: value};
    }, {});
    return params;
  }

  async handleRequest(ctx, next) {
    const {method, path} = ctx.request;

    const match = (this.paths[method] || []).filter(route => path.match(route.pattern)).shift();
    if (!match) {
      return next();
    }

    const route = this.items[match.id];
    const script = this.scriptsManager.get(route.script);
    const params = this.getParams(route, ctx);

    const headers = ctx.request.headers;
    const cookies = (ctx.request.headers['set-cookie'] || []).map(value => {
      return value.split(';').filter(str => str.match(/[^\s]/)).reduce((prev, curr) => {
        const match = curr.match(/^([^=]+)=(.*)$/);
        return match ? {...prev, [match[1]]: match[2]} : prev;
      }, {});
    }).reduce((prev, curr) => ({...prev, ...curr}), []);

    let input = {path, headers, cookies, ...params};
    input = {...input, ...this.input.get(input, route.variables || {})};

    const result = (await script.run(input)) || {};
    ctx.response.body = result.body || null;
    if (typeof result.status === 'number' && result.status >= 100 && result.status <= 512) {
      ctx.response.status = result.status;
    }
    if (typeof result.redirect === 'string') {
      ctx.redirect(result.redirect);
    }
    ctx.response.set(result.headers || {});

    Object.keys(result.cookies || {}).forEach(name => {
      if (typeof result.cookies[name] === 'object' && result.cookies[name] !== null) {
        const options = {};
        if (typeof result.cookies[name].maxAge === 'number') {
          options.maxAge = result.cookies[name].maxAge * 1000;
        }
        ctx.cookies.set(name, result.cookies[name].value, options);
      }
    });
  }
}

Endpoints.singleton = true;
Endpoints.require = ['Http', 'ScriptsManager', 'Models', 'Input', ...ConfigFiles.require];

module.exports = Endpoints;