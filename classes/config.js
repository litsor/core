'use strict';

const rc = require('rc');
const JsonPointer = require('jsonpointer');

class Config {
  constructor() {
    this.config = {};
  }

  startup() {
    this.config = rc('restapir', {
      port: 80
    });
  }

  get(path) {
    if (path) {
      return JsonPointer.get(this.config, path);
    }
    return this.config;
  }

  set(value) {
    this.config = JSON.parse(JSON.stringify(value));
  }
}

Config.singleton = true;

module.exports = Config;
