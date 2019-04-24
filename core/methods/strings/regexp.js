'use strict';

module.exports = {
  title: 'Regular expression',
  description: 'Check if input string matches regular expresion',

  requires: ['Immutable'],

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  binary: async (input, pattern, {Immutable}) => {
    const regexp = new RegExp(pattern);
    return Immutable.fromJS(input.match(regexp));
  }
};
