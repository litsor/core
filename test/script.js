/* eslint-env node, mocha */
'use strict';

const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Script = require('../classes/script');

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
 *
 */
describe('Script', () => {
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
   * ## Query
   *
   * Set the ``query`` property to execute a query. The output is written on
   * the ``results`` property.
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
});
