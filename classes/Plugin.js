"use strict";

class Plugin {
  constructor(models) {
    this.models = models;
  }
  
  getFields() {
    return {};
  }
}

module.exports = Plugin;
