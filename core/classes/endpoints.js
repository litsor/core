'use strict';

const escapeRegex = require('escape-string-regexp');
const ConfigFiles = require('./config-files');

class Endpoints extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);

    this.configName = 'endpoints';

    this.validationSchema = {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        path: {
          oneOf: [{
            type: 'string'
          }, {
            type: 'array',
            items: {type: 'string'},
            minItems: 1
          }]
        },
        method: {
          type: 'string',
          enum: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
        },
        script: {
          type: 'string'
        },
        params: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              in: {
                type: 'string',
                enum: ['query', 'path', 'body']
              },
              schema: {
                type: 'object'
              },
              required: {
                type: 'boolean'
              }
            },
            required: ['name', 'in', 'schema']
          }
        },
        variables: {
          type: 'object'
        },
        output: {
          type: 'object',
          properties: {
            mime: {
              type: 'string'
            },
            schema: {
              type: 'object'
            }
          },
          required: ['mime', 'schema']
        }
      },
      required: ['id', 'path', 'method', 'script', 'params', 'output'],
      additionalProperties: false
    };

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
    this.http.use('endpoints 404', 99, (ctx, next) => this.handleRequest(ctx, next, '404'));
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
      if (item.in === 'path') {
        const paths = Array.isArray(route.path) ? route.path : [route.path];
        value = paths.reduce((prev, path) => {
          const pattern = path.split(/\{[^}]+\}/).map(escapeRegex).join('([^/]+)');
          const parts = ctx.request.path.match(pattern);
          if (parts) {
            const names = path.match(pattern);
            for (let i = 1; i < names.length; ++i) {
              if (name === names[i].substring(1, names[i].length - 1)) {
                return parts[i];
              }
            }
          }
          return prev;
        }, null);
      }
      if (item.in === 'query') {
        value = ctx.request.query[name];
      }
      if (item.in === 'body' && typeof ctx.request.body === 'object' && ctx.request.body !== null) {
        value = ctx.request.body[name];
      }
      const type = (item.schema || {}).type;
      value = typeof value === 'undefined' ? null : value;
      if (value) {
        value = type === 'integer' || type === 'float' ? Number(value) : value;
        value = type === 'boolean' ? value === '1' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 't' : value;
      }
      return {...prev, [name]: value};
    }, {});
    return {
      body: ctx.request.body,
      ...params
    };
  }

  async handleRequest(ctx, next, path) {
    const {method} = ctx.request;
    path = path || ctx.request.path;

    const match = (this.paths[method] || []).filter(route => path.match(route.pattern)).shift();
    if (!match) {
      return next();
    }

    const route = this.items[match.id];
    const script = this.scriptsManager.get(route.script);
    const params = this.getParams(route, ctx);

    const headers = ctx.request.headers;
    const cookies = (ctx.request.headers['cookie'] || '').split(';').map(str => str.trim()).filter(str => str.match(/[^\s]/)).reduce((prev, curr) => {
      const match = curr.match(/^([^=]+)=(.*)$/);
      return match ? {...prev, [match[1]]: match[2]} : prev;
    }, {});

    let input = {path: ctx.request.path, headers, cookies, ...params};
    input = {...input, ...this.input.get(input, route.variables || {})};

    const result = (await script.run(input)) || {};
    if (result.binary && typeof result.body === 'string') {
      ctx.response.body = Buffer.from(result.body, 'base64');
    } else {
      ctx.response.body = result.body || null;
    }
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
