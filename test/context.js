/* eslint-env node, mocha */
"use strict";

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var Storage = require('../classes/Storage.js');
var Context = require('../classes/Context.js');

describe('Context', function() {
  var storage;
  var temporary = {};
  
  var regularUser1;
  var regularUser2;
  var adminUser;

  before(function() {
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
          host: 'rethink',
          port: 20015,
          name: 'test'
        }
      }
    });
    let promises = [];
    let query;
    let promise;
    query = `{user:createUser(name: "Alice", mail: "alice@example.com") { id }}`;
    promise = storage.query(query).then((result) => {
      regularUser1 = result.user.id;
    });
    promises.push(promise);
    query = `{user:createUser(name: "Bob", mail: "bob@example.com") { id }}`;
    promise = storage.query(query).then((result) => {
      regularUser2 = result.user.id;
    });
    promises.push(promise);
    query = `{user:createUser(name: "Chris", mail: "chris@example.com", admin: {}) { id }}`;
    promise = storage.query(query).then((result) => {
      adminUser = result.user.id;
    });
    promises.push(promise);
    return Promise.all(promises);
  });

  after(function() {
    return Promise.all([
      storage.query('{deleteUser(id:?)}', [regularUser1]),
      storage.query('{deleteUser(id:?)}', [regularUser2]),
      storage.query('{deleteUser(id:?)}', [adminUser])
    ]);
  });

  it('can get current user profile', function() {
    let context = new Context();
    context.setUser({id: regularUser1});
    let query = `{
      User {
        id
        name
      }
    }`;
    return storage.query(query, context).then((result) => {
      expect(result.User).to.have.property('id', regularUser1);
      expect(result.User).to.have.property('name', 'Alice');
    });
  });

  it('can create post as user', function() {
    let context = new Context();
    context.setUser({id: regularUser1});
    let query = `{
      createPost(owner:?) {
        id
      }
    }`;
    let args = [regularUser1];
    return storage.query(query, context, args).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can read post as owner', function() {
    let context = new Context();
    context.setUser({id: regularUser1});
    let query = `{
      Post(id:?) {
        id
      }
    }`;
    let args = [temporary.id];
    return storage.query(query, context, args).then((result) => {
      expect(result.Post).to.have.property('id');
    });
  });

  it('accepts reads of public items by other users', function() {
    let context = new Context();
    context.setUser({id: regularUser2});
    let query = `{
      Post(id:?) {
        id
      }
    }`;
    let args = [temporary.id];
    return storage.query(query, context, args).then((result) => {
      expect(result.Post).to.have.property('id');
    });
  });

  it('accepts update post as owner', function() {
    let context = new Context();
    context.setUser({id: regularUser1});
    let query = `{
      updatePost(id:?,title:"Test") {
        id
      }
    }`;
    let args = [temporary.id];
    return storage.query(query, context, args).then((result) => {
      expect(result.updatePost).to.have.property('id');
    });
  });

  it('denies update post as other user', function() {
    let context = new Context();
    context.setUser({id: regularUser2});
    let query = `{
      updatePost(id:?,title:"Test") {
        id
      }
    }`;
    let args = [temporary.id];
    return Promise.resolve().then(() => {
      return storage.query(query, context, args);
    }).then(() => {
      throw Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('denies update post as anonymous user', function() {
    let context = new Context();
    let query = `{
      updatePost(id:?,title:"Test") {
        id
      }
    }`;
    let args = [temporary.id];
    return Promise.resolve().then(() => {
      return storage.query(query, context, args);
    }).then(() => {
      throw Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('accepts update post as admin', function() {
    let context = new Context();
    context.setUser({id: adminUser, admin: true});
    let query = `{
      updatePost(id:?,title:"Admin edit") {
        id
      }
    }`;
    let args = [temporary.id];
    return storage.query(query, context, args).then((result) => {
      expect(result.updatePost).to.have.property('id');
    });
  });
});
