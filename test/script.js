/* eslint-env node, mocha */
'use strict';

const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Bluebird = require('bluebird');

const Script = require('../classes/script');
const Application = require('../classes/application');

const expect = chai.expect;
chai.use(chaiAsPromised);

// Mockup for the Storage service.
const storage = {
  query() {
    return Promise.resolve({});
  }
};

/**
 * @doc scripts
 * # Scripts
 *
 * Scripts can be used for more complex and conditional operations that can be
 * used by plugins.
 */
describe('Script', () => {
  let app;
  let query;

  before(() => {
    app = new Application({
      port: 10023,
      storage: {
        modelsDir: 'test/script/models',
        scriptsDir: 'test/script/scripts',
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

  /**
   * @doc
   * In its simplest form, the script has only a name and no steps.
   *
   * ```
   * name: Empty script
   * steps: []
   * ```
   */
  it('can run an empty script', () => {
    const script = new Script({
      name: 'Testscript',
      steps: []
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({});
    });
  });

  it('cannot create a script without name', () => {
    expect(() => {
      const script = new Script({
        steps: []
      }, storage);
      script.run({});
    }).to.throw();
  });

  it('cannot create a script without steps', () => {
    expect(() => {
      const script = new Script({
        name: 'Testscript'
      }, storage);
      script.run({});
    }).to.throw();
  });

  /**
   * @doc
   * Each step is an object with optional properties that define the action.
   * All available properties are optional. Although useless, an empty object
   * is a valid script. It will return the input as-is.
   */
  it('can execute empty steps', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{}]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({});
    });
  });

  /**
   * @doc
   * Each step can optionally contain a query, transformation, increment and
   * jump, which are executed in that order and explained below.
   *
   * ## Query
   *
   * Set the ``query`` property to execute a query. The output is written on
   * the ``result`` property.
   */
  it('can execute query', () => {
    const storage = {
      query(query) {
        if (query === '{listItem{id}}') {
          return Promise.resolve({
            listItem: [{id: 1}, {id: 2}, {id: 3}]
          });
        }
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: '{listItem{id}}'
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        result: {
          listItem: [{id: 1}, {id: 2}, {id: 3}]
        }
      });
    });
  });

  /**
   * @doc
   *
   * The output property can be overridden by setting the ``resultProperty``
   * parameter.
   */
  it('can override result property', () => {
    const storage = {
      query(query) {
        if (query === '{listItem{id}}') {
          return Promise.resolve({
            listItem: [{id: 1}, {id: 2}, {id: 3}]
          });
        }
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: '{listItem{id}}',
        resultProperty: '/output'
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        output: {
          listItem: [{id: 1}, {id: 2}, {id: 3}]
        }
      });
    });
  });
  it('can use root as result property', () => {
    const storage = {
      query(query) {
        if (query === '{listItem{id}}') {
          return Promise.resolve({
            listItem: [{id: 1}, {id: 2}, {id: 3}]
          });
        }
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: '{listItem{id}}',
        resultProperty: ''
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        listItem: [{id: 1}, {id: 2}, {id: 3}]
      });
    });
  });

  /**
   * @doc
   *
   * Query parameters can be specified with the ``arguments`` property. This
   * must be an object where the keys are parameter names and values are
   * transformations, or just json pointers to directly select a single value.
   */
  it('can execute parameterized query', () => {
    const storage = {
      query(query, args) {
        if (args.id === 2) {
          return Promise.resolve({
            Item: {id: 2, title: 'Foo'}
          });
        }
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: '{Item(id: $id){id title}}',
        arguments: {
          id: '/id'
        }
      }]
    }, storage);
    return script.run({id: 2}).then(output => {
      expect(output).to.deep.equal({
        id: 2,
        result: {
          Item: {id: 2, title: 'Foo'}
        }
      });
    });
  });

  /**
   * @doc
   * ## Transformations
   *
   * Transformations can be executed by using the ``transform`` property.
   * Transformations are executed after the query.
   */
  it('can execute transformation', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        transform: {
          object: {
            foo: {static: 'bar'}
          }
        }
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        foo: 'bar'
      });
    });
  });
  it('will execute transformation after executing query', () => {
    const storage = {
      query(query) {
        if (query === '{listItem{id}}') {
          return Promise.resolve({
            listItem: [{id: 1}, {id: 2}, {id: 3}]
          });
        }
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: '{listItem{id}}',
        transform: {
          object: {
            items: {get: '/result/listItem'}
          }
        }
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        items: [{id: 1}, {id: 2}, {id: 3}]
      });
    });
  });

  it('can execute multiple steps', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        transform: {
          object: {
            foo: {static: 'bar'}
          }
        }
      }, {
        transform: {
          object: {
            foo: {get: '/foo'},
            bar: {static: 'baz'}
          }
        }
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        foo: 'bar',
        bar: 'baz'
      });
    });
  });

  /**
   * @doc
   * ## Jumps
   *
   * All steps are executed in sequence by default. Jump can be used to control
   * the flow and implement conditions.
   * The ``jump`` property can be used to specify which step should be executed
   * after this step. The value is an object with at least a ``to`` property.
   * This contains the label of the next step. The label is an optional name
   * that you can provide to a step. The example below shows an
   * unconditional jump.
   *
   * ```
   * name: Script with unconditional jump
   * steps:
   *   - label: start
   *     jump:
   *       to: last
   *   - query: ...
   *   - label: last
   * ```
   *
   * The second step will not get executed.
   */
  it('can do an unconditional jump', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        jump: {to: 'last'}
      }, {
        transform: {
          object: {
            foo: {static: 'bar'}
          }
        }
      }, {
        label: 'last',
        transform: {
          object: {
            foo: {get: '/foo'},
            bar: {static: 'baz'}
          }
        }
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        foo: null,
        bar: 'baz'
      });
    });
  });

  /**
   * @doc
   * Jumps can be conditional by defining an operator and operands. The operator
   * can be '==', '===', '!=', '!==', '<', '>', '<=', '>=' or 'in'. The 'in'
   * operator can be used for arrays and is true when the left operand is an
   * item in the second operand, where the left operand must be a scalar value
   * and the right operand an array. The left and right operands can be
   * specified as ``left`` and ``right``. The operand defaults to '=='. Left and
   * right operands both default to true. Thus not specifying any of these
   * properties causes the equation ``true == true``, which is the unconditional
   * jump as mentioned before. The operands are executed as a transformation
   * when objects are provided and used as a value directly when the value is
   * not an object.
   *
   * The example below shows a conditional jump.
   *
   * ```
   * name: Script with unconditional jump
   * steps:
   *   - transform:
   *       object:
   *         foo:
   *           static: 'bar'
   *   - jump:
   *       left:
   *         get: '/foo'
   *       right: 'baz'
   *       to: last
   *   - query: ...
   *   - label: last
   * ```
   *
   * The query will get executed in this example, because the equation
   * ``'bar' == 'baz'`` equals to false. The jump is ignored and the next step
   * is the thirth step with the query.
   */
  it('can do a conditional jump with the default operator', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        jump: {
          to: 'last',
          left: false
        }
      }, {
        transform: {
          object: {
            foo: {static: 'bar'}
          }
        }
      }, {
        label: 'last',
        transform: {
          object: {
            foo: {get: '/foo'},
            bar: {static: 'baz'}
          }
        }
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        foo: 'bar',
        bar: 'baz'
      });
    });
  });

  const operators = {
    '===': false,
    '==': false,
    '!=': true,
    '!==': true,
    '<': true,
    '>': false,
    '<=': true,
    '>=': false,
    unknown: false
  };
  Object.keys(operators).forEach(operator => {
    it('can do a conditional jump with the ' + operator + ' operator', () => {
      const script = new Script({
        name: 'Testscript',
        steps: [{
          jump: {
            to: 'last',
            left: 1,
            right: 2,
            operator
          }
        }, {
          transform: {
            object: {
              foo: {static: 'bar'}
            }
          }
        }, {
          label: 'last',
          transform: {
            object: {
              foo: {get: '/foo'},
              bar: {static: 'baz'}
            }
          }
        }]
      }, storage);
      return script.run({}).then(output => {
        expect(output).to.deep.equal({
          foo: operators[operator] ? null : 'bar',
          bar: 'baz'
        });
      });
    });
  });

  it('can do a conditional jump with the "in" operator', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        jump: {
          to: 'last',
          left: 2,
          right: {get: '/array'},
          operator: 'in'
        }
      }, {
        transform: {
          object: {
            foo: {static: 'bar'}
          }
        }
      }, {
        label: 'last',
        transform: {
          object: {
            foo: {get: '/foo'},
            bar: {static: 'baz'}
          }
        }
      }]
    }, storage);
    return script.run({array: [1, 2, 3]}).then(output => {
      expect(output).to.deep.equal({
        foo: null,
        bar: 'baz'
      });
    });
  });

  /**
   * @doc
   * For-loops can be written using the ``increment`` property. The value is a
   * json pointer. It will increase its referenced value by 1, or set it to 0
   * if it isn't already set. This is executed before the jump condition is
   * evaluated.
   * We can use it to write a ``for (i = 0; i < n; ++i)`` loop:
   *
   * ```
   * name: For-loop
   * steps:
   *   - label: start
   *     increment: /i
   *     jump:
   *       left:
   *         get: /i
   *       operator: >=
   *       right:
   *         get: /n
   *       to: end
   *   - label: firstWorker
   *   - label: secondWorker
   *     jump:
   *       to: start
   *   - label: end
   * ```
   *
   * Note that we negated the jump conditon, which can now be read as "if i is
   * greater or equals n".
   */
  it('can initialize the i-counter', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        increment: '/i'
      }]
    }, storage);
    return script.run({}).then(output => {
      expect(output).to.deep.equal({
        i: 0
      });
    });
  });

  it('can increment the i-counter', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        increment: '/i'
      }]
    }, storage);
    return script.run({i: 0}).then(output => {
      expect(output).to.deep.equal({
        i: 1
      });
    });
  });

  it('can execute a for-loop', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        label: 'start',
        increment: '/i',
        jump: {
          left: {get: '/i'},
          operator: '>=',
          right: {get: '/n'},
          to: 'end'
        }
      }, {
        label: 'worker...'
      }, {
        jump: {
          to: 'start'
        }
      }, {
        label: 'end'
      }]
    }, storage);
    return script.run({n: 10}).then(output => {
      expect(output).to.deep.equal({
        i: 10,
        n: 10
      });
    });
  });

  /**
   * @doc
   * ### Endless loops
   *
   * A protection is build in to prevent endless loops. By default the script
   * bails after executing 1000 steps. You can override this number per script
   * in the ``maxSteps`` property, which value must be a positive integer.
   */
  it('will fail when executing more steps than maxSteps', () => {
    const script = new Script({
      name: 'Testscript',
      steps: [{
        label: 'start',
        jump: {
          to: 'start'
        }
      }]
    }, storage);
    let failed = false;
    return script.run({n: 1e4}).catch(() => {
      failed = true;
    }).then(() => {
      if (!failed) {
        throw new Error('Script should fail');
      }
    });
  });

  it('will not fail when executing many steps (10k)', () => {
    const script = new Script({
      name: 'Testscript',
      maxSteps: 1e4 + 3,
      steps: [{
        label: 'start',
        increment: '/i',
        jump: {
          left: {get: '/i'},
          operator: '>=',
          right: {get: '/n'},
          to: 'end'
        }
      }, {
        jump: {
          to: 'start'
        }
      }, {
        label: 'end'
      }]
    }, storage);
    return script.run({n: 1e4 / 2}).then(output => {
      expect(output).to.deep.equal({
        i: 1e4 / 2,
        n: 1e4 / 2
      });
    });
  });

  it('cannot run a script concurrently', () => {
    const storage = {
      query() {
        return Bluebird.resolve({}).delay(100);
      }
    };
    const script = new Script({
      name: 'Testscript',
      steps: [{
        query: ''
      }]
    }, storage);
    // Let first instance run in background.
    script.run();
    return Bluebird.resolve().delay(50).then(() => {
      // The first instance is still running.
      expect(() => {
        script.run();
      }).to.throw();
    }).delay(60).then(() => {
      // First script ended. Second was not started.
      // We should be able to start the script now.
      script.run();
    });
  });

  /**
   * @doc
   * ## Scheduling
   *
   * Scripts can be scheduled for automatic execution by defining the
   * ``schedule`` property. Its value is in the crontab format, with seconds
   * included.
   * Write "* * * * * *" to execute a script every second or "0 /5 * * * *"
   * for execution every 5 minutes.
   * Execution will not start if the script is still running.
   *
   * The example below is an implementation of a task queue. The script will
   * consume the oldest task from the queue every second.
   *
   * ```
   * name: Queue worker
   * schedule: '* * * * * *'
   * steps:
   *   - query: |
   *       {
   *         item: listQueueItem(type: "addBadge", sort: "created", limit: 1) {
   *           id data
   *         }
   *       }
   *     transform:
   *       object:
   *         item: /result/item/0
   *     jump:
   *       left:
   *         get: '/item'
   *       operator: '==='
   *       right: null
   *       to: end
   *   - query: '{User(id: $id){ badges }}'
   *     arguments:
   *       id: '/item/data/userId'
   *     transform:
   *       object:
   *         item: '/item'
   *         badges:
   *           union:
   *             - /result/User/badges
   *             - array:
   *               - /item/data/badge
   *   - query: '{updateUser(id: $id, badges: $badges)}'
   *     arguments:
   *       id: /item/data/userId
   *       badges: /badges
   *   - query: '{deleteQueueItem(id: $id)}'
   *     arguments:
   *       id: /item/id
   *   - label: end
   * ```
   *
   * A new task can be created by running the query
   * ``{createQueueItem(type: "addBadge", data: $data)}``
   * where ``$data`` is ``{UserId: "123", "badge": "Winner"}``. It will add the
   * string "Winner" to the ``User.badges`` array.
   *
   * Note that this script will never run multiple instances concurrently,
   * since new instances are not started when the last is still running. There
   * is no risk of executing the job twice and thus no need to do any locking.
   *
   * This setup can process at most one job per second. We can change the design
   * a bit to allow processing more. Simple add a label "start" on the first
   * step and an unconditional jump to the first step just before the last step.
   * We can also use this trick to lower the number of invokes of this script.
   * This lowers the system resources used, but increases the latency before
   * new jobs are started.
   */
  it('will automatically execute scheduled scripts', () => {
    let userId;
    return query('{user: createUser(name: "John", mail: "john@example.com") { id }}').then(result => {
      userId = result.user.id;
      const data = {userId, badge: 'Winner'};
      return query('{createQueueItem(type: "addBadge", data: $data)}', {data});
    }).delay(1050).then(() => {
      return query('{User(id: $userId) { badges }}', {userId});
    }).then(result => {
      expect(result.User.badges).to.deep.equal(['Winner']);
    }).then(() => {
      return query('{deleteUser(id: $userId)}', {userId});
    });
  });

  /**
   * @doc
   * ## Run script on startup
   *
   * Add the property ``runOnStartup: true`` to run a script on startup. The
   * script will run 2 seconds after startup, to allow the application to boot.
   */
  it('can run script on startup', () => {
    let ran = false;
    const storage = {
      query() {
        ran = true;
        return Bluebird.resolve({});
      }
    };
    // Use a function to bypass the 'Do not use new for side-effects' error.
    const fn = () => {
      return new Script({
        name: 'Testscript',
        runOnStartup: true,
        steps: [{
          query: ''
        }]
      }, storage);
    };
    fn();
    return Bluebird.resolve().delay(2100).then(() => {
      // The script should start within 2s, without calling run().
      expect(ran).to.equal(true);
    });
  });

  /**
   * @doc
   * ## Delay steps
   *
   * Add the property ``delay: 1000`` to add a delay between executing the
   * steps. The value is the interval in milliseconds.
   */
  it('can add delay between steps', () => {
    const script = new Script({
      name: 'Testscript',
      delay: 100,
      steps: [{}, {}, {}]
    }, storage);
    const start = new Date();
    return script.run().then(() => {
      const end = new Date();
      const interval = end - start;
      expect(interval > 250).to.equal(true);
      expect(interval < 350).to.equal(true);
    });
  });
});
