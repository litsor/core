'use strict';

const Crypto = require('crypto');

module.exports = {
  title: 'hash',
  description: 'Gives hexadecimal representation of md4, md5, sha1, sha224, sha256 or sha512 hash of left operand',

  leftSchema: {
    title: 'Input',
    type: 'string'
  },

  rightSchema: {
    title: 'Algorithm',
    type: 'string',
    enum: ['md4', 'md5', 'sha1', 'sha224', 'sha256', 'sha512']
  },

  binary: (input, algorithm) => {
    return Crypto.createHash(algorithm).update(input).digest('hex');
  }
};
