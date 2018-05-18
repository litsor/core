/* eslint-disable no-await-in-loop */
'use strict';

const {cloneDeep, isEqual} = require('lodash');
const validator = require('is-my-json-valid');

class MethodTester {
  constructor({JsonSchema}) {
    this.jsonSchema = JsonSchema;
  }

  async runTest(method, test) {
    const input = cloneDeep(test.input);

    const defaultInputSchema = {
      type: 'object',
      properties: {}
    };

    const inputSchemaValidation = this.jsonSchema.validate(method.inputSchema, true);
    if (inputSchemaValidation !== true) {
      console.log('Invalid input schema: ' + inputSchemaValidation);
      return false;
    }

    const validateInput = validator(method.inputSchema);
    if (!validateInput(test.input)) {
      console.log('Test input does not pass input schema: ' + validateInput.error);
      return false;
    }

    const outputSchema = method.outputSchema(test.inputSchema || defaultInputSchema, test.input);
    const outputSchemaValidation = this.jsonSchema.validate(outputSchema, false);
    if (outputSchemaValidation !== true) {
      console.log('Invalid output schema: ' + outputSchemaValidation, outputSchema);
      return false;
    }

    let raisedError = false;
    let output;
    try {
      await (method.startupTest || (async () => {})).bind(method)();
      output = await method.execute({...(method.defaults || {}), ...input}, method.mockups);
      await (method.shutdownTest || (async () => {})).bind(method)();
    } catch (err) {
      await (method.shutdownTest || (async () => {})).bind(method)();
      raisedError = true;
      if (typeof test.error === 'function') {
        // Exceptions must be validated by a callback.
        if (!test.error(err)) {
          console.error('Exception: ', err);
          return false;
        }
      } else {
        console.error('Exception: ', err);
        return false;
      }
    }

    if (!raisedError) {
      if (typeof test.output === 'function') {
        if (!await test.output(output)) {
          console.log('Output is not valid in test: ', output);
          return false;
        }
      } else if (!isEqual(output, test.output)) {
        console.log('Output does not match output given in test: ', output);
        return false;
      }

      const validateOutput = validator(outputSchema);
      if (!validateOutput(output)) {
        console.log('Output does not match output schema: ' + validateOutput.error);
        return false;
      }
    }

    if (!isEqual(input, test.input)) {
      console.log('Input object was changed, clone object before modifying');
      return false;
    }

    return true;
  }

  async test(method, quiet) {
    let passed = 0;
    let failed = 0;
    const count = method.tests.length;
    for (let i = 0; i < count; ++i) {
      const test = method.tests[i];
      let result;
      try {
        result = await this.runTest(method, test);
      } catch (err) {
        console.log(err);
        result = false;
      }
      if (result) {
        ++passed;
      } else {
        console.log(`Failed: ${test.title}`);
        ++failed;
      }
    }
    if (!quiet) {
      console.log(`Test result for ${method.title}: ${passed} passed, ${failed} failed`);
    }
    return failed === 0;
  }
}

MethodTester.singleton = true;
MethodTester.require = ['JsonSchema'];

module.exports = MethodTester;
