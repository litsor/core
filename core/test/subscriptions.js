/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const ws = require('ws');
const gql = require('graphql-tag');
const {ApolloClient} = require('apollo-client');
const {InMemoryCache} = require('apollo-cache-inmemory');
const {WebSocketLink} = require('apollo-link-ws');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Subscriptions', () => {
  const temporary = {};
  let container;
  let client;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/subscriptions',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
    await container.get('Endpoints');
    await container.get('GraphqlLinks');

    client = new ApolloClient({
      link: new WebSocketLink({
        uri: `ws://localhost:1234/graphql`,
        options: {
          reconnect: true,
          connectionParams: {
            'Authorization': 'Bearer ...'
          }
        },
        webSocketImpl: ws
      }),
      cache: new InMemoryCache(),
      ssrMode: false
    });

    await new Promise(resolve => setTimeout(resolve, 250));
  });

  after(async () => {
    await container.shutdown();
  });

  it('can execute query over websocket', async () => {
    const data = await client.query({
      query: gql`{
        listPost {
          count
        }
      }`
    });
    expect(data.data.listPost).to.have.property('count', 0);
  });

  it('can execute mutation over websocket', async () => {
    const authorData = await client.mutate({
      mutation: gql`mutation {
        author: createAuthor(input: {
          name: "John"
        }) {
          id
        }
      }`
    });
    expect(authorData.data.author).to.have.property('id');
    temporary.author = authorData.data.author.id;

    const data = await client.mutate({
      mutation: gql`mutation ($author: ID!) {
        post1: createPost(input: {
          title: "Test",
          body: "Lorem ipsum",
          created: 1564658565,
          author: $author
        }) {
          id
        }
        post2: createPost(input: {
          title: "Test",
          body: "Lorem ipsum",
          created: 1564658565,
          author: $author
        }) {
          id
        }
      }`,
      variables: {
        author: temporary.author
      }
    });
    expect(data.data.post1).to.have.property('id');
    temporary.post1 = data.data.post1.id;
    temporary.post2 = data.data.post2.id;
  });

  it('can subscribe to entity changes', async () => {
    let newData = null;
    const subscription = await client.subscribe({
      query: gql`subscription ($id: ID!) {
        Post(id: $id) {
          title
        }
      }`,
      variables: {
        id: temporary.post1
      }
    }).subscribe({
      next(data) {
        newData = data.data;
      },
      error(error) {
        console.log(error);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await client.mutate({
      mutation: gql`mutation ($id: ID!) {
        updatePost(id: $id, input: {
          title: "Updated title"
        }) {
          id
        }
      }`,
      variables: {
        id: temporary.post1
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(newData).to.be.an('object');
    expect(newData).to.have.property('Post');
    expect(newData.Post).to.have.property('title', 'Updated title');

    subscription.unsubscribe();
  });

  it('will not retrieve changes for other entities', async () => {
    let newData = null;
    const subscription = await client.subscribe({
      query: gql`subscription ($id: ID!) {
        Post(id: $id) {
          title
        }
      }`,
      variables: {
        id: temporary.post2
      }
    }).subscribe({
      next(data) {
        newData = data.data;
      },
      error(error) {
        console.log(error);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    await client.mutate({
      mutation: gql`mutation ($id: ID!) {
        updatePost(id: $id, input: {
          title: "Test..."
        }) {
          id
        }
      }`,
      variables: {
        id: temporary.post1
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(newData).to.equal(null);

    subscription.unsubscribe();
  });

  it('can subscribe to list', async () => {
    let newData = null;
    const subscription = await client.subscribe({
      query: gql`subscription {
        listPost {
          count
          items {
            title
          }
        }
      }`
    }).subscribe({
      next(data) {
        newData = data.data;
      },
      error(error) {
        console.log(error);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const data = await client.mutate({
      mutation: gql`mutation {
        post3: createPost(input: {
          title: "Test",
          body: "Lorem ipsum",
          created: 1564658565
        }) {
          id
        }
      }`
    });
    temporary.post3 = data.data.post3.id;

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(newData).to.be.an('object');
    expect(newData.listPost).to.have.property('count', 3);

    subscription.unsubscribe();
  });

  it('will receive changes on reverse link', async () => {
    let newData = null;
    const subscription = await client.subscribe({
      query: gql`subscription ($id: ID!) {
        Author(id: $id) {
          posts {
            count
          }
        }
      }`,
      variables: {
        id: temporary.author
      }
    }).subscribe({
      next(data) {
        newData = data.data;
      },
      error(error) {
        console.log(error);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const data = await client.mutate({
      mutation: gql`mutation ($author: ID!) {
        post4: createPost(input: {
          title: "Test",
          body: "Lorem ipsum",
          created: 1564658565,
          author: $author
        }) {
          id
        }
      }`,
      variables: {
        author: temporary.author
      }
    });
    temporary.post4 = data.data.post4.id;

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(newData).to.be.an('object');
    expect(newData.Author.posts).to.have.property('count', 3);

    subscription.unsubscribe();
  });
});
