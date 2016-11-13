/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Storage = require('../classes/Storage.js');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Files', () => {
  let storage;
  let temporary = {};

  before(() => {
    storage = new Storage({
      modelsDir: 'test/files/models',
      databases: {
        internal: {
          engine: 'redis',
          host: 'localhost',
          port: 6379,
          prefix: '',
        },
        files: {
          engine: 'LocalFiles',
          directory: '/tmp/files'
        }
      }
    });
  });

  after(() => {
  });

  it('can create file', () => {
    let id;
    return storage.query('{createFile{id}}').then(result => {
      id = result.createFile.id;
      return storage.query('{File(id:?){id,finished}}', [id]);
    }).then(result => {
      expect(result.File).to.deep.equal({
        __type: 'File',
        id,
        finished: false
      });
    });
  });

  it('can add metadata to file', () => {
    let id;
    return storage.query('{createFile(filename:"test.txt",description:"Testfile"){id}}').then(result => {
      id = result.createFile.id;
      return storage.query('{File(id:?){id,filename,description}}', [id]);
    }).then(result => {
      expect(result.File.id).to.equal(id);
      expect(result.File.filename).to.equal('test.txt');
      expect(result.File.description).to.equal('Testfile');
    });
  });

  it('can update metadata', () => {
    let id;
    return storage.query('{createFile(filename:"test.txt",description:"Testfile"){id}}').then(result => {
      id = result.createFile.id;
      return storage.query('{File(id:?){id,filename,description}}', [id]);
    }).then(result => {
      expect(result.File.filename).to.equal('test.txt');
      expect(result.File.description).to.equal('Testfile');
      return storage.query('{updateFile(id:?,filename:"test2.txt"){id,filename}}', [id]);
    }).then(result => {
      return storage.query('{File(id:?){id,filename,description}}', [id]);
    }).then(result => {
      expect(result.File.filename).to.equal('test2.txt');
      expect(result.File.description).to.equal('Testfile');
    });
  });
});
