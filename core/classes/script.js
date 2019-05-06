/* eslint-disable no-await-in-loop */
'use strict';

const {isImmutable, fromJS, isKeyed, isIndexed} = require('immutable');
const {Grammars} = require('ebnf');
const grammar = require('../assets/grammar');

const parser = new Grammars.Custom.Parser(grammar);

class Context {
  constructor(data, correlationId = '') {
    if (isImmutable(data)) {
      this.data = data;
    } else {
      this.data = fromJS(data);
    }
    this.unassignedValue = undefined;
    this.correlationId = correlationId;
    this.line = 1;
    this.parent = null;
    this.child = null;
    this.scriptState = null;
    this.methodState = null;
    this.killed = false;
  }

  setLine(line) {
    this.line = line;
    if (this.parent) {
      this.parent.setLine(line);
    }
  }

  kill() {
    this.killed = true;
    if (this.child) {
      this.child.kill();
    }
  }

  getRoot() {
    return this.parent ? this.parent.getRoot() : this;
  }

  export() {
    return {
      data: this.data,
      scriptState: this.scriptState,
      methodState: this.methodState,
      child: this.child ? this.child.export() : null,
      correlationId: this.correlationId
    };
  }

  import(state) {
    this.data = state.data;
    this.scriptState = state.scriptState;
    this.methodState = state.methodState;
    if (state.child) {
      this.child = new Context({}, this.correlationId);
      this.child.import(state.child);
    }
  }
}

class Script {
  constructor({Methods, Graphql, Log, Statistics}) {
    this.methods = Methods;
    this.graphql = Graphql;
    this.log = Log;
    this.statistics = Statistics;

    this.ast = [];
    this.id = null;
    this.statistic = null;

    this.processes = [];
    this.lastProcessId = 0;
  }

  load(script) {
    if (typeof script === 'object') {
      this.ast = script;
    }

    const line = position => script.substring(0, position).split('\n').length;
    const cleanup = ({type, text, children, start}) => {
      if (type === 'SyntaxError') {
        const snippet = text.substring(0, 16).trim();
        throw new Error(`Syntax error in ${this.id} on line ${line(start)} near "${snippet}"`);
      }
      return children.length > 0 ? {
        type, children: children.map(cleanup), line: line(start)
      } : {type, text, line: line(start)};
    };
    this.ast = parser.getAST(script).children.map(cleanup);
    this.rearrangeBidmas({children: this.ast});
  }

  /**
   * Rearrange the AST tree according to the BIDMAS rules.
   */
  rearrangeBidmas(element) {
    const weights = {
      'pow': -3,
      '/': -2,
      '*': -2,
      '+': -1,
      '-': -1
    };
    const b = e => e.type === 'binary_expression';
    const w = e => weights[e.children[1].text] || (e.children[1].children && weights[e.children[1].children[0].text]) || 0;
    const r = e => e.children[2].children[0];
    let tmp;
    if ((b(element) && b(r(element)) && w(r(element)) > w(element)) || (b(element) && b(r(element)) && w(element) < 0 && w(r(element)) < 0 && w(element) == w(r(element)))) {
      // Swap l <-> r.
      tmp = element.children[0];
      element.children[0] = element.children[2];
      element.children[2] = tmp;
      // Swap lr <-> r.
      tmp = element.children[0].children[0].children[2];
      element.children[0].children[0].children[2] = element.children[2];
      element.children[2] = tmp;
      // Swap lr <-> ll.
      tmp = element.children[0].children[0].children[2];
      element.children[0].children[0].children[2] = element.children[0].children[0].children[0];
      element.children[0].children[0].children[0] = tmp;
      // Swap operator.
      tmp = element.children[1];
      element.children[1] = element.children[0].children[0].children[1];
      element.children[0].children[0].children[1] = tmp;
    }
    (element.children || []).forEach(child => this.rearrangeBidmas(child));
  }

  setId(id) {
    this.id = id;

    this.statistics.add('Histogram', 'script_duration_seconds', 'script', 'script execution time').then(statistic => {
      this.statistic = statistic;
    });
  }

  getId() {
    return this.id;
  }

  unpackAst(ast, multiple = []) {
    return ast.children.reduce((config, child) => ({
      ...config,
      [child.type]: multiple.indexOf(child.type) >= 0 ? [...(config[child.type] || []), (child.children || child.text)] : (child.children || child.text)
    }), {});
  }

  async getJson({type, children, text}, context) {
    let object = fromJS({});
    switch (type) {
      case 'object':
        // Serial execution matters for rest operator.
        for (let i = 0; i < (children || []).length; ++i) {
          const child = this.unpackAst(children[i]);
          if (child.rest_operator) {
            const addProperties = await this.runExpression(child.rest_operator[0], context);
            if (!isKeyed(addProperties)) {
              throw new TypeError('Expression for rest operator in objects must result in an object');
            }
            object = object.merge(addProperties);
          } else {
            const memberName = child.member_name[0];
            const name = memberName.type === 'name' ? child.member_name[0].text : await this.runExpression(memberName, context);
            if (typeof name !== 'string') {
              throw new TypeError('Expression for object member name does not return a string');
            }
            object = object.setIn([name], await this.runExpression(child.expression[0], context));
          }
        }
        return object;
      case 'array':
        let array = fromJS([]);
        for (let i = 0; i < (children || []).length; ++i) {
          const child = children[i];
          if (child.type === 'rest_operator') {
            const addItems = await this.runExpression(child.children[0], context);
            if (!isIndexed(addItems)) {
              throw new TypeError('Expression for rest operator in arrays must result in an array');
            }
            array = array.concat(addItems);
          } else {
            array = array.push(fromJS(await this.runExpression(child.children[0], context)));
          }
        }
        return array;
      default:
        return fromJS(JSON.parse(text));
    }
  }

  pathFromPointer(pointer) {
    if (pointer === '/') {
      return [];
    }
    return pointer.substring(1).split('/');
  }

  async getValue({type, text, children}, context) {
    let pointer;
    switch (type) {
      case 'jsonpointer':
        pointer = text || '/' + JSON.parse(children[0].text);
        if (pointer === '/') {
          return context.data;
        }
        if (!isImmutable(context.data)) {
          // The root is a scalar value. We cannot call "getIn" on it.
          return null;
        }
        const output = context.data.getIn(this.pathFromPointer(pointer));
        return typeof output === 'undefined' ? null : output;
      case 'json':
      default:
        return this.getJson(children[0], context);
    }
  }

  async runUnaryExpression(method, expression, context) {
    const methodName = method.text || method.children[0].text;
    const callback = this.methods.getUnaryMethod(methodName);
    const operand = await this.runExpression(expression.children[0], context);
    const output = await callback(operand, context);
    context.methodState = null;
    return output;
  }

  async runBinaryExpression(left, method, right, context) {
    const methodName = method.text || method.children[0].text;
    const callback = this.methods.getBinaryMethod(methodName);
    let importContext = context.child;
    if (callback.lazy) {
      const clonedContext = new Context(context.data, context.correlationId);
      const operand = source => async data => {
        let expressionContext = clonedContext;
        if (typeof data !== 'undefined') {
          expressionContext = importContext || new Context(data, context.correlationId);
          expressionContext.parent = context;
          context.child = expressionContext;
          importContext = null;
        }
        return this.runExpression(source.children[0], expressionContext);
      };
      const output = await callback(operand(left), operand(right), context);
      context.child = null;
      context.methodState = null;
      return output;
    }
    const leftOperand = await this.runExpression(left.children[0], context);
    const rightOperand = await this.runExpression(right.children[0], context);
    const output = await callback(leftOperand, rightOperand, context);
    return output;
  }

  async getParamDefinitons(field, graphqlType, variables, params, context) {
    const paramDefs = [];
    for (let i = 0; i < field.param.length; ++i) {
      const {name, paramType, ...expression} = this.unpackAst({children: field.param[i]});
      if (expression.value) {
        const paramType = this.graphql.getParamType(graphqlType, field.name, name);
        const num = Object.keys(variables).length + 1;
        params.push(`$var${num}:${paramType}`);
        variables['var' + num] = await this.getValue(expression.value[0], context);
        if (isImmutable(variables['var' + num])) {
          variables['var' + num] = variables['var' + num].toJS();
        }
        paramDefs.push(`${name}:$var${num}`);
      } else {
        // The expression can only contains a JSON scalar type,
        // or is a constant. We can use its value without any
        // further checks.
        const value = expression[Object.keys(expression)[0]];
        paramDefs.push(`${name}:${value}`);
      }
    }
    return paramDefs;
  }

  async getSelections(selections, params, variables, graphqlType, context) {
    const fields = [];
    for (let i = 0; i < selections.length; ++i) {
      const selection = selections[i].children[0];
      const {type} = selection;
      const field = this.unpackAst(selection, ['param']);
      if (type === 'query_field') {
        const alias = field.field_alias ? field.field_alias[0].text + ':' : '';
        let definition = alias + field.name;
        const outputType = this.graphql.getFieldType(graphqlType, field.name);
        if (field.param) {
          const paramDefs = await this.getParamDefinitons(field, graphqlType, variables, params, context);
          definition += ' (' + paramDefs.join(',') + ')';
        }
        if (field.selections) {
          definition += ' ' + (await this.getSelections(field.selections, params, variables, outputType, context)).fields;
        }
        fields.push(definition);
      }
      if (type === 'query_fragment') {
        const name = selection.children[0].text;
        const subfields = (await this.getSelections(selection.children[1].children, params, variables, name, context)).fields;
        fields.push('...on ' + name + subfields);
      }
    }
    return {fields: '{' + fields.join(' ') + '}', params, variables};
  }

  async runQuery(type, selections, context) {
    const graphqlType = type === 'query' ? 'Query' : 'Mutation';
    const {fields, params, variables} = await this.getSelections(selections, [], {}, graphqlType, context);
    const query = `${type}${params.length > 0 ? ' (' + params.join(',') + ')' : ''} ${fields}`;
    return fromJS(this.graphql.query({query, variables}));
  }

  async runExpression({type, children}, context) {
    if (context.killed) {
      if (context.getRoot().killedCallback) {
        context.getRoot().killedCallback();
      }
      throw new Error('Script was killed');
    }
    try {
      let subcontext;
      switch (type) {
        case 'unary_expression':
          return this.runUnaryExpression(children[0], children[1], context);
        case 'binary_expression':
          return this.runBinaryExpression(children[0], children[1], children[2], context);
        case 'expression':
        case 'expression_nb':
          return this.runExpression(children[0], context);
        case 'script':
          subcontext = context.child || new Context(context.data, context.correlationId);
          subcontext.parent = context;
          context.child = subcontext;
          if (!subcontext.scriptState) {
            subcontext.scriptState = 0;
          }
          for (let i = subcontext.scriptState; i < children.length; ++i) {
            subcontext.scriptState = i;
            await this.runCommand(children[i], subcontext);
          }
          context.child = null;
          return subcontext.data;
        case 'query_statement':
          return this.runQuery(children[0].text, children[1].children, context);
        case 'value':
        default:
          return this.getValue(children[0], context);
      }
    } catch (e) {
      if (e.statusCode) {
        // Throw HttpErrors as-is.
        throw e;
      }
      throw new Error(this.id + ' line ' + context.line + ': ' + e.message);
    }
  }

  getIn(data, pointer) {
    if (pointer === '/') {
      return data;
    }
    if (!isImmutable(data)) {
      return null;
    }
    return data.getIn(pointer.substring(1).split('/'));
  }

  async runCommand(command, context) {
    context.setLine(command.line);
    context.unassignedValue = undefined;
    const config = this.unpackAst(command);
    const value = await this.runExpression(config.expression[0], context);
    if (!config.assignment) {
      context.unassignedValue = value || null;
      return context;
    }
    const [pointer, operator] = config.assignment.map(item => item.text || '/' + JSON.parse(item.children[0].text));

    const current = this.getIn(context.data, pointer);
    const setData = pointer === '/' ? data => {
      context.data = fromJS(data);
    } : data => {
      if (!isImmutable(context.data)) {
        context.data = {};
      }
      context.data = context.data.setIn(this.pathFromPointer(pointer), fromJS(data));
    };
    let list;
    switch (operator) {
      case '[]=':
        if (isIndexed(current)) {
          setData(current.push(value));
        } else {
          setData(fromJS([]).push(value));
        }
        break;
      case '=[]':
        if (isIndexed(current)) {
          setData(current.unshift(value));
        } else {
          setData(fromJS([]).push(value));
        }
        break;
      case '+[]':
        if (isIndexed(current)) {
          setData(current.toSet().add(value).toList());
        } else {
          setData(fromJS([]).push(value));
        }
        break;
      case '-[]':
        if (isIndexed(current)) {
          setData(current.toSet().delete(value).toList());
        } else {
          setData(fromJS([]));
        }
        break;
      case '+=':
        setData(current + value);
        break;
      case '-=':
        setData(current - value);
        break;
      case '*=':
        setData(current * value);
        break;
      case '/=':
        setData(current / value);
        break;
      case '~':
        if (typeof current === 'undefined' || current === null || current === '') {
          setData(value);
        }
        break;
      default:
        setData(value);
    }
  }

  getProcessList() {
    const now = new Date();
    return Object.keys(this.processes).map(processId => ({
      processId,
      correlationId: this.processes[processId].context.correlationId,
      line: this.processes[processId].context.line,
      runningTime: now - this.processes[processId].start,
      killed: this.processes[processId].context.killed
    }));
  }

  async kill(processId, wait = 0) {
    if (this.processes[processId]) {
      this.processes[processId].context.kill();
    }
    if (wait > 0) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(null), wait);
        this.processes[processId].context.killedCallback = () => {
          clearTimeout(timeout);
          resolve(this.processes[processId].context.export());
        };
      });
    }
  }

  async resume(state) {
    const context = new Context({}, state.correlationId);
    context.import(state);
    return this.run({}, {context});
  }

  async run(data, options = {}) {
    const returnContext = options.returnContext || false;

    const processId = ++this.lastProcessId;
    const correlationId = this.log.generateCorrelationId();
    const context = options.context || new Context(data, correlationId);
    const start = new Date();

    this.processes[processId] = {
      context,
      start
    };

    try {
      const commands = this.ast;
      if (!context.scriptState) {
        context.scriptState = 0;
      }
      for (let i = context.scriptState; i < commands.length; ++i) {
        context.scriptState = i;
        await this.runCommand(commands[i], context);
      }
    } catch (err) {
      delete this.processes[processId];
      throw err;
    }

    delete this.processes[processId];
    const time = (new Date() - start) / 1e3;
    this.statistic && this.statistic.add(time, {script: this.id});

    return returnContext ? context : (
      isImmutable(context.data) ? context.data.toJS() : context.data
    );
  }
}

Script.require = ['Container', 'Methods', 'Input', 'Log', 'Graphql', 'Statistics'];

module.exports = Script;
