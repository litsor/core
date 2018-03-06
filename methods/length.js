'use strict';

module.exports = {
  name: 'length',
  description: 'Get length of strings or arrays',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      input: {}
    },
    required: ['input'],
    additionalProperties: false
  },

  outputSchema: inputSchema => {
    const property = (inputSchema.properties || {}).input || {};
    const schema = {
      type: 'integer',
      minimum: 0
    };
    if (property.type === 'null') {
      schema.maximum = 0;
    }
    if (property.type && ['null', 'string', 'array'].indexOf(property.type) < 0) {
      schema.minimum = 1;
      schema.maximum = 1;
    }
    if (property.minLength) {
      schema.minimum = property.minLength;
    }
    if (property.maxLength) {
      schema.maximum = property.maxLength;
    }
    if (property.minItems) {
      schema.minimum = property.minItems;
    }
    if (property.maxItems) {
      schema.maximum = property.maxItems;
    }
    return schema;
  },

  requires: [],

  tests: [{
    name: 'String length',
    input: {input: 'Test'},
    output: 4
  }, {
    name: 'Array length',
    input: {input: ['a', 'b', 'c']},
    output: 3
  }, {
    name: 'Sets 0 as default minimum in output schema',
    input: {input: 'Test'},
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string'
        }
      }
    },
    output: 4,
    outputSchema: {
      type: 'integer',
      minimum: 0
    }
  }, {
    name: 'Outputs 0 for null',
    input: {input: null},
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'null'
        }
      }
    },
    output: 0,
    outputSchema: {
      type: 'integer',
      minimum: 0,
      maximum: 0
    }
  }, {
    name: 'Outputs 1 for other types',
    input: {
      input: true
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'boolean'
        }
      }
    },
    output: 1,
    outputSchema: {
      type: 'integer',
      minimum: 1,
      maximum: 1
    }
  }, {
    name: 'Sets minimum and maximum for strings in output schema',
    input: {
      input: 'Test'
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          minLength: 4,
          maxLength: 20
        }
      }
    },
    output: 4,
    outputSchema: {
      type: 'integer',
      minimum: 4,
      maximum: 20
    }
  }, {
    name: 'Sets minimum and maximum for arrays in output schema',
    input: {
      input: ['a', 'b', 'c', 'd']
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'array',
          minItems: 4,
          maxItems: 20
        }
      }
    },
    output: 4,
    outputSchema: {
      type: 'integer',
      minimum: 4,
      maximum: 20
    }
  }],

  execute: ({input}) => {
    if (typeof input === 'string' || Array.isArray(input)) {
      return input.length;
    }
    if (input === null) {
      return 0;
    }
    return 1;
  }
};
