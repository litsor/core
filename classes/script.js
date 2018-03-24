/* eslint-disable no-await-in-loop */
'use strict';

const {cloneDeep, defaults} = require('lodash');
const {get, set} = require('jsonpointer');

class Script {
  constructor({Container, Methods, Input}) {
    this.container = Container;
    this.methods = Methods;
    this.input = Input;
  }

  load(definition) {
    this.definition = definition;
  }

  getDefinition() {
    return this.definition;
  }

  async runStep(dataReference, index) {
    const step = this.definition.steps[index];
    const methodName = Object.keys(step)[0];
    const method = await this.methods.get(methodName);

    const inputData = this.input.get(dataReference, {
      ...(method.defaults || {}),
      ...step[methodName]
    });

    const dependencies = {};
    const promises = (method.requires || []).map(name => {
      return this.container.get(name);
    });
    (await Promise.all(promises)).forEach((item, index) => {
      dependencies[method.requires[index]] = item;
    });

    const outputData = await method.execute(inputData, dependencies);

    // Write output to the first of the following that is not undefined, or do not write
    // output when null is provided.
    const outputTarget = [
      step[methodName]._output,
      (method.defaults || {})._output,
      '/data'
    ].reduce((prev, curr) => typeof prev === 'undefined' ? curr : prev);
    if (outputTarget !== null) {
      if (outputTarget === '/') {
        if (typeof outputData !== 'object' || outputData === null) {
          return dataReference;
        }
        return outputData;
      }
      set(dataReference, outputTarget, outputData);
    }
    return dataReference;
  }

  async run(input, options) {
    options = defaults(options, {
      returnContext: false
    });
    const length = this.definition.steps.length;
    let data = cloneDeep(input || {});
    for (let i = 0; i < length; ++i) {
      data = await this.runStep(data, i);
    }
    return options.returnContext ? data : (typeof data.data === 'undefined' ? null : data.data);
  }
}

Script.require = ['Container', 'Methods', 'Input'];

module.exports = Script;
