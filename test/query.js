/* eslint-env node, mocha */
'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Container = require('../classes/container');
const Ids = require('../classes/ids');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Query', () => {
  let container;
  let storage;
  let temporary = {};

  before(async () => {
    container = new Container();
    await container.startup();

    const config = await container.get('Config');
    config.set({
      storage: {
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
          }
        }
      }
    });
    storage = await container.get('Storage');
  });

  after(async () => {
    await container.shutdown();
  });

  it('fails on misformatted queries', () => {
    return new Promise(() => {
      const query = `{...}`;
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.message).to.contain('Syntax Error');
      expect(err.message).to.contain('Expected');
    }).done();
  });

  it('fails on unknown operations', () => {
    return Promise.resolve().then(() => {
      const query = `{writePost}`;
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.message).to.contain('is not supported by model');
      expect(err.message).to.contain('write');
    }).done();
  });

  it('can create data with strings', () => {
    const query = `{
      createPost(teststring:"This is a test") {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with strings', () => {
    const query = `{
      readPost(id:$id) {
        teststring
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('teststring', 'This is a test');
    });
  });

  it('can create data with integers', () => {
    const query = `{
      createPost(testint:123) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with integers', () => {
    const query = `{
      readPost(id:$id) {
        testint
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testint', 123);
    });
  });

  it('can create data with floats', () => {
    const query = `{
      createPost(testfloat:1.23) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with floats', () => {
    const query = `{
      readPost(id:$id) {
        testfloat
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testfloat', 1.23);
    });
  });

  it('can create data with objects', () => {
    const query = `{
      createPost(testobject:{foo:"bar"}) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with objects', () => {
    const query = `{
      readPost(id:$id) {
        testobject
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({foo: 'bar'});
    });
  });

  it('can create data with lists', () => {
    const query = `{
      createPost(testlist:[{},{}]) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with lists', () => {
    const query = `{
      readPost(id:$id) {
        testlist
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testlist');
      expect(result.readPost.testlist).to.deep.equal([{}, {}]);
    });
  });

  it('can create data with booleans', () => {
    const query = `{
      createPost(testboolean:true) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with booleans', () => {
    const query = `{
      readPost(id:$id) {
        testboolean
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testboolean');
      expect(result.readPost.testboolean).to.equal(true);
    });
  });

  it('allows us to omit "read" for read operations', () => {
    const query = `{
      Post(id:$id) {
        id
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result).to.have.property('Post');
      expect(result.Post).to.have.property('id');
    });
  });

  it('allows using aliases', () => {
    const query = `{
      p: Post(id:$id) {
        id
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result).to.have.property('p');
      expect(result.p).to.have.property('id');
    });
  });

  it('supports __typename field', () => {
    const query = `{
      readPost(id:$id) {
        __typename
        id
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('__typename', 'Post');
    });
  });

  it('can create data with empty objects', () => {
    const query = `{
      createPost(testobject:{}) {
        id
      }
    }`;
    return storage.query(query).then(result => {
      expect(result.createPost).to.have.property('id');
      temporary = {id: result.createPost.id};
    });
  });

  it('can get data with empty objects', () => {
    const query = `{
      readPost(id:$id) {
        testobject
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('testobject');
      expect(result.readPost.testobject).to.deep.equal({});
    });
  });

  it('can unset value by updating with undefined', () => {
    const query = `{
      updatePost(id:$id,testobject:undefined) {
        testobject
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.updatePost).to.have.property('testobject', null);
      // Also check read aftwerwards.
      const query = '{Post(id:$id){testobject}}';
      return storage.query(query, {id});
    }).then(result => {
      expect(result.Post).to.have.property('testobject', null);
    });
  });

  it('will reject deleting required fields in update', () => {
    const query = '{story:createStory(title:"testtile",body:"testbody"){id}}';
    return storage.query(query).then(result => {
      const query = `{
        updateStory(id:$id,title:undefined) {
          id title body
        }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.contain('title');
      expect(err.errors[0]).to.contain('required');
    }).done();
  });

  it('will fill nulls in fields without a value', () => {
    const query = `{
      readPost(id:$id) {
        title
      }
    }`;
    const id = temporary.id;
    return storage.query(query, {id}).then(result => {
      expect(result.readPost).to.have.property('title');
      expect(result.readPost.title).to.equal(null);
    });
  });

  it('will reject invalid data in create', () => {
    return Promise.resolve().then(() => {
      const query = '{story:createStory(title:234){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.errors).to.have.length(2);
      expect(err.errors.sort()[1]).to.contain('title');
      expect(err.errors.sort()[1]).to.contain('wrong type');
    }).done();
  });

  it('will reject invalid data in read', () => {
    return Promise.resolve().then(() => {
      const query = '{story:readStory(id:{}){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.contain('id');
      expect(err.errors[0]).to.contain('wrong type');
    }).done();
  });

  it('will reject invalid data in update', () => {
    const query = '{story:createStory(title:"Test",body:"Lorem ipsum"){id}}';
    return storage.query(query).then(result => {
      const query = `{
        updateStory(id:$id,title:123) {
          id title body
        }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.contain('title');
      expect(err.errors[0]).to.contain('wrong type');
    }).done();
  });

  it('will reject invalid data in delete', () => {
    return Promise.resolve().then(() => {
      const query = '{story:deleteStory(id:{}){id}}';
      return storage.query(query);
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      expect(err.errors).to.have.length(1);
      expect(err.errors[0]).to.contain('id');
      expect(err.errors[0]).to.contain('wrong type');
    }).done();
  });

  it('can handle UTF-8 data in query', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    const query = '{story:createStory(title:"Test",body:"\u00A7"){id body}}';
    return storage.query(query).then(result => {
      expect(result.story.body).to.equal('\xa7');
      const query = `{
        story:Story(id:$id) { body }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle unicode sequences in query', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    const query = '{story:createStory(title:"Test",body:"\\u00A7"){id body}}';
    return storage.query(query).then(result => {
      expect(result.story.body).to.equal('\xa7');
      const query = `{
        story:Story(id:$id) { body }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle UTF-8 data in parameters', () => {
    // \u00A7 is the paragraph sign, from the Latin-1 supplement.
    const query = '{story:createStory(title:"Test",body:$body){id body}}';
    const args = {body: '\u00A7'};
    return storage.query(query, args).then(result => {
      expect(result.story.body).to.equal('\xa7');
      const query = `{
        story:Story(id:$id) { body }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(result => {
      expect(result.story.body).to.equal('\xa7');
    }).done();
  });

  it('can handle question marks in parameters', () => {
    const query = '{story:createStory(title:$title,body:$body){id title body}}';
    const args = {title: '???', body: 'Hello world?'};
    return storage.query(query, args).then(result => {
      expect(result.story.title).to.equal('???');
      expect(result.story.body).to.equal('Hello world?');
      const query = `{
        story:Story(id:$id) { title body }
      }`;
      const id = result.story.id;
      return storage.query(query, {id});
    }).then(result => {
      expect(result.story.title).to.equal('???');
      expect(result.story.body).to.equal('Hello world?');
    }).done();
  });

  /**
   * @doc
   * ## Query Parameterization
   * Queries accept variables in the form ``$name``. Variables are passed
   * to the Query constructor as second argument, or as the key ``variables``
   * in the ``POST /graphql`` endpoint.
   * The value ``null`` is used when a parameter is present in the query,
   * but its value was not provided. It depends on the schema validation
   * if such queries will raise an error.
   *
   * @indepth Considerations
   * The first development version raised an error when it detects that some
   * variable is missing. The idea is that this is always a programming error
   * that should throw an exception. However, in the frontend it is often
   * practical to be able to post empty values. In JavaScript, empty values
   * are usually represented as ``undefined``. JSON encoding objects with
   * undefined values result in missing properties. For example:
   * ```
   * > JSON.stringify({foo: 'bar', bar: undefined})
   * '{"foo":"bar"}'
   * ```
   * That means that we must explicitly convert ``undefined`` to ``null``
   * in order to leave off variable values, which means extra coding.
   */
  it('will query when providing too few arguments', () => {
    const query = '{story:createStory(title:$title,body:$body){id}}';
    return Promise.resolve().then(() => {
      return storage.query(query, {title: 'test'});
    }).then(() => {
      throw new Error('should be rejected');
    }).catch(err => {
      // It will use NULL for missing values. Validation failed because
      // body is a required field.
      expect(err.message).to.contain('Validation failed');
    }).done();
  });

  /**
   * @doc
   * ## Dry run
   * Queries can be prepended by the ``dry`` keyword. This will
   * validate the query but will not make any database changes.
   * Get queries are executed as-is. Create, update and delete
   * actions will return data as if it was executed.
   * Example query:
   * ```
   * dry {
   *   createPost(title:"test") {
   *     id title
   *   }
   * }
   * ```
   * Will return the following result:
   * ```
   * {
   *   "createPost": {
   *     "id": "1cvw",
   *     "title": "test"
   *   }
   * }
   * ```
   * The returned id is an obfuscation of the id 0.
   * Nothing was written to the database.
   */
  it('can dry execute create operation', () => {
    let count;
    const countQuery = `{countPost}`;
    const query = `dry {
      createPost(title:"test") {
        id title
      }
    }`;
    return storage.query(countQuery).then(result => {
      count = result.countPost;
      return storage.query(query);
    }).then(result => {
      // Id looks like a real id, but is the obfuscation of 0.
      expect(result.createPost).to.have.property('id', new Ids(0).id);
    }).delay(10).then(() => {
      return storage.query(countQuery);
    }).then(result => {
      expect(result.countPost).to.equal(count);
    });
  });

  it('can dry execute update operation', () => {
    let id;
    return storage.query('{createPost(title:"foo"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('dry {updatePost(id:$id,title:"bar"){id}}', {id});
    }).delay(10).then(() => {
      return storage.query('{Post(id:$id){title}}', {id});
    }).then(result => {
      expect(result.Post.title).to.equal('foo');
    });
  });

  it('can dry execute delete operation', () => {
    let id;
    return storage.query('{createPost(title:"foo"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('dry {deletePost(id:$id)}', {id});
    }).delay(10).then(() => {
      return storage.query('{Post(id:$id){title}}', {id});
    }).then(result => {
      expect(result.Post.title).to.equal('foo');
    });
  });

  it('will return real results when executing dry read', () => {
    let id;
    return storage.query('{createPost(title:"Test!"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{Post(id:$id){title}}', {id});
    }).then(result => {
      expect(result.Post.title).to.equal('Test!');
    });
  });

  it('will return validation errors on dry-run', () => {
    return Promise.resolve().then(() => {
      return storage.query('{createPost(teststring:123)}');
    }).then(() => {
      throw new Error('Query passed');
    }).catch(() => {});
  });

  it('will apply filter in list', () => {
    let id;
    return storage.query('{createPost(testint: 10){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{createPost(testint: 11){id}}');
    }).then(() => {
      return storage.query('{listPost(testint: 10){id}}');
    }).then(result => {
      expect(result.listPost).to.have.length(1);
      expect(result.listPost[0].id).to.equal(id);
    });
  });

  it('will apply two unindexed filters in list', () => {
    let id;
    return storage.query('{createPost(testint: 10, teststring: "testindex"){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{createPost(testint: 11, teststring: "testindex"){id}}');
    }).then(() => {
      return storage.query('{listPost(testint: 10, teststring: "testindex"){id}}');
    }).then(result => {
      expect(result.listPost).to.have.length(1);
      expect(result.listPost[0].id).to.equal(id);
    });
  });

  it('will apply two indexed filters in list', () => {
    let id;
    return storage.query('{createPost(indexed1: 1, indexed2: 1){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{createPost(indexed1: 1, indexed2: 2){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 1){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 2){id}}');
    }).then(() => {
      return storage.query('{listPost(indexed1: 1, indexed2: 1){id}}');
    }).then(result => {
      expect(result.listPost).to.have.length(1);
      expect(result.listPost[0].id).to.equal(id);
    });
  });

  it('will apply indexed filter and unindexed filter in list', () => {
    let id;
    return storage.query('{createPost(testint: 1, indexed2: 1){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{createPost(testint: 1, indexed2: 2){id}}');
    }).then(() => {
      return storage.query('{listPost(testint: 1, indexed2: 1){id}}');
    }).then(result => {
      expect(result.listPost).to.have.length(1);
      expect(result.listPost[0].id).to.equal(id);
    });
  });

  it('will apply two indexed filters and unindexed filter in list', () => {
    let id;
    return storage.query('{createPost(indexed1: 1, indexed2: 1, testboolean: true){id}}').then(result => {
      id = result.createPost.id;
      return storage.query('{createPost(indexed1: 1, indexed2: 2, testboolean: true){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 1, testboolean: true){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 2, testboolean: true){id}}');
    }).then(() => {
      return storage.query('{listPost(indexed1: 1, indexed2: 1, testboolean: false){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 1, testboolean: false){id}}');
    }).then(() => {
      return storage.query('{createPost(indexed1: 2, indexed2: 2, testboolean: false){id}}');
    }).then(() => {
      return storage.query('{listPost(indexed1: 1, indexed2: 1, testboolean: true){id}}');
    }).then(result => {
      expect(result.listPost).to.have.length(1);
      expect(result.listPost[0].id).to.equal(id);
    });
  });

  it.skip('allows postprocessors to act on method output before extre fields are fetched', () => {
    /**
     * Consider the query:
     * {createEntity(name: "test") { tasks { id } }}
     *
     * A postprocessor adds a new task after creating the entity, with the query:
     * {createTask(entity: $id) { id }}
     *
     * The Entity.tasks field is a field from the Reference plugin and lists tasks for that entity.
     * The createEntity query is expected to contain the new task in its output.
     */
  });
});
