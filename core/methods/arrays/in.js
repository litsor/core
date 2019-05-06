'use strict';

module.exports = {
  name: 'In array',
  description: 'Check if right operand is contained in left operand',
  leftSchema: {
    title: 'Value'
  },
  rightSchema: {type: 'array'},

  binary: async (value, list) => list.indexOf(value) >= 0
};
