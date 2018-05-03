'use strict';

const createValidator = require('is-my-json-valid');
const {BadRequest} = require('http-errors');

module.exports = {
  title: 'Schema',
  description: 'Validate input against schema',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      schema: {
        title: 'Schema',
        $ref: '#/definitions/jsonSchema'
      },
      raiseError: {
        title: 'Raise error',
        type: 'boolean'
      },
      input: {
        title: 'Input'
      }
    },
    required: ['schema']
  },

  defaults: {
    _output: '/',
    raiseError: true,
    input: '/'
  },

  outputSchema: inputSchema => (inputSchema.properties || {}).input || {},

  requires: [],

  tests: [{
    title: 'Passes valid schema',
    input: {
      schema: {type: 'string'},
      input: 'test'
    },
    output: true
  }],

  execute: ({schema, raiseError, input}) => {
    const validator = createValidator(schema);
    if (!validator(input)) {
      if (raiseError) {
        throw new BadRequest();
      } else {
        return false;
      }
    }
    return true;
  }
};
