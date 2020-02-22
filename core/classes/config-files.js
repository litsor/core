/* eslint-disable no-await-in-loop */
'use strict';

const Fs = require('fs');
const {resolve} = require('path');
const {promisify} = require('util');
const {kebabCase} = require('lodash');
const globby = require('globby');
const Watch = require('watch');
const {Unauthorized, Forbidden} = require('http-errors');
const createValidator = require('is-my-json-valid');

const readFile = promisify(Fs.readFile);
const unlink = promisify(Fs.unlink);

class ConfigFiles {
  constructor({Yaml, Config, Graphql, Encrypt, Log}) {
    this.yaml = Yaml;
    this.config = Config;
    this.graphql = Graphql;
    this.encrypt = Encrypt;
    this.log = Log;

    this.configDir = Config.get('/configDir', 'data');
    this.extension = '.yml';

    // Each implementation must set a proper configName.
    this.configName = null;

    // Implementation can specify a validation schema or override validationFunction.
    this.validationSchema = {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        }
      },
      required: ['id']
    };

    this.filenames = {};
    this.items = {};
  }

  async validationFunction(input) {
    const validator = createValidator(this.validationSchema);
    if (!validator(input)) {
      return validator.errors.map(({field, message}) => `${field.substring(5)} ${message}`).join(', ');
    }
    return true;
  }

  async readPlainFiles(pattern) {
    const files = await globby(pattern);
    const output = {};
    const promises = files.map(file => {
      return readFile(file);
    });
    (await Promise.all(promises)).forEach((contents, index) => {
      const file = files[index];
      output[file] = contents.toString();
    });
    return output;
  }

  async readFiles() {
    const loader = this.plain ? this.readPlainFiles : this.yaml.readFiles;
    const files = {
      ...(await loader(resolve(__dirname, `../config/${this.configName}/**/*${this.extension}`))),
      ...(await loader(`${this.configDir}/${this.configName}/**/*${this.extension}`))
    };
    for (let i = 0; i < Object.keys(files).length; ++i) {
      const filename = Object.keys(files)[i];

      const data = files[filename];
      let id;
      if (this.plain) {
        const firstLine = data.split('\n')[0];
        const idComment = firstLine.match(/^(?:#|\/\/)[\s]*([a-z_][a-z0-9_-]*)[\s]*$/i);
        if (!idComment) {
          this.log.error(`Unable to load ${filename}: no comment with id found`);
          break;
        }
        id = idComment[1];
      } else {
        if (this.plain && (typeof data !== 'object' || data === null)) {
          this.log.error(`Unable to load ${filename}: contents must be an object`);
          break;
        }
        if (typeof data.id !== 'string') {
          this.log.error(`Unable to load ${filename}: missing id or wrong type`);
          break;
        }
        id = data.id;
      }
      const error = await this.validationFunction(data);
      if (error !== true) {
        const errorMessage = typeof error === 'string' ? error : 'Invalid format';
        this.log.error(`Unable to load ${id}: ${errorMessage}`);
        break;
      }

      if (typeof this.items[id] !== 'undefined') {
        await this.destroy(this.items[id]);
      }
      this.filenames[id] = filename;
      try {
        this.items[id] = await this.create(files[filename], id);
      } catch (err) {
        this.log.error(err.message);
      }
    }
    await this.publish();
  }

  async startup() {
    await this.readFiles();
    if (this.config.get('/reload', false)) {
      let first = true;
      const path = `${this.configDir}/${this.configName}`;
      if (Fs.existsSync(path)) {
        Watch.watchTree(path, () => {
          if (first) {
            first = false;
            return;
          }
          this.log.info('Reloading ' + this.configName);
          this.readFiles();
        });
      }
    }
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

  has(name) {
    return typeof this.items[name] !== 'undefined';
  }

  get(name) {
    if (typeof this.items[name] === 'undefined') {
      throw new TypeError(`No ${this.configName} found with name "${name}"`);
    }
    return this.items[name];
  }
}

ConfigFiles.require = ['Yaml', 'Config', 'Graphql', 'Encrypt', 'Log'];

module.exports = ConfigFiles;
