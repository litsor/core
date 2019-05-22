/* eslint-env node, mocha */
'use strict';

const {randomBytes} = require('crypto');
const chai = require('chai');
const FormData = require('form-data');
const fetch = require('node-fetch');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Links', () => {
  let container;
  let graphql;
  let statistics;
  let variables;
  let executionCount;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/links',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
    statistics = await container.get('Statistics');
    executionCount = script => statistics.get('script_duration_seconds').data[`script="${script}"`][Infinity];
    await container.get('GraphqlLinks');
    graphql = await container.get('Graphql');
    const authorResult = await graphql.query({
      query: `mutation {
        createAuthor(input: {
          name: "John"
        }) {
          id
        }
      }`
    });
    variables = {
      author: authorResult.createAuthor.id
    };
    await graphql.query({
      query: `mutation ($author: ID!) {
        createPost(input: {
          title: "First post",
          body: "Test",
          author: $author
        }) {
          id
        }
      }`,
      variables
    });
  });

  after(async () => {
    await container.shutdown();
  });

  it('will expand references', async () => {
    const result = await graphql.query({
      query: `{
        listPost {
          items {
            title
            author {
              name
            }
          }
        }
      }`,
      variables
    });
    expect(result.listPost.items[0].author).to.have.property('name', 'John');
  });

  it('will not execute resolver script when requesting known properties', async () => {
    const before = executionCount('StorageInternalRead');
    const result = await graphql.query({
      query: `{
        listPost {
          items {
            title
            author {
              id
              __typename
            }
          }
        }
      }`,
      variables
    });
    const after = executionCount('StorageInternalRead');

    // We should know the id and __typename without executing StorageReadInternal
    expect(result.listPost.items[0].author).to.have.property('id', variables.author);
    expect(result.listPost.items[0].author).to.have.property('__typename', 'AuthorObject');
    expect(after - before).to.equal(0);
  });

  it('will expand reverse reference', async () => {
    const result = await graphql.query({
      query: `query ($author: ID!) {
        Author(id: $author) {
          name
          lastPost {
            title
          }
        }
      }`,
      variables
    });
    expect(result.Author.lastPost).to.have.property('title', 'First post');
  });

  it('will not execute read when data is already provided', async () => {
    const before = executionCount('LastPost');
    const result = await graphql.query({
      query: `query ($author: String!) {
        fullAuthor(id: $author) {
          id
          name
          lastPost {
            title
          }
        }
      }`,
      variables
    });
    const after = executionCount('LastPost');

    // We should know the title without executing the LastPost script.
    expect(result.fullAuthor.lastPost).to.have.property('title', 'First post');
    expect(after - before).to.equal(0);
  });

  it('will execute read when data is incomplete', async () => {
    const before = executionCount('LastPost');
    const result = await graphql.query({
      query: `query ($author: String!) {
        incompleteAuthor(id: $author) {
          id
          name
          lastPost {
            title
          }
        }
      }`,
      variables
    });
    const after = executionCount('LastPost');

    expect(result.incompleteAuthor.lastPost).to.have.property('title', 'First post');
    expect(after - before).to.equal(1);
  });

  it('can upload a single file', async () => {
    // @see https://github.com/jaydenseric/graphql-multipart-request-spec
    const query = 'mutation ($file: Upload!) { singleUpload(file: $file) }';
    const operations = {query, variables: {file: null}};
    const uploadData = randomBytes(10);
    const form = new FormData();
    form.append('operations', JSON.stringify(operations));
    form.append('map', JSON.stringify({'0': ['variables.file']}));
    form.append('0', uploadData);

    const result = await fetch('http://localhost:1234/graphql', {method: 'POST', body: form}).then(res => res.json());
    expect(result.data.singleUpload).to.equal(uploadData.toString('base64'));
  });

  it('can upload multiple files', async () => {
    const query = 'mutation ($files: [Upload]!) { multipleUpload(files: $files) }';
    const operations = {query, variables: {files: [null, null]}};
    const uploadData1 = randomBytes(10);
    const uploadData2 = randomBytes(10);
    const form = new FormData();
    form.append('operations', JSON.stringify(operations));
    form.append('map', JSON.stringify({'0': ['variables.files.0'], '1': ['variables.files.1']}));
    form.append('0', uploadData1);
    form.append('1', uploadData2);

    const result = await fetch('http://localhost:1234/graphql', {method: 'POST', body: form}).then(res => res.json());
    expect(result.data.multipleUpload).to.deep.equal([
      uploadData1.toString('base64'),
      uploadData2.toString('base64')
    ]);
  });

});
