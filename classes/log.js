'use strict';

class Log {
  constructor(prefix) {
    this._prefix = prefix || '';

    this._debug = process.env.debug;
    this._test = process.argv[1].match(/mocha$/);
  }

  _log(message) {
    if (!this._test) {
      const date = (new Date()).toISOString();
      console.log(`${date} ${this._prefix}${message}`);
    }
  }

  exception(error, prefix) {
    if ((this._debug || this._test) && error.stack) {
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
