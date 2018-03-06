/* eslint-disable no-await-in-loop */
'use strict';

const Watch = require('watch');

class ConfigFiles {
  constructor({Yaml, Config}) {
    this.yaml = Yaml;
    this.config = Config;

    // Each implementation must set a proper configName.
    this.configName = null;

    this.items = {};
  }

  async readFiles() {
    const files = await this.yaml.readFiles(`data/${this.configName}/**/*.yml`);
    for (let i = 0; i < Object.keys(files).length; ++i) {
      const filename = Object.keys(files)[i];
      const {id} = files[filename];
      if (typeof this.items[id] !== 'undefined') {
        await this.destroy(this.items[id]);
      }
      this.items[id] = await this.create(files[filename]);
    }
    await this.publish();
  }

  async startup() {
    await this.readFiles();
    if (this.config.get('/reload', false)) {
      let first = true;
      Watch.watchTree(`data/${this.configName}`, () => {
        if (first) {
          first = false;
          return;
        }
        console.log('Reloading ' + this.configName);
        this.readFiles();
      });
    }
  }

  async shutdown() {
    if (this.config.get('/reload', false)) {
      Watch.unwatchTree(`data/${this.configName}`);
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

ConfigFiles.require = ['Yaml', 'Config'];

module.exports = ConfigFiles;
