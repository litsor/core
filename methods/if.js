/* eslint-disable eqeqeq */
'use strict';

module.exports = {
  name: 'If',
  description: 'Check condition and run if/else script',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      left: {
        name: 'Left operand'
      },
      operator: {
        name: 'Operator',
        type: 'string',
        enum: ['==', '===', '<', '<=', '=>', '>', '!=', '!==']
      },
      right: {
        name: 'Right operand'
      },
      then: {
        name: 'Then',
        $ref: '#/definitions/Script'
      },
      else: {
        name: 'Else',
        $ref: '#/definitions/Script'
      },
      input: {
        name: 'Script input',
        type: 'object'
      }
    },
    required: ['left'],
    additionalProperties: false
  },

  defaults: {
    operator: '==',
    right: true,
    input: '/',
    _output: '/'
  },

  outputSchema: (_, options) => {
    if (!options.then && !options.else) {
      return {type: 'boolean'};
    }
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
      left: true
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    name: 'Non-default operator',
    input: {
      left: 3,
      operator: '<',
      right: 1
    },
    output: false,
    outputSchema: {type: 'boolean'}
  }, {
    name: 'Then-script provided, condition passed',
    input: {
      left: true,
      then: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then-script provided, condition failed',
    input: {
      left: false,
      then: [{static: {value: 1}}]
    },
    output: false,
    outputSchema: {}
  }, {
    name: 'Else-script provided, condition passed',
    input: {
      left: true,
      else: [{static: {value: 1}}]
    },
    output: true,
    outputSchema: {}
  }, {
    name: 'Else-script provided, condition failed',
    input: {
      left: false,
      else: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then and else provided, condition passed',
    input: {
      left: true,
      then: [{static: {value: 1}}],
      else: [{static: {value: 2}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then and else provided, condition failed',
    input: {
      left: false,
      then: [{static: {value: 1}}],
      else: [{static: {value: 2}}]
    },
    output: 2,
    outputSchema: {}
  }, {
    name: 'Check if object exist',
    input: {
      left: {}
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }],

  execute: async (options, {Script}) => {
    const {operator, right, input} = options;

    // It is more convenient to cast the left operand to a boolean first when it is compared
    // to a boolean. This allows us to check if an object is present with only passing
    // the left operand.
    const left = typeof right === 'boolean' ? Boolean(options.left) : options.left;

    const passed = {
      '==': left == right,
      '===': left === right,
      '!=': left != right,
      '!==': left !== right,
      '<': left < right,
      '<=': left <= right,
      '>=': left >= right,
      '>': left > right
    }[operator];
    if ((passed && !options.then) || (!passed && !options.else)) {
      // There is no script to execute. Only pass back if the condition passed.
      return passed;
    }
    Script.load({
      name: passed ? 'Then' : 'Else',
      steps: passed ? options.then : options.else
    });
    return Script.run(input, {returnContext: true});
  }
};
