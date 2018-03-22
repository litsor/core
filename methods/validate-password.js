'use strict';

const Crypto = require('crypto');
const {promisify} = require('util');

const pbkdf2 = promisify(Crypto.pbkdf2);

module.exports = {
  name: 'Validate password',
  description: 'Validate a password against the stored hash',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      password: {
        name: 'Plaintext password',
        type: 'string',
        minLength: 1
      },
      hash: {
        name: 'Password hash',
        type: 'string',
        minLength: 108,
        maxLength: 108
      }
    },
    required: [],
    additionalProperties: false
  },

  outputSchema: () => {
    return {
      type: 'boolean'
    };
  },

  requires: [],

  tests: [{
    name: 'Will validate correct hash',
    input: {
      password: 'Welcome',
      hash: 'Aalu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC'
    },
    output: true
  }, {
    name: 'Will reject incorrect hash',
    input: {
      password: 'Welcome!',
      hash: 'Aalu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC'
    },
    output: false
  }, {
    name: 'Will throw an error when with incorrect version',
    input: {
      password: 'Welcome!',
      hash: 'Bblu9aa94uFSOaGm9hCBOTkTwBXOIFcNeLGM43ZCg4pplMlFdzbzoQN2TJI9s/8debmYw/TzrPDvYL1yA/NqBHvhZ1T/l7Y6jvql5NjOvIkC'
    },
    error: err => {
      return err.message === 'Unsupported hash';
    }
  }],

  execute: async ({password, hash}) => {
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
