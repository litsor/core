'use strict';

const Redis = require('redis');

let client;

module.exports = {
  name: 'Redis',

  leftSchema: {},
  rightSchema: {type: 'string'},

  requires: ['Immutable'],

  binary: (input, command, {Immutable}) => {
    input = Immutable.isImmutable(input) ? input.toJS() : input;
    if (!client) {
      client = Redis.createClient('redis://redis');
      client.on('error', console.error);
    }
    if (typeof client[command] !== 'function') {
      throw new Error('Unknown Redis command: ' + command);
    }
    input = Array.isArray(input) ? input : [input];
    return new Promise((resolve, reject) => {
      client[command](input, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
};
