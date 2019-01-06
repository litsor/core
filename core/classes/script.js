/* eslint-disable no-await-in-loop */
'use strict';

const {clone, cloneDeep, union, difference} = require('lodash');
const {get, set} = require('jsonpointer');
const {Grammars} = require('ebnf');
const grammar = require('../assets/grammar');

const parser = new Grammars.Custom.Parser(grammar);

class Context {
  constructor(data, path = '', level = 0, correlationId = '') {
    const cloned = cloneDeep(data);
    this.data = cloned;
    this.path = path;
    this.level = level;
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
    const array = [];
    let object = {};
    switch (type) {
      case 'object':
        // Serial execution matters for rest operator.
        for (let i = 0; i < (children || []).length; ++i) {
          const child = this.unpackAst(children[i]);
          if (child.rest_operator) {
            const addProperties = await this.runExpression(child.rest_operator[0], context);
            if (typeof addProperties !== 'object' || addProperties === null) {
              throw new TypeError('Expression for rest operator in objects must result in an object');
            }
            object = {
              ...object,
              ...addProperties
            };
          } else {
            const memberName = child.member_name[0];
            const name = memberName.type === 'name' ? child.member_name[0].text : await this.runExpression(memberName, context);
            if (typeof name !== 'string') {
              throw new TypeError('Expression for object member name does not return a string');
            }
            object[name] = await this.runExpression(child.expression[0], context);
          }
        }
        return object;
      case 'array':
        for (let i = 0; i < (children || []).length; ++i) {
          const child = children[i];
          if (child.type === 'rest_operator') {
            const addItems = await this.runExpression(child.children[0], context);
            if (!Array.isArray(addItems)) {
              throw new TypeError('Expression for rest operator in arrays must result in an array');
            }
            addItems.forEach(item => array.push(item));
          } else {
            array.push(await this.runExpression(child.children[0], context));
          }
        }
        return array;
      default:
        return JSON.parse(text);
    }
  }

  async getValue({type, text, children}, context) {
    let pointer;
    switch (type) {
      case 'jsonpointer':
        pointer = text || '/' + JSON.parse(children[0].text);
        if (pointer === '/') {
          return clone(context.data);
        }
        return clone(get(typeof context.data === 'object' && context !== null ? context.data : {}, pointer));
      case 'json':
      default:
        return this.getJson(children[0], context);
    }
  }

  async runUnaryExpression(method, expression, context) {
    const methodName = method.text || method.children[0].text;
    const callback = this.methods.getUnaryMethod(methodName);
    const operand = await this.runExpression(expression.children[0], context);
    return callback(operand, context);
  }

  async runBinaryExpression(left, method, right, context) {
    const methodName = method.text || method.children[0].text;
    const callback = this.methods.getBinaryMethod(methodName);
    if (callback.lazy) {
      const operand = source => data => {
        let expressionContext = context;
        if (typeof data !== 'undefined') {
          expressionContext = new Context(data, context.path, context.level + 1, context.correlationId);
          expressionContext.parent = context;
          context.child = expressionContext;
        }
        return this.runExpression(source.children[0], expressionContext);
      };
      return callback(operand(left), operand(right), context);
    }
    const leftOperand = await this.runExpression(left.children[0], context);
    const rightOperand = await this.runExpression(right.children[0], context);
    return callback(leftOperand, rightOperand, context);
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
    return this.graphql.query({query, variables});
  }

  async runExpression({type, children}, context) {
    if (context.killed) {
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
          subcontext = context.child || new Context(context.data, context.path + '/???', context.level + 1, context.correlationId);
          subcontext.parent = context;
          context.child = subcontext;
          if (!subcontext.scriptState) {
            subcontext.scriptState = 0;
          }
          for (let i = subcontext.scriptState; i < children.length; ++i) {
            subcontext.scriptState = i;
            await this.runCommand(children[i], subcontext);
          }
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
      throw new Error(this.id + ' line ' + children[0].line + ': ' + e.message);
    }
  }

  async runCommand(command, context) {
    context.setLine(command.line);
    context.child = null;
    context.unassignedValue = undefined;
    const config = this.unpackAst(command);
    const value = await this.runExpression(config.expression[0], context);
    if (!config.assignment) {
      context.unassignedValue = value || null;
      return context;
    }
    const [pointer, operator] = config.assignment.map(item => item.text || '/' + JSON.parse(item.children[0].text));
    const current = pointer === '/' ? context.data : get(context.data, pointer);
    const setData = pointer === '/' ? data => {
      context.data = data;
    } : data => set(context.data, pointer, data);
    let list;
    switch (operator) {
      case '[]=':
        list = Array.isArray(current) ? cloneDeep(current) : [];
        list.push(value);
        setData(list);
        break;
      case '=[]':
        list = Array.isArray(current) ? cloneDeep(current) : [];
        list.unshift(value);
        setData(list);
        break;
      case '+[]':
        list = Array.isArray(current) ? cloneDeep(current) : [];
        setData(union(list, [value]));
        break;
      case '-[]':
        list = Array.isArray(current) ? cloneDeep(current) : [];
        setData(difference(list, [value]));
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
        setData(current || value);
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

  kill(processId) {
    if (this.processes[processId]) {
      this.processes[processId].context.kill();
    }
  }

  async run(data, options = {}) {
    const returnContext = options.returnContext || false;

    const processId = ++this.lastProcessId;
    const correlationId = this.log.generateCorrelationId();
    let context = new Context(data, '', 0, correlationId);
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

    return returnContext ? context : context.data;
  }
}

Script.require = ['Container', 'Methods', 'Input', 'Log', 'Graphql', 'Statistics'];

module.exports = Script;
