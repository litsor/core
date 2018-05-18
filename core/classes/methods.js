'use strict';

const {resolve} = require('path');
const globby = require('globby');
const Watch = require('watch');
const {Unauthorized, Forbidden} = require('http-errors');
const reload = require('require-reload')(require);

class Methods {
  constructor({Config, MethodTester, Container, Graphql, Encrypt, Log}) {
    this.config = Config;
    this.methodTester = MethodTester;
    this.container = Container;
    this.graphql = Graphql;
    this.encrypt = Encrypt;
    this.log = Log;
    this.methods = {};
  }

  async readFiles(changedFile) {
    const files = await globby(['methods/**/*.js', 'core/methods/**/*.js']);
    const output = {};
    const promises = [];
    files.forEach(file => {
      const filename = resolve(file);
      const name = filename.match(/\/([^/]+)\.js$/)[1];
      try {
        this.methods[name] = reload(filename);
        if (file === changedFile) {
          promises.push(this.methodTester.test(this.methods[name]));
        }
      } catch (err) {
        this.log.error(`Unable to load ${name}: ${err.message}`);
      }
    });
    await Promise.all(promises);
    return output;
  }

  async startup() {
    await this.readFiles();
    if (this.config.get('/reload', false)) {
      let first = true;
      const callback = changedFile => {
        if (first) {
          first = false;
          return;
        }
        this.log.info('Reloading methods');
        this.readFiles(changedFile);
      };
      Watch.watchTree('core/methods', callback);
      Watch.watchTree('methods', callback);
    }

    const schema = `
    type _method {
      id: ID!
      title: String!
      description: String
      inputSchema: JSON!
      outputSchema(inputSchema: JSON!, options: JSON!): JSON!
      defaults: JSON!
      examples: [JSON!]!
    }
    extend type Query {
      _method(id: ID!): _method
      _methods: [_method]
    }
    `;
    const requireAdmin = callback => (value, args, context) => {
      const {headers} = context;
      const header = headers.authorization || headers['x-authorization'];
      if (!header) {
        throw new Unauthorized();
      }
      if (header !== 'Bearer ' + this.encrypt.adminToken()) {
        throw new Forbidden();
      }
      return callback(value, args, context);
    };
    const toMethod = id => ({
      id,
      title: this.methods[id].title,
      decription: this.methods[id].description,
      inputSchema: this.methods[id].inputSchema,
      defaults: this.methods[id].defaults || {},
      examples: this.methods[id].tests || []
    });
    const resolvers = {
      Query: {
        _methods: requireAdmin(() => Object.keys(this.methods).map(toMethod)),
        _method: requireAdmin((_, {id}) => toMethod(id))
      },
      _method: {
        outputSchema: requireAdmin(({id}, {inputSchema, options}) => this.methods[id].outputSchema(inputSchema, options))
      }
    };
    await this.graphql.publish(schema, resolvers, `ConfigFiles:${this.configName}`);
  }

  async shutdown() {
    if (this.config.get('/reload', false)) {
      Watch.unwatchTree('core/methods');
      Watch.unwatchTree('methods');
    }
  }

  getNames() {
    return Object.keys(this.methods);
  }

  async get(name) {
    if (typeof this.methods[name] === 'undefined') {
      throw new TypeError(`No method found with name "${name}"`);
    }
    return this.methods[name];
  }

  async execute(name, input) {
    const method = await this.get(name);
    const dependencies = {};
    const promises = (method.requires || []).map(name => {
      return this.container.get(name);
    });
    (await Promise.all(promises)).forEach((item, index) => {
      dependencies[method.requires[index]] = item;
    });
    return method.execute({...(method.defaults || {}), ...input}, dependencies);
  }
}

Methods.singleton = true;
Methods.require = ['Config', 'MethodTester', 'Container', 'Graphql', 'Encrypt', 'Log'];

module.exports = Methods;
