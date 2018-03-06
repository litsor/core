'use strict';

module.exports = {
  name: 'substring',
  description: 'Get a part of the string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Input string',
        type: 'string'
      },
      start: {
        name: 'Start character',
        type: 'integer',
        minimum: 0
      },
      length: {
        name: 'Maximum length',
        type: 'integer',
        minimum: 1
      }
    },
    additionalProperties: false
  },

  outputSchema: (inputSchema, options) => {
    const property = (inputSchema.properties || {}).input || {};
    const schema = {type: 'string'};
    const start = options.start || 0;
    const length = options.length || Infinity;
    if (length !== Infinity) {
      schema.maxLength = length;
    }
    if (property.minLength) {
      const minLength = Math.min(property.minLength - start, length);
      if (minLength > 0) {
        schema.minLength = minLength;
      }
    }
    return schema;
  },

  requires: [],

  tests: [{
    name: 'Without options',
    input: {
      input: 'Test'
    },
    output: 'Test'
  }, {
    name: 'Only start',
    input: {
      input: 'Test',
      start: 2
    },
    output: 'st'
  }, {
    name: 'Only length',
    input: {
      input: 'Test',
      length: 2
    },
    output: 'Te'
  }, {
    name: 'Both start and length given',
    input: {
      input: 'Test',
      start: 2,
      length: 1
    },
    output: 's'
  }, {
    name: 'Start beyond length of input string',
    input: {
      input: 'Test',
      start: 10
    },
    output: ''
  }, {
    name: 'Can infer minimum and maximum length in output schema',
    input: {
      input: 'This is a test',
      start: 5,
      length: 10
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          minLength: 10
        }
      }
    },
    output: 'is a test',
    outputSchema: {
      type: 'string',
      minLength: 5,
      maxLength: 10
    }
  }, {
    name: 'Calculates maxLength correctly in output schema',
    input: {
      input: 'This is a test',
      start: 5,
      length: 3
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          minLength: 10
        }
      }
    },
    output: 'is ',
    outputSchema: {
      type: 'string',
      minLength: 3,
      maxLength: 3
    }
  }],

  execute: ({input, start, length}) => {
    return input.substring(start, (start || 0) + (length || Infinity));
  }
};
