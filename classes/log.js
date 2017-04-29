'use strict';

class Log {
  constructor(prefix) {
    this._prefix = prefix || '';
  }

  _log(message) {
    const date = (new Date()).toISOString();
    console.log(`${date} ${this._prefix}${message}`);
  }

  exception(error, prefix) {
    if (process.env.debug && error.stack) {
      console.log(error.stack);
    }
    this.error((prefix || '') + error.message);
  }

  error(message) {
    this._log(`error: ${message}`);
  }

  warning(message) {
    this._log(`warning: ${message}`);
  }

  notice(message) {
    this._log(`notice: ${message}`);
  }
}

module.exports = Log;
