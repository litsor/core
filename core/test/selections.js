/* eslint-env node, mocha */
'use strict';

const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('Selections', () => {
  let container;
  let selections;

  before(async () => {
    container = new Container();
    await container.startup();
    selections = await container.get('Selections');
  });

  after(async () => {
    await container.shutdown();
  });

  it('can detect that data is complete', async () => {
    const complete = selections.isComplete({
      id: 123
    }, {
      id: {}
    });
    expect(complete).to.equal(true);
  });

  it('can detect that data is incomplete', async () => {
    const complete = selections.isComplete({
      id: 123
    }, {
      id: {},
      name: {}
    });
    expect(complete).to.equal(false);
  });

  it('treats nulls as complete', async () => {
    const complete = selections.isComplete({
      name: null
    }, {
      name: {}
    });
    expect(complete).to.equal(true);
  });

  it('can detect that nested data is complete', async () => {
    const complete = selections.isComplete({
      id: 123,
      author: {
        id: 12,
        name: 'John'
      }
    }, {
      id: {},
      author: {
        id: {},
        name: {}
      }
    });
    expect(complete).to.equal(true);
  });

  it('can detect that nested data is incomplete', async () => {
    const complete = selections.isComplete({
      id: 123,
      author: {
        id: 12
      }
    }, {
      id: {},
      author: {
        id: {},
        name: {}
      }
    });
    expect(complete).to.equal(false);
  });

  it('can detect that nested arrays are complete', async () => {
    const complete = selections.isComplete({
      id: 123,
      authors: [{
        id: 12,
        name: 'John'
      }, {
        id: 12,
        name: 'John'
      }]
    }, {
      id: {},
      authors: {
        id: {},
        name: {}
      }
    });
    expect(complete).to.equal(true);
  });

  it('can detect that nested arrays are incomplete', async () => {
    const complete = selections.isComplete({
      id: 123,
      authors: [{
        id: 12,
        name: 'John'
      }, {
        id: 12
      }]
    }, {
      id: {},
      authors: {
        id: {},
        name: {}
      }
    });
    expect(complete).to.equal(false);
  });

});
