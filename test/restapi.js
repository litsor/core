/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Storage = require('../classes/Storage.js');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('RestApi', () => {
  let storage;
  let temporary = {};

  before(() => {
    storage = new Storage({
      modelsDir: 'test/models',
      databases: {
        internal: {
          engine: 'redis',
          host: 'localhost',
          port: 6379,
          prefix: '',
        },
        rethink: {
          engine: 'RethinkDB',
          host: 'localhost',
          port: 28015,
          name: 'test'
        },
        restapi: {
          engine: 'RestApi'
        }
      }
    });
  });

  after(() => {
  });

  it('can get data', () => {
    const query = `{
      readExternal(id:?) {
        title
      }
    }`;
    const id = '123';
    return storage.query(query, [id]).then(result => {
      expect(result.readExternal).to.have.property('title', 'Test');
    });
  });
});
