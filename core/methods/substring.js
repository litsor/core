'use strict';

module.exports = {
  title: 'substring',
  description: 'Get a part of the string',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        title: 'Input string',
        type: 'string'
      },
      start: {
        title: 'Start character',
        type: 'integer',
        minimum: 0
      },
      length: {
        title: 'Maximum length',
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
    title: 'Without options',
    input: {
      input: 'Test'
    },
    output: 'Test'
  }, {
    title: 'Only start',
    input: {
      input: 'Test',
      start: 2
    },
    output: 'st'
  }, {
    title: 'Only length',
    input: {
      input: 'Test',
      length: 2
    },
    output: 'Te'
  }, {
    title: 'Both start and length given',
    input: {
      input: 'Test',
      start: 2,
      length: 1
    },
    output: 's'
  }, {
    title: 'Start beyond length of input string',
    input: {
      input: 'Test',
      start: 10
    },
    output: ''
  }, {
    title: 'Can infer minimum and maximum length in output schema',
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
    title: 'Calculates maxLength correctly in output schema',
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
