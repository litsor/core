/* eslint-env node, mocha */
"use strict";

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var Storage = require('../classes/Storage.js');

describe('Query', function() {
  var storage;
  var temporary = {};

  before(function() {
    storage = new Storage({
      modelsDir: 'test/models'
    });
  });

  after(function() {
  });

  it('fails on misformatted queries', function() {
    return new Promise(function() {
      let query = `{...}`;
      return storage.query(query)
    }).then(() => {
      throw Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });

  it('fails on unknown operations', function() {
    return new Promise(function() {
      let query = `{writePost}`;
      return storage.query(query)
    }).then(() => {
      throw Error('should be rejected');
    }).catch((error) => {
      expect(error.message).to.match(/^Query error: /);
    }).done();
  });
  
  it('can create data with strings', function() {
    let query = `{
      createPost(teststring:"This is a test") {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with strings', function() {
    let query = `{
      readPost(id:?) {
        teststring
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('teststring', 'This is a test');
    });
  });
  
  it('can create data with integers', function() {
    let query = `{
      createPost(testint:123) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with integers', function() {
    let query = `{
      readPost(id:?) {
        testint
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testint', 123);
    });
  });
  
  it('can create data with floats', function() {
    let query = `{
      createPost(testfloat:1.23) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with floats', function() {
    let query = `{
      readPost(id:?) {
        testfloat
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testfloat', 1.23);
    });
  });
  
  it('can create data with objects', function() {
    let query = `{
      createPost(testobject:{foo:"bar"}) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with objects', function() {
    let query = `{
      readPost(id:?) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({foo: 'bar'});
    });
  });
  
  it('can create data with lists', function() {
    let query = `{
      createPost(testlist:[{},{}]) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with lists', function() {
    let query = `{
      readPost(id:?) {
        testlist
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testlist');
      expect(result.readPost.testlist).to.deep.equal([{},{}]);
    });
  });
  
  it('can create data with booleans', function() {
    let query = `{
      createPost(testboolean:true) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with booleans', function() {
    let query = `{
      readPost(id:?) {
        testboolean
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testboolean');
      expect(result.readPost.testboolean).to.equal(true);
    });
  });
    
  it('allows us to omit "read" for read operations', function() {
    let query = `{
      Post(id:?) {
        id
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result).to.have.property('Post');
      expect(result.Post).to.have.property('id');
    });
  });

  it('allows using aliases', function() {
    let query = `{
      p: Post(id:?) {
        id
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result).to.have.property('p');
      expect(result.p).to.have.property('id');
    });
  });
  
  it('can create data with empty objects', function() {
    let query = `{
      createPost(testobject:{}) {
        id
      }
    }`;
    return storage.query(query).then((result) => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });
  
  it('can get data with empty objects', function() {
    let query = `{
      readPost(id:?) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({});
    });
  });
  
  it.skip('can unset value by updating with undefined', function() {
    let query = `{
      updatePost(id:?,testobject:undefined) {
        testobject
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.not.have.property('testobject');
    });
  });
  
  it('will fill nulls in fields without a value', function() {
    let query = `{
      readPost(id:?) {
        title
      }
    }`;
    let id = temporary.id;
    return storage.query(query, [id]).then((result) => {
      expect(result.readPost).to.have.property('title');
      expect(result.readPost.title).to.equal(null);
    });
  });
});
