/* eslint-env node, mocha */
"use strict";

var Promise = require('bluebird');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

var Storage = require('../classes/Storage.js');

describe('References', function() {
  var storage;
  var temporary = {};

  var userId;
  var postId;

  before(function() {
    storage = new Storage({
      modelsDir: 'test/models'
    });
    let promises = [];
    let query;
    let args;
    let promise;
    query = `{user:createUser(name: "Alice", mail: "alice@example.com") { id }}`;
    return storage.query(query).then((result) => {
      userId = result.user.id;
      query = '{post:createPost(title:"Test",owner:?){id}}';
      args = [userId];
      return storage.query(query, args);
    }).then((result) => {
      postId = result.post.id;
    });
  });

  after(function() {
    return Promise.all([
      storage.query('{deleteUser(id:?)}', [userId]),
      storage.query('{deletePost(id:?)}', [postId])
    ]);
  });

  it('can get User via Post', function() {
    let query = `{
      Post(id:?) {
        owner {
          id
        }
      }
    }`;
    let args = [postId];
    return storage.query(query, args).then((result) => {
      expect(result.Post).to.have.property('owner');
      expect(result.Post.owner).to.have.property('id');
    });
  });

  it('will fetch extra fields of references item', function() {
    let query = `{
      Post(id:?) {
        owner {
          id
          name
        }
      }
    }`;
    let args = [postId];
    return storage.query(query, args).then((result) => {
      expect(result.Post).to.have.property('owner');
      expect(result.Post.owner).to.have.property('id');
      expect(result.Post.owner).to.have.property('name', 'Alice');
    });
  });

  it('can get Post via User (reverse link)', function() {
    let query = `{
      User(id:?) {
        id, posts {
          id
        }
      }
    }`;
    let args = [userId];
    return storage.query(query, args).then((result) => {
      expect(result.User).to.have.property('posts');
      expect(result.User.posts).to.have.length(1);
      expect(result.User.posts[0]).to.have.property('id', postId);
    });
  });

  it('can omit fieldnames in references', function() {
    let query = `{
      User(id:?) {
        id, posts
      }
    }`;
    let args = [userId];
    return storage.query(query, args).then((result) => {
      expect(result.User).to.have.property('posts');
      expect(result.User.posts).to.have.length(1);
      expect(result.User.posts[0]).to.have.property('id', postId);
    });
  });
});
