/* eslint-env node, mocha */
'use strict';

const {resolve} = require('path');
const {camelCase} = require('lodash');
const chai = require('chai');
const globby = require('globby');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Methods', () => {
  let container;
  let Methods;
  let MethodTester;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'test/oauth',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });

    Methods = await container.get('Methods');
    MethodTester = await container.get('MethodTester');
  });

  after(async () => {
    await container.shutdown();
  });

  globby.sync('core/methods/**/*.js').filter(filename => {
    return !filename.endsWith('.test.js');
  }).forEach(filename => {
    const name = filename.match(/\/([^/]+)\.js$/)[1];
    it(name, async () => {
      const operators = {
        not: '!',
        equal: '==',
        notEqual: '!=',
        greaterThan: '>',
        greaterThanEqual: '>=',
        lessThan: '<',
        lessThanEqual: '<=',
        divide: '/',
        multiply: '*',
        plus: '+',
        minus: '-'
      };
      const methodName = camelCase(name);
      const method = await Methods.get(operators[methodName] || methodName);
      const passed = await MethodTester.test(method, resolve(filename), true);
      expect(passed).to.equal(true);
    });
  });
});
