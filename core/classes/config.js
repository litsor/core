'use strict';

const rc = require('rc');
const JsonPointer = require('jsonpointer');

class Config {
  constructor() {
    this.config = {};
  }

  startup() {
    this.config = rc('litsor', {
      port: 80
    });
  }

  get(path, defaultValue) {
    if (path) {
      return JsonPointer.get(this.config, path) || defaultValue;
    }
    return this.config;
  }

  set(value) {
    this.config = JSON.parse(JSON.stringify(value));
  }
}

Config.singleton = true;

module.exports = Config;
