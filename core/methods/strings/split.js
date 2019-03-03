'use strict';

module.exports = {
  title: 'split',
  description: 'Split string on separator',

  leftSchema: {
    title: 'Input string',
    type: 'string'
  },
  rightSchema: {
    title: 'Separator',
    type: 'string'
  },

  requires: ['Immutable'],

  binary: (input, separator, {Immutable}) => {
    return Immutable.fromJS(input.split(separator));
  }
};
