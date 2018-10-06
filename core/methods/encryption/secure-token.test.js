'use strict';

module.exports = {
  tests: [{
    can: 'generate token in base64',
    input: 100,
    output: str => str.length === 20
  }],
};
