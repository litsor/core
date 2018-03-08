/* eslint-disable no-await-in-loop */
'use strict';

const {cloneDeep, isEqual, defaults} = require('lodash');
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
      console.log('Invalid output schema: ' + inputSchemaValidation);
      return false;
    }

    let output;
    try {
      output = await method.execute({...(method.defaults || {}), ...input}, method.mockups);
    } catch (err) {
      console.error('Exception: ', err);
      return false;
    }

    if (!isEqual(output, test.output)) {
      console.log('Output does not match output given in test: ', output);
      return false;
    }

    const validateOutput = validator(outputSchema);
    if (!validateOutput(output)) {
      console.log('Output does not match output schema: ' + validateOutput.error);
      return false;
    }

    if (!isEqual(input, test.input)) {
      console.log('Input object was changed, clone object before modifying');
      return false;
    }

    return true;
  }

  async test(method) {
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
        console.log(`Failed: ${test.name}`);
        ++failed;
      }
    }
    console.log(`Test result for ${method.name}: ${passed} passed, ${failed} failed`);
  }
}

MethodTester.singleton = true;
MethodTester.require = ['JsonSchema'];

module.exports = MethodTester;
