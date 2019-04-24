'use strict';

module.exports = {
  id: 'regexpMatches',
  title: 'Regular expression matches',
  description: 'Get captures from regular expression',

  requires: ['Immutable'],

  leftSchema: {type: 'string'},
  rightSchema: {type: 'string'},

  binary: async (input, pattern, {Immutable}) => {
    const regexp = new RegExp(pattern, 'g');
    return Immutable.fromJS(input.match(regexp));
  }
};
