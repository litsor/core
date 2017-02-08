/* eslint-env node, mocha */
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Faker = require('faker');

const Application = require('../classes/application');

chai.use(chaiAsPromised);

/**
 * @doc queries/cascading-deletes
 * # Cascading deletes
 *
 * This plugin can delete content that refers to deleted content. If A has a
 * reference to B, then A can be set up to be automatically deleted when
 * B is deleted.
 *
 * Add the ``cascade`` property on a reference field to activate this plugin.
 * All cascading references must have a reverse link as well.
 *
 * ```
 * name: Post
 * properties:
 *   title:
 *     type; string
 *   author:
 *     type: string
 *     references: User
 *     reverse: posts
 *     cascade: before
 * ```
 *
 * All posts of a specific author are deleted when the User is deleted.
 * Posts are attempted to be deleted before User is deleted. The query is
 * rejected in case of failures (including permission errors). Note that
 * there is no transaction support. The deleted posts will not get restored
 * when the User cannot be deleted.
 * The value "after" can also be used. Posts are deleted after User in this
 * case, leaving all posts intact when User could not be deleted. This however
 * will leave us with posts referencing to non-existent users in case a
 * delete post failed.
 */
describe('Cascading deletes', () => {
  let app;
  let query;

  before(() => {
    app = new Application({
      port: 10023,
      storage: {
        modelsDir: 'test/cascading-delete/models',
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
    return app.ready().then(() => {
      query = app.storage.query.bind(app.storage);
    });
  });

  after(() => {
    return app.close();
  });

  it('can delete referenced item', () => {
    const name = Faker.internet.userName();
    const mail = Faker.internet.email();
    let userId;
    let postId;
    return query('{createUser(name:$name, mail:$mail){id}}', {name, mail}).then(result => {
      userId = result.createUser.id;
      return query('{createPost(author:$userId){id}}', {userId});
    }).then(result => {
      postId = result.createPost.id;
      return query('{deleteUser(id:$userId){id}}', {userId});
    }).then(() => {
      let failed = false;
      return query('{Post(id:$postId){id}}', {postId}).catch(() => {
        failed = true;
      }).then(() => {
        if (!failed) {
          throw new Error('Query should fail');
        }
      });
    });
  });

  it.skip('will fail when on permission errors when deleting referencing items', () => {

  });

  it.skip('will not fail when access on list is denied, but delete is allowed', () => {
    // @see CascadingDelete::processField()
  });

  it.skip('can skip permission checks when setting skipPermissionsDuringCascade flag', () => {

  });
});
