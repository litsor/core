'use strict';

const Crypto = require('crypto');

module.exports = {
  name: 'hash',
  description: 'Hash input string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      algorithm: {
        name: 'Algorithm',
        type: 'string',
        enum: ['md4', 'md5', 'sha1', 'sha224', 'sha256', 'sha512']
      },
      encoding: {
        name: 'Output encoding',
        type: 'string',
        enum: ['hex', 'base64']
      },
      input: {
        name: 'Input string',
        type: 'string'
      }
    },
    required: ['algorithm', 'encoding', 'input'],
    additionalProperties: false
  },

  outputSchema: (_, {algorithm, encoding}) => {
    const lengths = {
      md4: 32,
      md5: 32,
      sha1: 40,
      sha224: 56,
      sha256: 64,
      sha512: 128
    };
    let length = lengths[algorithm];
    if (encoding === 'base64') {
      // Calculate bitlength.
      length *= 4;
      // Base64 has 6 bits per character.
      length /= 6;
      // Round op to 4 characters.
      length = Math.ceil(length / 4) * 4;
    }
    const schema = {
      type: 'string',
      minLength: length,
      maxLength: length
    };
    return schema;
  },

  requires: [],

  tests: [{
    name: 'Calculate SHA1 in hex',
    input: {
      algorithm: 'sha1',
      encoding: 'hex',
      input: 'Test'
    },
    inputSchema: {
      type: 'object',
      properties: {
        algorithm: {type: 'string'},
        encoding: {type: 'string'},
        input: {type: 'string'}
      }
    },
    output: '640ab2bae07bedc4c163f679a746f7ab7fb5d1fa',
    outputSchema: {
      type: 'string',
      minLength: 40,
      maxLength: 40
    }
  }, {
    name: 'Calculate SHA256 in base64',
    input: {
      algorithm: 'sha256',
      encoding: 'base64',
      input: 'Test'
    },
    inputSchema: {
      type: 'object',
      properties: {
        algorithm: {type: 'string'},
        encoding: {type: 'string'},
        input: {type: 'string'}
      }
    },
    output: 'Uy6qvZV0iA2/drm4zACDLCCm7BE9aCKZVQ16bg80XiU=',
    outputSchema: {
      type: 'string',
      minLength: 44,
      maxLength: 44
    }
  }],

  execute: ({input, algorithm, encoding}) => {
    return Crypto.createHash(algorithm).update(input).digest(encoding);
  }
};
