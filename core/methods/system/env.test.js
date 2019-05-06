'use strict';

module.exports = {
  tests: [{
    can: 'get environment variable',
    input: 'PATH',
    output: output => output === process.env.PATH
  }]
};
