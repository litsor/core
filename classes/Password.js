'use strict';

const Crypto = require('crypto');
const _ = require('lodash');

class Password {
  constructor(options) {
    this.options = _.defaults(options, {
      workFactor: 1e4,
      size: 32,
      algorithm: 'sha256'
    });
  }

  hash(password) {
    const salt = Crypto.randomBytes(8);
    return [
      'pbkdf2',
      this.options.algorithm,
      this.options.workFactor.toString(36),
      this.options.size.toString(36),
      salt.toString('base64'),
      Crypto.pbkdf2Sync(password, salt, this.options.workFactor, this.options.size, this.options.algorithm).toString('base64')
    ].join('$');
  }

  isValid(hash, password) {
    const parts = hash.split('$');
    const method = parts[0];
    const algorithm = parts[1];
    const workFactor = Number.parseInt(parts[2], 36);
    const size = Number.parseInt(parts[3], 36);
    const salt = new Buffer(parts[4], 'base64');
    return Crypto.pbkdf2Sync(password, salt, workFactor, size, algorithm).toString('base64') === parts[5];
  }

  shouldRehash(hash, password) {
    const parts = hash.split('$');
    const method = parts[0];
    const algorithm = parts[1];
    const workFactor = Number.parseInt(parts[2], 36);
    return this.options.method !== method || this.options.algorithm !== algorithm || this.options.workFactor > workFactor;
  }
};

module.exports = Password;
