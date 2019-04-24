'use strict';

module.exports = {
  name: 'Replace',

  leftSchema: {
    type: 'string'
  },

  rightSchema: {
    type: 'object',
    additionalProperties: {
      title: 'Replacement',
      type: 'string'
    }
  },

  binary: (input, replacements, {}) => {
    replacements = replacements.toJS();
    Object.keys(replacements).forEach(key => {
      input = input.split(key).join(replacements[key]);
    })
    return input;
  }
};
