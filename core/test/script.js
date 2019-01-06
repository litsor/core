/* eslint-env node, mocha */
'use strict';

const {randomBytes} = require('crypto');
const {expect} = require('chai');
const Script = require('./../classes/script');

const Log = {
  generateCorrelationId() {
    return randomBytes(18).toString('base64');
  }
};

const Methods = {
  testCounter: 0,
  getUnaryMethod(name) {
    if (name === 'sqrt') {
      return Math.sqrt;
    }
    if (name === 'test') {
      return async () => {
        ++this.testCounter;
      };
    }
    if (name === '!') {
      return value => !value;
    }
    if (name === 'sleep') {
      return async interval => {
        return new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  },
  getBinaryMethod(name) {
    if (name === 'in') {
      return (left, right) => right.indexOf(left) >= 0;
    }
    if (name === '+') {
      return (left, right) => left + right;
    }
    if (name === '*') {
      return (left, right) => left * right;
    }
    if (name === '>=') {
      return (left, right) => left >= right;
    }
    if (name === 'cache') {
      const callback = async (_, right) => await right() === 'cid' ? 'ok' : false;
      callback.lazy = true;
      return callback;
    }
    if (name === 'filter') {
      const callback = async (input, filter, context) => {
        let output = [];
        const items = await input();
        for (let i = 0; i < items.length; ++i) {
          if (typeof items[i] === 'undefined') {
            continue;
          }
          const keep = await filter({
            ...context.data,
            item: items[i]
          });
          if (keep) {
            output.push(items[i]);
          }
        }
        return output;
      };
      callback.lazy = true;
      return callback;
    }
  }
};

const Graphql = {
  query({query, variables}) {
    if (query === 'query {foo}') {
      return {foo: 'bar'};
    }
    if (query === 'query ($var1:ID!) {User (id:$var1) {id name}}' && variables.var1 === '1') {
      return {id: '1', name: 'Alice'};
    }
    if (query === 'query {User (id:"2") {id name}}') {
      return {id: '2', name: 'Bob'};
    }
    if (query === 'query {User (id:"2") {a:id b:name}}') {
      return {a: '2', b: 'Bob'};
    }
    if (query === 'query {User (id:"2") {id ...on User{name}}}') {
      return {id: '2', name: 'Bob'};
    }
    if (query === 'mutation {createUser (name:"Chris") {id}}') {
      return {createUser: {id: '3'}};
    }
  },
  getFieldType(type, field) {
    if (type === 'Query' && field === 'foo') {
      return 'String';
    }
    if (type === 'Query' && field === 'User') {
      return 'User';
    }
    if (type === 'User' && field === 'id') {
      return 'ID!';
    }
    if (type === 'User' && field === 'name') {
      return 'String';
    }
    if (type === 'Mutation' && field === 'createUser') {
      return 'User';
    }
  },
  getParamType(type, field, param) {
    if (type === 'Query' && field === 'User' && param === 'id') {
      return 'ID!';
    }
  }
};

const Statistics = {
  data: {},
  async add(type, name) {
    const data = this.data;
    data[name] = {};
    if (type === 'Histogram') {
      return {
        add(value, {script}) {
          if (typeof data[name][script] === 'undefined') {
            data[name][script] = [];
          }
          data[name][script].push(value);
        }
      };
    }
  }
};

describe('Script', () => {
  let script;

  before(() => {
    script = new Script({Methods, Graphql, Log, Statistics});
  });

  it('can run script', async () => {
    script.load(`/foo = "bar"`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({foo: 'bar'});
  });

  it('can execute multiple commands', async () => {
    script.load(`/foo = "bar"\n/bar = "baz"`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({foo: 'bar', bar: 'baz'});
  });

  it('can include comments', async () => {
    script.load(`# comment\n/foo = "bar"\n/bar = "baz"\n#Comment on end!`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({foo: 'bar', bar: 'baz'});
  });

  it('can assign to root', async () => {
    script.load(`/ = {foo: "bar"}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({foo: 'bar'});
  });

  it('can handle JSON types', async () => {
    script.load(`/ = {string: "bar", bool: true, null: null, int: 34, float: 3.14, object: {}, array: []}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({
      string: 'bar',
      bool: true,
      null: null,
      int: 34,
      float: 3.14,
      object: {},
      array: []
    });
  });

  it('can execute an unary method', async () => {
    script.load(`/ = sqrt 16`);
    const output = (await script.run({}));
    expect(output).to.equal(4);
  });

  it('can execute a binary method', async () => {
    script.load(`/ = 2 in [1,2,3]`);
    const output = (await script.run({}));
    expect(output).to.equal(true);
  });

  it('will execute method without assignment', async () => {
    script.load(`test 123`);
    Methods.testCounter = 0;
    const output = (await script.run({}));
    expect(Methods.testCounter).to.equal(1);
    expect(output).to.deep.equal({});
  });

  it('can run a grouped exprssion', async () => {
    script.load(`/ = 1 + (2 * 3)`);
    const output = (await script.run({}));
    expect(output).to.equal(7);
  });

  it('will evaluate from left to right', async () => {
    // The mathematical expression 2 * 2 + 2 * 2 can be expected to equal 8,
    // but is evaluated as 2 * (2 + (2 * 2)) and equals 12.
    script.load(`/ = 2 * 2 + 2 * 2`);
    const output = (await script.run({}));
    expect(output).to.equal(12);
  });

  it('can re-assign values', async () => {
    script.load(`/b = /a`);
    const output = (await script.run({a: 3}));
    expect(output).to.deep.equal({a: 3, b: 3});
  });

  it('does not keep a reference when re-assigning', async () => {
    script.load(`/b = /a\n/a/test = 4`);
    const output = (await script.run({a: {test: 3}}));
    expect(output).to.deep.equal({a: {test: 4}, b: {test: 3}});
  });

  it('recognises exclamation mark as unary operator', async () => {
    script.load(`/a = !/a\n/b = !/b`);
    const output = (await script.run({a: false, b: true}));
    expect(output).to.deep.equal({a: true, b: false});
  });

  it('will not directly execute operands for lazy methods', async () => {
    // Note that only binary methods can be lazy. Unary methods have no
    // reason to be lazy because there is no other input to decide
    // if execution is required.
    script.load(`/ = (test 123) cache "cid"`);
    Methods.testCounter = 0;
    const output = (await script.run({}));
    expect(Methods.testCounter).to.equal(0);
    expect(output).to.deep.equal('ok');
  });

  it('can use pointers in json objects', async () => {
    script.load(`/ = {foo: "bar", bar: {baz: /baz}}`);
    const output = (await script.run({baz: 3}));
    expect(output).to.deep.equal({foo: 'bar', bar: {baz: 3}});
  });

  it('can use pointers for member names in json objects', async () => {
    script.load(`/ = {/foo: /bar}`);
    const output = (await script.run({foo: 'a', bar: 'b'}));
    expect(output).to.deep.equal({a: 'b'});
  });

  it('can use pointers in json arrays', async () => {
    script.load(`/ = {foo: "bar", bar: [/baz, /qux]}}`);
    const output = (await script.run({baz: 3, qux: 4}));
    expect(output).to.deep.equal({foo: 'bar', bar: [3, 4]});
  });

  it('can run a code block', async () => {
    script.load(`/ = {{/a = 3\n/b = 4}}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({a: 3, b: 4});
  });

  it('creates a new scope for a code block', async () => {
    // The second /a is written in the block scope and may not override the main scope.
    script.load(`/a = 2\n/b = {{/a = 3\n/ = 4}}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({a: 2, b: 4});
  });

  it('copies scope data in new block scope', async () => {
    // The new scope is not empty, but should be a clone of the parent scope.
    script.load(`/a = 2\n/b = {{/ = /a}}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({a: 2, b: 2});
  });

  it('allows nested blocks', async () => {
    script.load(`/a = 2\n/b = {{/ = {{/ = /a}}}}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({a: 2, b: 2});
  });

  it('can use strings for jsonpointers', async () => {
    script.load(`/ = /"$"`);
    const output = (await script.run({$: 24}));
    expect(output).to.equal(24);
  });

  it('can use strings for jsonpointers in assignments', async () => {
    script.load(`/"$" = 34`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({$: 34});
  });

  it('can use lazy evaluation for repetitive evaluation in a new scope', async () => {
    // The '/item >= /b' part is evaluated for each item in the list /a.
    // This expression is evaluated in a new context with one of the items set as its value.
    script.load(`/ = /a filter /item >= /b`);
    const output = (await script.run({
      a: [1, 2, 3, 4],
      b: 2
    }));
    expect(output).to.deep.equal([2, 3, 4]);
  });

  it('can use the rest operator in objects', async () => {
    script.load(`/ = {.../a, b: 3, .../c}`);
    const output = (await script.run({
      a: {a: 1, b: 2},
      c: {c: 3, d: 4}
    }));
    expect(output).to.deep.equal({a: 1, b: 3, c: 3, d: 4});
  });

  it('can use the rest operator in arrays', async () => {
    script.load(`/ = [.../a, 3, .../c]`);
    const output = (await script.run({
      a: [1, 2],
      c: [3, 4]
    }));
    expect(output).to.deep.equal([1, 2, 3, 3, 4]);
  });

  it('will retain order in arrays', async () => {
    // The trick here is that the first element will be resolved in an async
    // function, while the latter is immediately available. Order is messed up
    // easily when not carefully using the async flow.
    // The "aa" will be added as last element if this goes wrong,
    // so it is important to test it in this order.
    script.load(`/ = [{{/ = "a" + "a"}}, "b"]`);
    const output = (await script.run({}));
    expect(output).to.deep.equal(['aa', 'b']);
  });

  it('can append to list with []= assignment', async () => {
    script.load(`/ []= 2`);
    const output = (await script.run([1]));
    expect(output).to.deep.equal([1, 2]);
  });

  it('can prepend to list with =[] assignment', async () => {
    script.load(`/ =[] 2`);
    const output = (await script.run([1]));
    expect(output).to.deep.equal([2, 1]);
  });

  it('can add to set with +[] assignment', async () => {
    script.load(`/ +[] 1\n/ +[] 2`);
    const output = (await script.run([1]));
    expect(output.sort()).to.deep.equal([1, 2]);
  });

  it('can remove from set with -[] assignment', async () => {
    script.load(`/ -[] 1\n/ -[] 2`);
    const output = (await script.run([1]));
    expect(output.sort()).to.deep.equal([]);
  });

  it('can add numbers with += assignment', async () => {
    script.load(`/ += 4`);
    const output = (await script.run(5));
    expect(output).to.equal(9);
  });

  it('can subtract numbers with -= assignment', async () => {
    script.load(`/ -= 4`);
    const output = (await script.run(5));
    expect(output).to.equal(1);
  });

  it('can divide numbers with /= assignment', async () => {
    script.load(`/ /= 2`);
    const output = (await script.run(5));
    expect(output).to.equal(2.5);
  });

  it('can multiply numbers with *= assignment', async () => {
    script.load(`/ *= 2`);
    const output = (await script.run(5));
    expect(output).to.equal(10);
  });

  it('can set default value with ~ assignment', async () => {
    script.load(`/a ~ 1\n/b ~ 2`);
    const output = (await script.run({a: 3}));
    expect(output).to.deep.equal({a: 3, b: 2});
  });

  it('can execute query', async () => {
    script.load(`/ = query {foo}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({foo: 'bar'});
  });

  it('can pass variables to query', async () => {
    script.load(`/ = query {User(id: /id) { id name }}`);
    const output = (await script.run({id: '1'}));
    expect(output).to.deep.equal({id: '1', name: 'Alice'});
  });

  it('can pass simple values as param in query', async () => {
    // No parameter is created and no type definition is required.
    script.load(`/ = query {User(id: "2") { id name }}`);
    const output = (await script.run({id: '1'}));
    expect(output).to.deep.equal({id: '2', name: 'Bob'});
  });

  it('can use field aliases in query', async () => {
    script.load(`/ = query { User(id: "2") { a: id, b: name }}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({a: '2', b: 'Bob'});
  });

  it('can use GraphQL fragments in query', async () => {
    script.load(`/ = query { User(id: "2") { id ...on User { name }}}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({id: '2', name: 'Bob'});
  });

  it('can use GraphQL mutations', async () => {
    script.load(`/ = mutation { createUser(name: "Chris") { id }}`);
    const output = (await script.run({}));
    expect(output).to.deep.equal({createUser: {id: '3'}});
  });

  it('logs running time in statistics', async () => {
    script.load(`/foo = "bar"`);
    script.setId('StatisticsTestScript');
    await script.run({});
    expect(Statistics.data).to.have.property('script_duration_seconds');
    expect(Statistics.data.script_duration_seconds).to.have.property('StatisticsTestScript');
    expect(Statistics.data.script_duration_seconds.StatisticsTestScript).to.have.length(1);
  });

  it('returns an empty process list when no scripts are running', async () => {
    script.load(`/foo = "bar"\nsleep 50\n/foo = "baz"\nsleep 50`);
    script.setId('TestScript');
    expect(script.getProcessList()).to.deep.equal([]);
  });

  it('reports running script in processlist', async () => {
    script.load(`/foo = "bar"\nsleep 25\n/foo = "baz"\nsleep 25`);
    script.setId('TestScript');
    script.run({});
    const processList = script.getProcessList();
    expect(processList).to.have.length(1);
    expect(processList[0]).to.have.property('processId');
    expect(processList[0]).to.have.property('correlationId');
    expect(processList[0]).to.have.property('line');
    expect(processList[0]).to.have.property('runningTime');
    expect(processList[0]).to.have.property('killed');
    await new Promise(resolve => setTimeout(resolve, 60));
  });

  it('reports multiple running scripts in processlist', async () => {
    script.load(`/foo = "bar"\nsleep 25\n/foo = "baz"\nsleep 25`);
    script.setId('TestScript');
    script.run({});
    expect(script.getProcessList()).to.have.length(1);
    await new Promise(resolve => setTimeout(resolve, 25));
    script.run({});
    const processList = script.getProcessList();
    expect(processList).to.have.length(2);
    expect(processList[0].processId).to.not.equal(processList[1].processId);
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(script.getProcessList()).to.have.length(1);
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  it('includes line numbers in processlist', async () => {
    script.load(`/foo = "bar"\nsleep 25\n/foo = "baz"\nsleep 25`);
    script.setId('TestScript');
    script.run({});
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(script.getProcessList()[0]).to.have.property('line', 2);
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(script.getProcessList()[0]).to.have.property('line', 4);
    await new Promise(resolve => setTimeout(resolve, 25));
  });

  it('reports line numbers in subscripts', async () => {
    script.load(`[1] filter {{\n/a = 1\nsleep 25\n/ = true\n}}`);
    script.setId('TestScript');
    script.run({});
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(script.getProcessList()[0]).to.have.property('line', 3);
    await new Promise(resolve => setTimeout(resolve, 25));
  });

  it('can kill a script', async () => {
    Methods.testCounter = 0;
    script.load(`test 1\nsleep 25\ntest 1\nsleep 25`);
    const fn = async () => {
      try {
        await script.run({});
      } catch (err) {
        // Expected error.
      }
    };
    fn();
    await new Promise(resolve => setTimeout(resolve, 10));
    const processId = script.getProcessList()[0].processId;
    expect(script.getProcessList()[0]).to.have.property('killed', false);

    // After killing the process, the script will finish the sleep method.
    // The processlist still lists this process, but marked as killed.
    script.kill(processId);
    expect(script.getProcessList()[0]).to.have.property('killed', true);

    // After 25ms, the sleep is finished. It should not run the second
    // test method anymore and the process should be gone.
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(script.getProcessList()).to.have.length(0);
    expect(Methods.testCounter).to.equal(1);
  });

  it('will kill subscripts when parent is killed', async () => {
    Methods.testCounter = 0;
    script.load(`test 1\n[1,2] filter {{\nsleep 25\ntest 1\n}}`);
    const fn = async () => {
      try {
        await script.run({});
      } catch (err) {
        // Expected error.
      }
    };
    fn();
    await new Promise(resolve => setTimeout(resolve, 10));
    const processId = script.getProcessList()[0].processId;
    expect(script.getProcessList()[0]).to.have.property('killed', false);

    // After killing the process, the script will finish the sleep method.
    // The processlist still lists this process, but marked as killed.
    script.kill(processId);
    expect(script.getProcessList()[0]).to.have.property('killed', true);

    // After 25ms, the sleep is finished. It should not run the second
    // test method anymore and the process should be gone.
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(script.getProcessList()).to.have.length(0);
    expect(Methods.testCounter).to.equal(1);
  });

});
