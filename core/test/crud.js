/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('CRUD', () => {
  const temporary = {};
  let container;
  let graphql;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/crud',
      database: 'mysql:root:password@127.0.0.1/restapir',
      'recreate-db': true,
      'secret-key': 'test'
    });
    await container.get('Endpoints');
    await container.get('GraphqlLinks');
    graphql = await container.get('Graphql');
  });

  after(async () => {
    await container.shutdown();
  });

  it('can create item', async () => {
    const result = await graphql.query({
      query: `mutation {
        createPost(input: {
          title: "Test",
          body: "Test",
          created: 1234567890
        }) {
          id
        }
      }`
    });
    expect(result).to.have.property('createPost');
    expect(result.createPost).to.have.property('id');
    temporary.id = result.createPost.id;
  });

  it('can read post', async () => {
    const result = await graphql.query({
      query: `query readPost ($id: ID!) {
        Post(id: $id) {
          id
          title
          body
          created
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('Post');
    expect(result.Post).to.have.property('id', temporary.id);
    expect(result.Post).to.have.property('title', 'Test');
    expect(result.Post).to.have.property('body', 'Test');
    expect(result.Post).to.have.property('created', 1234567890);
  });

  it('can list posts', async () => {
    const result = await graphql.query({
      query: `{
        listPost(filters: {title: "Test"}) {
          count
          items {
            id
            title
            body
            created
          }
        }
      }`
    });
    expect(result).to.have.property('listPost');
    expect(result.listPost).to.have.property('count', 1);
    expect(result.listPost.items[0]).to.have.property('id', temporary.id);
    expect(result.listPost.items[0]).to.have.property('title', 'Test');
    expect(result.listPost.items[0]).to.have.property('body', 'Test');
    expect(result.listPost.items[0]).to.have.property('created', 1234567890);
  });

  it('can update post', async () => {
    const result = await graphql.query({
      query: `mutation updatePost ($id: ID!) {
        updatePost(id: $id, input: {
          title: "Test2",
          body: "Test3",
          created: 1534567890
        }) {
          id
          title
          body
          created
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('updatePost');
    expect(result.updatePost).to.have.property('id', temporary.id);
    expect(result.updatePost).to.have.property('title', 'Test2');
    expect(result.updatePost).to.have.property('body', 'Test3');
    expect(result.updatePost).to.have.property('created', 1534567890);
  });

  it('can update specific fields', async () => {
    const result = await graphql.query({
      query: `mutation updatePost ($id: ID!) {
        updatePost(id: $id, input: {
          body: "Test4"
        }) {
          id
          body
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('updatePost');
    expect(result.updatePost).to.have.property('id', temporary.id);
    expect(result.updatePost).to.have.property('body', 'Test4');
  });

  it('can delete post', async () => {
    const result = await graphql.query({
      query: `mutation deletePost ($id: ID!) {
        deletePost(id: $id) {
          id
          title
          body
          created
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('deletePost');
    // The return value is expected to be the deleted Post object.
    expect(result.deletePost).to.have.property('id', temporary.id);
    expect(result.deletePost).to.have.property('title', 'Test2');
    expect(result.deletePost).to.have.property('body', 'Test4');
    expect(result.deletePost).to.have.property('created', 1534567890);
    const listAfterDelete = await graphql.query({
      query: `query listPost {
        listPost(filters: {title: "Test2"}) {
          count
        }
      }`
    });
    expect(listAfterDelete.listPost).to.have.property('count', 0);
  });

  it('can create item with array field', async () => {
    const result = await graphql.query({
      query: `mutation {
        createPost(input: {
          title: "Test",
          body: "Test",
          created: 1234567890,
          tags: ["a", "b"]
        }) {
          id
        }
      }`
    });
    expect(result).to.have.property('createPost');
    expect(result.createPost).to.have.property('id');
    temporary.id = result.createPost.id;
  });

  it('can read array field', async () => {
    const result = await graphql.query({
      query: `query readPost ($id: ID!) {
        Post(id: $id) {
          tags
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('Post');
    expect(result.Post).to.have.property('tags');
    expect(result.Post.tags).to.deep.equal(['a', 'b']);
  });

  it('can create item with object field', async () => {
    const result = await graphql.query({
      query: `mutation {
        createPost(input: {
          title: "Test",
          body: "Test",
          created: 1234567890,
          properties: {foo: "bar"}
        }) {
          id
        }
      }`
    });
    expect(result).to.have.property('createPost');
    expect(result.createPost).to.have.property('id');
    temporary.id = result.createPost.id;
  });

  it('can read object field', async () => {
    const result = await graphql.query({
      query: `query readPost ($id: ID!) {
        Post(id: $id) {
          properties
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('Post');
    expect(result.Post).to.have.property('properties');
    expect(result.Post.properties).to.deep.equal({foo: 'bar'});
  });

  it('can update object field', async () => {
    const result = await graphql.query({
      query: `mutation updatePost ($id: ID!) {
        updatePost(id: $id, input: {
          properties: {bar: "baz"}
        }) {
          id
          properties
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('updatePost');
    expect(result.updatePost).to.have.property('id', temporary.id);
    expect(result.updatePost).to.have.property('properties');
    expect(result.updatePost.properties).to.deep.equal({bar: 'baz'});
  });

  it.skip('validates the schema for array fields', async () => {
    const result = await graphql.query({
      query: `mutation {
        createPost(input: {
          title: "Test",
          body: "Test",
          created: 1234567890,
          tags: ["too long text"]
        }) {
          id
        }
      }`
    });
    expect(result).to.have.property('createPost');
    expect(result.createPost).to.not.have.property('id');
    temporary.id = result.createPost.id;
  });

});
