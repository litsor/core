/* eslint-disable no-await-in-loop */
'use strict';

const {isIndexed, isKeyed, isImmutable, fromJS} = require('immutable');
const {cloneDeep, isEqual} = require('lodash');
const validator = require('is-my-json-valid');
const reload = require('require-reload')(require);

class MethodTester {
  constructor({JsonSchema, Immutable}) {
    this.jsonSchema = JsonSchema;
    this.immutable = Immutable;
  }

  async runTest(method, {startupTest, shutdownTest, mockups}, test) {
    const type = typeof test.input === 'undefined' ? 'binary' : 'unary';

    mockups = {
      ...(mockups || {}),
      Immutable: this.immutable
    };

    const inputs = type === 'unary' ? ['input'] : ['left', 'right'];
    const inputData = {};
    for (let i = 0; i < inputs.length; ++i) {
      const input = inputs[i];
      inputData[input] = method.lazy ? test[input] : fromJS(test[input]);
      const inputSchema = method[`${input}Schema`];
      if (inputSchema) {
        inputSchema.title = inputSchema.title || input;
      }
      const inputSchemaValidation = this.jsonSchema.validate(inputSchema, true);
      if (inputSchemaValidation !== true) {
        console.log('Invalid ' + input + ' schema: ' + inputSchemaValidation);
        return false;
      }
      if (!method.lazy) {
        const validateInput = validator(inputSchema);
        if (!validateInput(test[input])) {
          console.log('Test input does not pass input schema: ' + validateInput.error);
          return false;
        }
      }
    }

    const context = {
      data: fromJS({}),
      methodState: null
    };

    let raisedError = false;
    let output;
    try {
      await (startupTest || (async () => {})).bind(method)();
      if (type === 'unary') {
        output = await method.unary(fromJS(inputData.input), mockups, context);
      } else {
        const left = method.lazy && typeof inputData.left !== 'function' ? () => fromJS(inputData.left) : fromJS(inputData.left);
        const right = method.lazy && typeof inputData.right !== 'function' ? () => fromJS(inputData.right) : fromJS(inputData.right);
        output = await method.binary(left, right, mockups, context);
      }
      if (!isImmutable(output) && (output !== null && typeof output === 'object')) {
        throw new Error('Output must be provided as immutable');
      }
      output = isImmutable(output) ? output.toJS() : output;
      await (shutdownTest || (async () => {})).bind(method)();
    } catch (err) {
      await (shutdownTest || (async () => {})).bind(method)();
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
    }

    return true;
  }

  async test(method, filename, quiet) {
    let tests;
    try {
      tests = reload(filename.replace(/\.js$/, '.test.js'));
      if (!Array.isArray(tests.tests)) {
        throw new Error('Missing tests');
      }
    } catch (err) {
      console.log('No test found for ' + method.name);
      return false;
    }

    let passed = 0;
    let failed = 0;
    const count = tests.tests.length;
    for (let i = 0; i < count; ++i) {
      const test = tests.tests[i];
      let result;
      try {
        result = await this.runTest(method, tests, test);
      } catch (err) {
        console.log(err);
        result = false;
      }
      if (result) {
        ++passed;
      } else {
        console.log(`Failed: cannot ${test.can}`);
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
MethodTester.require = ['JsonSchema', 'Immutable'];

module.exports = MethodTester;
