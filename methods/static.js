'use strict';

module.exports = {
  name: 'static',
  description: 'Static value',
  cache: Infinity,

  inputSchema: {
    type: 'object',
    properties: {
      value: {}
    },
    required: ['value'],
    additionalProperties: false
  },

  outputSchema: (_, {value}) => {
    const getSchema = value => {
      if (value === null) {
        return {type: 'null'};
      }
      if (typeof value === 'string') {
        if (value.length < 32) {
          return {type: 'string', minLength: value.length, maxLength: value.length, enum: [value]};
        }
        if (value.length < 128) {
          return {type: 'string', minLenght: value.length, maxLength: value.length};
        }
        return {type: 'string'};
      }
      if (typeof value === 'number') {
        if (~~value === value) {
          return {type: 'integer', minimum: value, maximum: value};
        }
        return {type: 'number', minimum: value, maximum: value};
      }
      if (Array.isArray(value)) {
        // @todo: Try to find a common type among all options.
        return {type: 'array', minItems: value.length, maxItems: value.length};
      }
      if (typeof value === 'object') {
        const properties = {};
        Object.keys(value).forEach(name => {
          properties[name] = getSchema(value[name]);
        });
        return {type: 'object', properties, required: Object.keys(value), additionalProperties: false};
      }
      if (typeof value === 'boolean') {
        return {type: 'boolean'};
      }
      return {};
    };
    return getSchema(value);
  },

  requires: [],

  tests: [{
    name: 'Null',
    input: {
      value: null
    },
    output: null,
    outputSchema: {type: 'null'}
  }, {
    name: 'Integer',
    input: {
      value: 12
    },
    output: 12,
    outputSchema: {type: 'integer', minimum: 12, maximum: 12}
  }, {
    name: 'Number',
    input: {
      value: 1.2
    },
    output: 1.2,
    outputSchema: {type: 'number', minimum: 1.2, maximum: 1.2}
  }, {
    name: 'Boolean',
    input: {
      value: true
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    name: 'Object',
    input: {
      value: {foo: 'bar', bar: 'baz'}
    },
    output: {foo: 'bar', bar: 'baz'},
    outputSchema: {type: 'object', properties: {
      foo: {type: 'string', minLength: 3, maxLength: 3, enum: ['bar']},
      bar: {type: 'string', minLength: 3, maxLength: 3, enum: ['baz']}
    }, required: ['foo', 'bar'], additionalProperties: false}
  }],

  execute: ({value}) => {
    return value;
  }
};
