/* eslint-disable eqeqeq */
'use strict';

module.exports = {
  title: 'If',
  description: 'Check condition and run if/else script',
  cache: 0,

  inputSchema: {
    type: 'object',
    properties: {
      left: {
        title: 'Left operand'
      },
      operator: {
        title: 'Operator',
        type: 'string',
        enum: ['==', '===', '<', '<=', '=>', '>', '!=', '!==', 'startsWith', 'endsWith', 'contains']
      },
      right: {
        title: 'Right operand'
      },
      then: {
        title: 'Then',
        $ref: '#/definitions/Script'
      },
      else: {
        title: 'Else',
        $ref: '#/definitions/Script'
      },
      input: {
        title: 'Script input',
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
    title: 'Minimal options',
    input: {
      left: true
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    title: 'Non-default operator',
    input: {
      left: 3,
      operator: '<',
      right: 1
    },
    output: false,
    outputSchema: {type: 'boolean'}
  }, {
    title: 'Then-script provided, condition passed',
    input: {
      left: true,
      then: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    title: 'Then-script provided, condition failed',
    input: {
      left: false,
      then: [{static: {value: 1}}]
    },
    output: false,
    outputSchema: {}
  }, {
    title: 'Else-script provided, condition passed',
    input: {
      left: true,
      else: [{static: {value: 1}}]
    },
    output: true,
    outputSchema: {}
  }, {
    title: 'Else-script provided, condition failed',
    input: {
      left: false,
      else: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    title: 'Then and else provided, condition passed',
    input: {
      left: true,
      then: [{static: {value: 1}}],
      else: [{static: {value: 2}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    title: 'Then and else provided, condition failed',
    input: {
      left: false,
      then: [{static: {value: 1}}],
      else: [{static: {value: 2}}]
    },
    output: 2,
    outputSchema: {}
  }, {
    title: 'Check if object exist',
    input: {
      left: {}
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    title: 'String starts with',
    input: {
      left: 'test',
      operator: 'startsWith',
      right: 't'
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    title: 'String ends with',
    input: {
      left: 'test',
      operator: 'endsWith',
      right: 't'
    },
    output: true,
    outputSchema: {type: 'boolean'}
  }, {
    title: 'String contains',
    input: {
      left: 'test',
      operator: 'contains',
      right: 'e'
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
      '>': left > right,
      startsWith: String(left).startsWith(String(right)),
      endsWith: String(left).endsWith(String(right)),
      contains: String(left).indexOf(String(right)) >= 0
    }[operator];
    if ((passed && !options.then) || (!passed && !options.else)) {
      // There is no script to execute. Only pass back if the condition passed.
      return passed;
    }
    Script.load({
      title: passed ? 'Then' : 'Else',
      steps: passed ? options.then : options.else
    });
    return Script.run(input, {returnContext: true});
  }
};
