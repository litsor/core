/* eslint-disable no-await-in-loop */
'use strict';

const Fs = require('fs');
const {promisify} = require('util');
const {kebabCase} = require('lodash');
const Watch = require('watch');
const {Unauthorized, Forbidden} = require('http-errors');

const unlink = promisify(Fs.unlink);

class ConfigFiles {
  constructor({Yaml, Config, Graphql, Encrypt}) {
    this.yaml = Yaml;
    this.config = Config;
    this.graphql = Graphql;
    this.encrypt = Encrypt;

    this.configDir = Config.get('/configDir', 'data');

    // Each implementation must set a proper configName.
    this.configName = null;

    this.filenames = {};
    this.items = {};
  }

  async readFiles() {
    const files = await this.yaml.readFiles(`${this.configDir}/${this.configName}/**/*.yml`);
    for (let i = 0; i < Object.keys(files).length; ++i) {
      const filename = Object.keys(files)[i];
      const {id} = files[filename];
      if (typeof this.items[id] !== 'undefined') {
        await this.destroy(this.items[id]);
      }
      this.filenames[id] = filename;
      this.items[id] = await this.create(files[filename]);
    }
    await this.publish();
  }

  async startup() {
    await this.readFiles();
    if (this.config.get('/reload', false)) {
      let first = true;
      Watch.watchTree(`${this.configDir}/${this.configName}`, () => {
        if (first) {
          first = false;
          return;
        }
        console.log('Reloading ' + this.configName);
        this.readFiles();
      });
    }
    const ucfirst = str => str.substring(0, 1).toUpperCase() + str.substring(1);
    const schema = `
    type _${this.configName}Config {
      id: ID!
      config: JSON!
    }
    extend type Query {
      _${this.configName}Config: [_${this.configName}Config]
    }
    extend type Mutation {
      _set${ucfirst(this.configName)}Config(config: JSON!): ID
      _delete${ucfirst(this.configName)}Config(id: ID!): ID
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
    const resolvers = {
      Query: {
        [`_${this.configName}Config`]: requireAdmin(() => Object.keys(this.items).map(id => ({id})))
      },
      [`_${this.configName}Config`]: {
        config: requireAdmin(async ({id}) => this.yaml.readFile(this.filenames[id]))
      },
      Mutation: {
        [`_set${ucfirst(this.configName)}Config`]: requireAdmin(async (_, {config}) => {
          const {id} = config;
          let filename = this.filenames[id];
          if (typeof filename === 'undefined') {
            const name = kebabCase(id);
            filename = `${this.configDir}/${this.configName}/${name}.yml`;
            this.filenames[id] = filename;
          }
          await this.yaml.writeFile(filename, config);
          await this.readFiles();
          return config.id;
        }),
        [`_delete${ucfirst(this.configName)}Config`]: requireAdmin(async (_, {id}) => {
          if (Object.keys(this.filenames).indexOf(id) < 0) {
            throw new Error('Not found');
          }
          const filename = this.filenames[id];
          await unlink(filename);
          await this.readFiles();
          return id;
        })
      }
    };
    await this.graphql.publish(schema, resolvers, `ConfigFiles:${this.configName}`);
  }

  async shutdown() {
    if (this.config.get('/reload', false)) {
      Watch.unwatchTree(`${this.configDir}/${this.configName}`);
    }
    const names = Object.keys(this.items);
    for (let i = 0; i < names.length; ++i) {
      await this.destroy(this.items[names[i]]);
    }
  }

  async create(definition) {
    return definition;
  }

  async destroy(_) {

  }

  publish() {

  }

  getNames() {
    return Object.keys(this.items);
  }

  get(name) {
    if (typeof this.items[name] === 'undefined') {
      throw new TypeError(`No ${this.configName} found with name "${name}"`);
    }
    return this.items[name];
  }
}

ConfigFiles.require = ['Yaml', 'Config', 'Graphql', 'Encrypt'];

module.exports = ConfigFiles;
