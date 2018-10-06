'use strict';

module.exports = {
  name: 'Model',
  requires: ['Models'],
  tests: [],
  unary: (name, {Models}) => {
    return Models.get(name);
  }
};
