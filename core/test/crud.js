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
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
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
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('deletePost');
    // The return value is expected to have the deleted id.
    expect(result.deletePost).to.have.property('id', temporary.id);
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
          title: "Test property",
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

  it('can read object field in list query', async () => {
    const result = await graphql.query({
      query: `query {
        listPost(filters: {title: "Test property"}) {
          items {
            properties
          }
        }
      }`,
      variables: {}
    });
    expect(result.listPost.items).to.have.length(1);
    expect(result.listPost.items[0]).to.have.property('properties');
    expect(result.listPost.items[0].properties).to.deep.equal({foo: 'bar'});
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

  it('will return null for empty references', async () => {
    const result = await graphql.query({
      query: `query readPost ($id: ID!) {
        Post(id: $id) {
          author {
            id
            name
          }
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('Post');
    expect(result.Post).to.have.property('author');
    expect(result.Post.author).to.be.a('null');
  });

  it('can read referenced field', async () => {
    const authorResult = await graphql.query({
      query: `mutation {
        createAuthor (input: {name: "John"}) {
          id
        }
      }`
    });
    temporary.authorId = authorResult.createAuthor.id;

    await graphql.query({
      query: `mutation ($id: ID!, $input: PostUpdateInput!) {
        updatePost (id: $id, input: $input) {
          id
        }
      }`,
      variables: {
        id: temporary.id,
        input: {author: temporary.authorId}
      }
    });

    const result = await graphql.query({
      query: `query readPost ($id: ID!) {
        Post(id: $id) {
          author {
            id
            name
          }
        }
      }`,
      variables: {id: temporary.id}
    });
    expect(result).to.have.property('Post');
    expect(result.Post).to.have.property('author');
    expect(result.Post.author).to.have.property('id', temporary.authorId);
    expect(result.Post.author).to.have.property('name', 'John');
  });

  it('will read references in lists', async () => {
    const cresateResult = await graphql.query({
      query: `mutation ($input: PostInput!) {
        createPost(input: $input) {
          id
        }
      }`,
      variables: {
        input: {
          title: "List references test",
          body: "Test",
          created: 1234567890,
          author: temporary.authorId
        }
      }
    });
    expect(cresateResult).to.have.property('createPost');
    expect(cresateResult.createPost).to.have.property('id');
    temporary.id = cresateResult.createPost.id;

    const result = await graphql.query({
      query: `query listPost ($filters: PostFilterSet!) {
        listPost(filters: $filters) {
          items {
            author {
              id
              name
            }
          }
        }
      }`,
      variables: {
        filters: {
          author: temporary.authorId
        }
      }
    });
    expect(result.listPost.items[0]).to.have.property('author');
    expect(result.listPost.items[0].author).to.have.property('name', 'John');
  });

  it('can read reverse references', async () => {
    const authorResult = await graphql.query({
      query: `mutation {
        createAuthor (input: {name: "John"}) {
          id
        }
      }`
    });
    temporary.authorId = authorResult.createAuthor.id;
    await graphql.query({
      query: `mutation ($input: PostInput!) {
        createPost (input: $input) {
          id
        }
      }`,
      variables: {
        input: {title: "Test", body: "Test", created: 1234, author: temporary.authorId}
      }
    });

    const result = await graphql.query({
      query: `query ($id: ID!) {
        Author(id: $id) {
          posts {
            count
            items {
              title
            }
          }
        }
      }`,
      variables: {
        id: temporary.authorId
      }
    });
    expect(result).to.have.property('Author');
    expect(result.Author).to.have.property('posts');
    expect(result.Author.posts).to.have.property('count', 1);
    expect(result.Author.posts).to.have.property('items');
    expect(result.Author.posts.items[0]).to.have.property('title', 'Test');
  });

  it('can provide order in reverse link', async () => {
    await graphql.query({
      query: `mutation ($input: PostInput!) {
        createPost (input: $input) {
          id
        }
      }`,
      variables: {
        input: {title: "Another post", body: "Test", created: 1234, author: temporary.authorId}
      }
    });
    const query = async (order) => await graphql.query({
      query: `query ($id: ID!, $order: [OrderFieldInput]) {
        Author(id: $id) {
          posts (order: $order) {
            count
            items {
              title
            }
          }
        }
      }`,
      variables: {
        id: temporary.authorId,
        order: [order]
      }
    });
    expect((await query({
      field: 'title',
      direction: 'ASC'
    })).Author.posts.items[0].title).to.equal('Another post');
    expect((await query({
      field: 'title',
      direction: 'DESC'
    })).Author.posts.items[0].title).to.equal('Test');
  });

  it('can filter in reverse link', async () => {
    const result = await graphql.query({
      query: `query ($id: ID!) {
        Author(id: $id) {
          posts (filters: {title: "Another post"}) {
            count
          }
        }
      }`,
      variables: {
        id: temporary.authorId
      }
    });
    expect(result.Author.posts.count).to.equal(1);
  });

});
