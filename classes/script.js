/* eslint-disable no-await-in-loop */
'use strict';

const {cloneDeep} = require('lodash');
const {get, set} = require('jsonpointer');

class Script {
  constructor({Container, Methods}) {
    this.container = Container;
    this.methods = Methods;
  }

  load(definition) {
    this.definition = definition;
  }

  getDefinition() {
    return this.definition;
  }

  async runStep(dataReference, index) {
    const step = this.definition.steps[index];
    const methodName = Object.keys(step);
    const method = await this.methods.get(methodName);

    const inputData = {};
    Object.keys(step[methodName]).filter(value => value !== 'output').forEach(key => {

      if (typeof step[methodName][key] === 'string' && step[methodName][key].startsWith('/')) {
        inputData[key] = get(dataReference, step[methodName][key] === '/' ? '' : step[methodName][key]);
      } else {
        inputData[key] = step[methodName][key];
      }
    });

    const dependencies = {};
    const promises = (method.requires || []).map(name => {
      return this.container.get(name);
    });
    (await Promise.all(promises)).forEach((item, index) => {
      dependencies[method.requires[index]] = item;
    });

    const outputData = await method.execute({...(method.defaults || {}), ...inputData}, dependencies);

    set(dataReference, step[methodName].output || '/data', outputData);
  }

  async run(input) {
    const length = this.definition.steps.length;
    const data = cloneDeep(input || {});
    for (let i = 0; i < length; ++i) {
      await this.runStep(data, i);
    }
    return typeof data.data === 'undefined' ? null : data.data;
  }
}

Script.require = ['Container', 'Methods'];

module.exports = Script;
