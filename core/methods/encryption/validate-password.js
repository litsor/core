'use strict';

const Crypto = require('crypto');
const {promisify} = require('util');

const pbkdf2 = promisify(Crypto.pbkdf2);

module.exports = {
  id: 'validatePassword',
  title: 'Validate password',
  description: 'Validate a password against the stored hash',

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  binary: async (hash, password) => {
    if (typeof hash !== 'string' || typeof password !== 'string' || hash.length < 108) {
      return false;
    }

    const data = Buffer.from(hash, 'base64');

    const version = data.readUInt8(0);
    if (version !== 1) {
      throw new Error('Unsupported hash');
    }

    const salt = data.slice(1, 17);
    const derivedKey = data.slice(17);
    const regenerated = await pbkdf2(password, salt, 10000, 64, 'sha512');
    return regenerated.toString('hex') === derivedKey.toString('hex');
  }
};
