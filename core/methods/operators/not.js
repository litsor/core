'use strict';

module.exports = {
  id: '!',
  title: 'Not',
  description: 'Negate value casted to boolean',

  inputSchema: {title: 'Condition'},

  unary: operand => !operand
};
