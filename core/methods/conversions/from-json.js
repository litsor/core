'use strict';

module.exports = {
  title: 'From JSON',
  description: 'Parse JSON encoded string',

  inputSchema: {type: 'string'},

  requires: ['Immutable'],

  unary: (operand, {Immutable}) => Immutable.fromJS(JSON.parse(operand))
};
