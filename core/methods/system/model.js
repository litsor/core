'use strict';

module.exports = {
  name: 'Model',
  requires: ['Models', 'Immutable'],
  tests: [],
  unary: async (name, {Models, Immutable}) => Immutable.fromJS(await Models.get(name))
};
