'use strict';

module.exports = {
  title: 'To',
  description: 'Generate range',

  leftSchema: {type: 'integer'},
  rightSchema: {type: 'integer'},

  requires: ['Immutable'],

  binary: (left, right, {Immutable}) => {
    const output = [];
    if (left > right) {
      return Immutable.fromJS([]);
    }
    for (let i = left; i <= right; ++i) {
      output.push(i);
    }
    return Immutable.fromJS(output);
  }
};
