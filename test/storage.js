/* eslint-env node, mocha */
"use strict";

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var Storage = require('../classes/Storage.js');

describe('Storage', function() {
  var storage;
  var temporary = {};

  before(function() {
  });

  after(function() {
  });

  it('can create new instance', function() {
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

  it('knows that is has a User model', function() {
    return storage.models.has('User').then((result) => {
      expect(result).to.equal(true);
    });
  });

  it('knows that is does not have a People model', function() {
    return storage.models.has('People').then((result) => {
      expect(result).to.equal(false);
    });
  });

  it('can create a User', function() {
    let query = `{
      createUser(name: "John", mail: "john@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result).to.have.property('createUser');
      expect(result.createUser).to.have.property('id');
      temporary = result.createUser;
    });
  });

  it('can read User', function() {
    let query = `{
      readUser(id: ?) {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readUser.id).to.equal(temporary.id);
      expect(result.readUser.name).to.equal(temporary.name);
      expect(result.readUser.mail).to.equal(temporary.mail);
    });
  });

  it('can list Users', function() {
    let query = `{
      listUser {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      // Other testcases may have added users as well, so check >= 1.
      expect(result.listUser.length >= 1).to.equal(true);
      let found = false;
      result.listUser.forEach(user => {
        if (user.id === temporary.id) {
          found = true;
          expect(user.name).to.equal(temporary.name);
          expect(user.mail).to.equal(temporary.mail);
        }
      });
      expect(found).to.equal(true);
    });
  });

  it('can create a second User', function() {
    let query = `{
      createUser(name: "Bob", mail: "bob@example.com") {
        id name mail
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result).to.have.property('createUser');
      expect(result.createUser).to.have.property('id');
    });
  });

  it('will list both Users', function() {
    let query = `{
      listUser {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      // Other testcases may have added users as well, so check >= 2.
      expect(result.listUser.length >= 2).to.equal(true);
    });
  });

  it('can filter list on indexed field', function() {
    let query = `{
      listUser(mail:"john@example.com") {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.listUser).to.have.length(1);
    });
  });

  it('can filter list on non-indexed field', function() {
    let query = `{
      listUser(name:"John") {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.listUser).to.have.length(1);
    });
  });

  it('can filter list on multiple fields', function() {
    let query = `{
      listUser(name:"John",mail:"bob@example.com") {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      // The combination with name and mail does not exist.
      expect(result.listUser).to.have.length(0);
    });
  });

  it('can count Users', function() {
    let query = `{
      countUser
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
   // Other testcases may have added users as well, so check >= 2.
      expect(result.countUser >= 2).to.equal(true);
    });
  });

  it('can count Users with filter', function() {
    let query = `{
      countUser (name:"John",mail:"john@example.com")
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.countUser).to.equal(1);
    });
  });

  it('can update User', function() {
    let query = `{
      updateUser(id: ?, name: "Alice") {
        id name mail
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.updateUser.id).to.equal(temporary.id);
      expect(result.updateUser.name).to.equal('Alice');
      expect(result.updateUser.mail).to.equal(temporary.mail);
    });
  });

  it('can delete User', function() {
    let query = `{
      deleteUser(id: ?)
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.deleteUser.id).to.equal(undefined);
    });
  });
});
