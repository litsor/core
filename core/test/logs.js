/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Logs', () => {
  let container;
  let testUrl;
  let scriptsManager;
  let db;
  let graphql;
  let log;

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/logs',
      database: process.env.LITSOR_DATABASE || 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test',
      logTo: 'model'
    });
    testUrl = 'http://127.0.0.1:1234';
    await container.get('Endpoints');
    await container.get('GraphqlLinks');

    db = await container.get('Database');
    graphql = await container.get('Graphql');
    log = await container.get('Log');
    scriptsManager = await container.get('ScriptsManager');
  });

  after(async () => {
    await container.shutdown();
  });

  it('can create a new log entry with GraphQL query', async () => {
    const result = await graphql.query({
      query: 'mutation ($input: LogEntryInput!) { createLogEntry(input: $input) { id } }',
      variables: {
        input: {
          message: 'Test entry',
          severity: 'debug',
          date: ~~(new Date / 1e3),
          metadata: {},
          correlationId: 'test'
        }
      }
    });
    const {id} = result.createLogEntry;
    const entry = await graphql.query({
      query: 'query ($id: ID!) { LogEntry(id: $id) { message } }',
      variables: {id}
    });
    expect(entry.LogEntry.message).to.equal('Test entry');
  });

  it('can create a new log entry with Log module', async () => {
    const correlationId = log.generateCorrelationId();
    await log.log({
      severity: 'debug',
      correlationId,
      message: 'test'
    });

    // The logging proceeds in the backgorund and may not be finished by now.
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await graphql.query({
      query: 'query ($filters: LogEntryFilterSet) { items: listLogEntry(filters: $filters) { items { message } } }',
      variables: {
        filters: {
          correlationId
        }
      }
    });
    expect(result.items.items).to.have.length(1);
    expect(result.items.items[0]).to.have.property('message', 'test');
  });

  it('can use the log method', async () => {
    const script = scriptsManager.get('Log');
    await script.run({});

    // The logging proceeds in the backgorund and may not be finished by now.
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await graphql.query({
      query: 'query ($filters: LogEntryFilterSet) { items: listLogEntry(filters: $filters) { items { message correlationId } } }',
      variables: {
        filters: {
          severity: "info"
        }
      }
    });
    expect(result.items.items).to.have.length(2);
    expect(result.items.items[0].correlationId).to.equal(result.items.items[1].correlationId);
  });
});
