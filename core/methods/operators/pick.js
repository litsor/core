'use strict';

module.exports = {
  title: 'Pick',
  description: 'Process output from left operand with expression in right operand',
  isBinary: true,
  cache: 0,
  lazy: true,

  inputSchema: {},

  binary: async (left, right, {}, context) => {
    if (context.methodState === null) {
      context.methodState = {left: await left()};
    }
    return right(context.methodState.left);
  }
};
