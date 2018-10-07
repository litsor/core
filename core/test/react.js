/* eslint-env node, mocha */
'use strict';

const {resolve} = require('path');
const chai = require('chai');

const Container = require('../classes/container');

const expect = chai.expect;

describe('React SSR', () => {
  let container;
  let scriptsManager;
  let posts = [];

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      port: 1234,
      configDir: 'core/test/react',
      methodsDir: 'core/test/react/methods',
      database: 'mysql:root:password@127.0.0.1/litsor',
      'recreate-db': true,
      'secret-key': 'test'
    });
    scriptsManager = await container.get('ScriptsManager');
    await container.get('Graphql');
    await container.get('GraphqlLinks');

    const create = scriptsManager.get('StorageInternalCreate');
    posts.push(await create.run({model: 'Post', input: {title: 'First'}}));
    posts.push(await create.run({model: 'Post', input: {title: 'Second'}}));
  });

  after(async () => {
    await container.shutdown();
  });

  it('can render React element', async () => {
    const file = resolve(__dirname + '/react/dist/hello-world.js');
    const result = await scriptsManager.get('Render').run({
      file,
      input: {}
    });
    expect(result.html).to.equal('<div>Hello world</div>');
  });

  it('can execute GraphQL query', async () => {
    const file = resolve(__dirname + '/react/dist/list-posts.js');
    const result = await scriptsManager.get('Render').run({
      file,
      input: {}
    });
    expect(result.html).to.equal('<ul><li>First</li><li>Second</li></ul>');
  });

  it('can pass properties to component', async () => {
    const file = resolve(__dirname + '/react/dist/read-post.js');
    for (let i = 0; i < posts.length; ++i) {
      const result = await scriptsManager.get('Render').run({
        file,
        input: {
          properties: {
            id: posts[i].id
          }
        }
      });
      expect(result.html).to.equal(`<h1>${posts[i].title}</h1>`);
    }
  });

  it('will not cache GraphQL queries by default', async () => {
    const file = resolve(__dirname + '/react/dist/read-post.js');
    const render = async () => {
      return await scriptsManager.get('Render').run({
        file,
        input: {
          properties: {
            id: posts[0].id
          }
        }
      });
    };
    expect((await render()).html).to.equal(`<h1>First</h1>`);
    const update = scriptsManager.get('StorageInternalUpdate');
    await update.run({model: 'Post', id: posts[0].id, input: {title: 'First 2'}});
    expect((await render()).html).to.equal(`<h1>First 2</h1>`);
  });

  it('can use query cache', async () => {
    const file = resolve(__dirname + '/react/dist/read-post.js');
    const render = async () => {
      return await scriptsManager.get('Render').run({
        file,
        input: {
          cache: 1,
          properties: {
            id: posts[0].id
          }
        }
      });
    };
    const update = scriptsManager.get('StorageInternalUpdate');
    await update.run({model: 'Post', id: posts[0].id, input: {title: 'First'}});
    expect((await render()).html).to.equal(`<h1>First</h1>`);
    await update.run({model: 'Post', id: posts[0].id, input: {title: 'First 2'}});
    expect((await render()).html).to.equal(`<h1>First</h1>`);
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect((await render()).html).to.equal(`<h1>First 2</h1>`);
  });

  it('can use React prerendering', async () => {
    const file = resolve(__dirname + '/react/dist/hello-world.js');
    const result = await scriptsManager.get('Render').run({
      file,
      input: {
        prerender: true
      }
    });
    expect(result.html).to.contain('data-reactroot');
  });

  it('can use manual hydration of the cache', async () => {
    const file = resolve(__dirname + '/react/dist/read-post.js');
    const render = async (hydrate) => {
      return await scriptsManager.get('Render').run({
        file,
        input: {
          hydrate,
          extract: true,
          properties: {
            id: posts[0].id
          }
        }
      });
    };
    const update = scriptsManager.get('StorageInternalUpdate');
    await update.run({model: 'Post', id: posts[0].id, input: {title: 'First'}});
    let result = await render(false);
    expect(result.html).to.equal(`<h1>First</h1>`);
    expect(result).to.have.property('store');
    expect(result.store).to.be.an('object');
    // Update title, but expect to still retreive old title from store.
    await update.run({model: 'Post', id: posts[0].id, input: {title: 'First 2'}});
    result = await render(result.store);
    expect(result.html).to.equal(`<h1>First</h1>`);
  });
});
