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
    return JsonPointer.get(this.config, path);
  }

  set(path, value) {
    JsonPointer.set(this.config, path, value);
  }
}

Config.singleton = true;

module.exports = Config;
