'use strict';

module.exports = {
  name: 'Keys',
  description: 'Get property keys of an object',

  inputSchema: {type: 'object'},

  requires: ['Immutable'],

  unary: (input, {Immutable}) => {
    if (typeof input !== 'object' || input === null) {
      return [];
    }
    return Immutable.fromJS(Object.keys(input.toJS()));
  }
};
