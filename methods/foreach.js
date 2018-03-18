/* eslint-disable eqeqeq */
'use strict';

module.exports = {
  name: 'Foreach',
  description: 'Execute subscript for each element in array',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      input: {
        name: 'Script input',
        type: 'array'
      },
      as: {
        name: 'Item variable',
        type: 'string'
      },
      do: {
        name: 'Script',
        $ref: '#/definitions/Script'
      }
    },
    required: ['input', 'do'],
    additionalProperties: false
  },

  defaults: {
    _output: null,
    as: 'item'
  },

  outputSchema: () => {
    return {};
  },

  requires: ['Script'],

  mockups: {
    Script: {
      load(definition) {
        this.definition = definition;
      },
      run() {
        return this.definition.steps[0].static.value;
      }
    }
  },

  tests: [{
    name: 'Minimal options',
    input: {
      input: [1, 2, 3],
      do: [
        {static: {value: 'test'}}
      ]
    },
    output: {},
    outputSchema: {}
  }],

  execute: async (options, {Script}) => {
    Script.load({
      name: 'Do',
      steps: options.do
    });
    const promises = options.input.map(item => {
      return Script.run({
        ...options.input,
        [options.as]: item
      });
    });
    await Promise.all(promises);
    return {};
  }
};
