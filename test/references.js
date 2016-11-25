/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const Storage = require('../classes/storage');

describe('References', () => {
  let storage;

  let userId;
  let postId;

  before(() => {
    storage = new Storage({
      modelsDir: 'test/models',
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
        restapi: {
          engine: 'RestApi'
        }
      }
    });
    let query;
    let args;
    query = `{user:createUser(name: "Alice", mail: "alice@example.com") { id }}`;
    return storage.query(query).then(result => {
      userId = result.user.id;
      query = '{post:createPost(title:"Test",owner:$userId){id}}';
      args = {userId};
      return storage.query(query, args);
    }).then(result => {
      postId = result.post.id;
    });
  });

  after(() => {
    return Promise.all([
      storage.query('{deleteUser(id:$userId)}', {userId}),
      storage.query('{deletePost(id:$postId)}', {postId})
    ]);
  });

  it('can get User via Post', () => {
    const query = `{
      Post(id:$postId) {
        owner {
          id
        }
      }
    }`;
    const args = {postId};
    return storage.query(query, args).then(result => {
      expect(result.Post).to.have.property('owner');
      expect(result.Post.owner).to.have.property('id');
    });
  });

  it('will fetch extra fields of references item', () => {
    const query = `{
      Post(id:$postId) {
        owner {
          id
          name
        }
      }
    }`;
    const args = {postId};
    return storage.query(query, args).then(result => {
      expect(result.Post).to.have.property('owner');
      expect(result.Post.owner).to.have.property('id');
      expect(result.Post.owner).to.have.property('name', 'Alice');
    });
  });

  it('can get Post via User (reverse link)', () => {
    const query = `{
      User(id:$userId) {
        id, posts {
          id
        }
      }
    }`;
    const args = {userId};
    return storage.query(query, args).then(result => {
      expect(result.User).to.have.property('posts');
      expect(result.User.posts).to.have.length(1);
      expect(result.User.posts[0]).to.have.property('id', postId);
    });
  });

  it('can get Post via User (reverse link) without requesting id field', () => {
    const query = `{
      User(id:$userId) {
        posts {
          id
        }
      }
    }`;
    const args = {userId};
    return storage.query(query, args).then(result => {
      expect(result.User).to.have.property('posts');
      expect(result.User.posts).to.have.length(1);
      expect(result.User.posts[0]).to.have.property('id', postId);
    });
  });

  it('can omit fieldnames in references', () => {
    const query = `{
      User(id:$userId) {
        id, posts
      }
    }`;
    const args = {userId};
    return storage.query(query, args).then(result => {
      expect(result.User).to.have.property('posts');
      expect(result.User.posts).to.have.length(1);
      expect(result.User.posts[0]).to.have.property('id', postId);
    });
  });
});
