/* eslint-env node, mocha */
'use strict';

const Crypto = require('crypto');

const Bluebird = require('bluebird');
const Needle = Bluebird.promisifyAll(require('needle'));
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Application = require('../classes/application');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe.only('Files', () => {
  let app;
  let storage;

  const uri = 'http://localhost:10023';

  before(() => {
    app = new Application({
      port: 10023,
      storage: {
        modelsDir: 'test/files/models',
        databases: {
          internal: {
            engine: 'redis',
            host: 'localhost',
            port: 6379,
            prefix: ''
          },
          rethink: {
            engine: 'RethinkDB',
            host: 'localhost',
            port: 28015,
            name: 'test'
          },
          files: {
            engine: 'LocalFiles',
            directory: '/tmp/files'
          }
        }
      }
    });
    storage = app.storage;
    return app.ready();
  });

  after(() => {
    return app.close();
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
    }).then(() => {
      return storage.query('{File(id:?){id,filename,description}}', [id]);
    }).then(result => {
      expect(result.File.filename).to.equal('test2.txt');
      expect(result.File.description).to.equal('Testfile');
    });
  });

  it('can post a file using multipart request', () => {
    let id;
    const body = Crypto.randomBytes(8).toString('base64');
    const input = {
      file: {
        buffer: new Buffer(body),
        filename: 'test.txt',
        content_type: 'text/plain'
      }
    };
    const options = {multipart: true};
    return Needle.postAsync(uri + '/file/File', input, options).then(response => {
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('id');
      id = response.body.id;
      return Needle.getAsync(uri + '/file/File/' + id).then(response => {
        expect(response.statusCode).to.equal(200);
        expect(response.body.toString()).to.equal(body);
      });
    });
  });
});
