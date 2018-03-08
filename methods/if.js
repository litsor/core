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
      thenScript: {
        name: 'Then',
        $ref: '#/definitions/Script'
      },
      elseScript: {
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
    input: {}
  },

  outputSchema: (_, {thenScript, elseScript}) => {
    if (!thenScript && !elseScript) {
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
      thenScript: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then-script provided, condition failed',
    input: {
      left: false,
      thenScript: [{static: {value: 1}}]
    },
    output: false,
    outputSchema: {}
  }, {
    name: 'Else-script provided, condition passed',
    input: {
      left: true,
      elseScript: [{static: {value: 1}}]
    },
    output: true,
    outputSchema: {}
  }, {
    name: 'Else-script provided, condition failed',
    input: {
      left: false,
      elseScript: [{static: {value: 1}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then and else provided, condition passed',
    input: {
      left: true,
      thenScript: [{static: {value: 1}}],
      elseScript: [{static: {value: 2}}]
    },
    output: 1,
    outputSchema: {}
  }, {
    name: 'Then and else provided, condition failed',
    input: {
      left: false,
      thenScript: [{static: {value: 1}}],
      elseScript: [{static: {value: 2}}]
    },
    output: 2,
    outputSchema: {}
  }],

  execute: async ({left, operator, right, thenScript, elseScript, input}, {Script}) => {
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
    if ((passed && !thenScript) || (!passed && !elseScript)) {
      // There is no script to execute. Only pass back if the condition passed.
      return passed;
    }
    Script.load({
      name: passed ? 'Then' : 'Else',
      steps: passed ? thenScript : elseScript
    });
    return Script.run(input);
  }
};
