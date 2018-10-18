'use strict';

module.exports = {
  tests: [{
    can: 'raise error',
    input: {type: 'BadRequest', message: 'bad'},
    error: () => true
  }]
};
