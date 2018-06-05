/* eslint-disable no-await-in-loop */
'use strict';

const {clone, cloneDeep, union, difference} = require('lodash');
const {get, set} = require('jsonpointer');
const {Grammars} = require('ebnf');
const grammar = require('../assets/grammar');

const parser = new Grammars.Custom.Parser(grammar);

class Context {
  constructor(data, root = data, path = []) {
    this.data = cloneDeep(data);
    this.root = root;
    this.path = path;
  }
}

class Script {
  constructor({Methods, Graphql, Log}) {
    this.methods = Methods;
    this.graphql = Graphql;
    this.log = Log;

    this.ast = [];
    this.id = null;
  }

  load(script) {
    if (typeof script === 'object') {
      this.ast = script;
    }

    const line = position => script.substring(0, position).split('\n').length;
    const cleanup = ({type, text, children, start}) => children.length > 0 ? {
      type, children: children.map(cleanup), line: line(start)
    } : {type, text, line: line(start)};
    this.ast = parser.getAST(script).children.map(cleanup);
  }

  setId(id) {
    this.id = id;
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
    const promises = [];
    switch (type) {
      case 'object':
        let object = {};
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
        const array = [];
        const items = (children || []).forEach(child => {
          promises.push((async () => {
            if (child.type === 'rest_operator') {
              const addItems = await this.runExpression(child.children[0], context);
              if (!Array.isArray(addItems)) {
                throw new TypeError('Expression for rest operator in arrays must result in an array');
              }
              addItems.forEach(item => array.push(item));
            } else {
              array.push(await this.runExpression(child.children[0], context));
            }
          })());
        });
        await Promise.all(promises);
        return array;
      default:
        return JSON.parse(text);
    }
  }

  async getValue({type, text, children}, context) {
    let pointer;
    switch (type) {
      case 'json':
        return this.getJson(children[0], context);
      case 'jsonpointer':
        pointer = text || '/' + JSON.parse(children[0].text);
        if (pointer === '/') {
          return clone(context.data);
        }
        return clone(get(typeof context.data === 'object' && context !== null ? context.data : {}, pointer));
      case 'root_jsonpointer':
        pointer = children[0].text || '/' + JSON.parse(children[0].children[0].text);
        return clone(get(context.root, pointer));
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
          expressionContext = new Context(data, context.root, context.path);
        }
        return this.runExpression(source.children[0], expressionContext);
      }
      return callback(operand(left), operand(right), context);
    }
    const leftOperand = await this.runExpression(left.children[0], context);
    const rightOperand = await this.runExpression(right.children[0], context);
    return callback(leftOperand, rightOperand, context);
  }

  async runIf(expression, thenExpression, elseExpression, context) {
    if (await this.runExpression(expression, context)) {
      return await this.runExpression(thenExpression, context);
    } else if (elseExpression) {
      return await this.runExpression(elseExpression, context);
    }
    return false;
  }

  async getSelections(selections, params, variables, context) {
    const fields = [];
    for (let i = 0; i < selections.length; ++i) {
      const selection = selections[i].children[0];
      const {type} = selection;
      const field = this.unpackAst(selection, ['param']);
      if (type === 'query_field') {
        const alias = field.field_alias ? field.field_alias[0].text + ':' : '';
        let definition = alias + field.name;
        if (field.param) {
          const paramDefs = [];
          for (let i = 0; i < field.param.length; ++i) {
            const {name, graphql_type, ...expression} = this.unpackAst({children: field.param[i]});
            if (graphql_type) {
              const num = Object.keys(variables).length + 1;
              params.push(`$var${num}:${graphql_type}`);
              variables['var' + num] = await this.getValue(expression.value[0], context);
              paramDefs.push(`${name}:$var${num}`);
            } else {
              // The expression can only contains a JSON scalar type.
              // We can use its value without any further checks.
              const value = expression[Object.keys(expression)[0]];
              paramDefs.push(`${name}:${value}`);
            }
          }
          definition += ' (' + paramDefs.join(',') + ')';
        }
        if (field.selections) {
          definition += ' ' + (await this.getSelections(field.selections, params, variables, context)).fields;
        }
        fields.push(definition);
      }
      if (type === 'query_fragment') {
        const name = selection.children[0].text;
        const subfields = (await this.getSelections(selection.children[1].children, params, variables, context)).fields;
        fields.push('...on ' + name + subfields);
      }
    }
    return {fields: '{' + fields.join(' ') + '}', params, variables};
  }

  async runQuery(type, selections, context) {
    const {fields, params, variables} = await this.getSelections(selections, [], {}, context);
    const query = `${type}${params.length > 0 ? ' (' + params.join(',') + ')' : ''} ${fields}`;
    return type === 'query' ? this.graphql.query({query, variables}) : this.graphql.mutate({mutation: query, variables});
  }

  async runExpression({type, children}, context) {
    try {
      switch (type) {
        case 'value':
          return this.getValue(children[0], context);
        case 'unary_expression':
          return this.runUnaryExpression(children[0], children[1], context);
        case 'binary_expression':
          return this.runBinaryExpression(children[0], children[1], children[2], context);
        case 'expression':
        case 'expression_nb':
          return this.runExpression(children[0], context);
        case 'if_statement':
          return this.runIf(children[0], children[1], children.length > 2 ? children[2] : false, context);
        case 'script':
          let subcontext = new Context(context.data, context.root, context.path + '/???');
          for (let i = 0; i < children.length; ++i) {
            subcontext = await this.runCommand(children[i], subcontext);
          }
          return subcontext.data;
        case 'query_statement':
          return this.runQuery(children[0].text, children[1].children, context);
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
    const config = this.unpackAst(command);
    const value = await this.runExpression(config.expression[0], context);
    if (!config.assignment) {
      return context;
    }
    const [pointer, operator] = config.assignment.map(item => item.text || '/' + JSON.parse(item.children[0].text));
    const current = pointer === '/' ? context.data : get(context.data, pointer);
    const setData = pointer === '/' ? data => context.data = data : data => set(context.data, pointer, data);
    let list;
    switch (operator) {
      case '=':
        setData(value);
        break;
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
    }
    return context;
  }

  async run(data, options = {}) {
    const returnContext = options.returnContext || false;
    const correlationId = options.correlationId || this.log.generateCorrelationId();

    const commands = this.ast;
    let context = new Context(data, data, '');
    for (let i = 0; i < commands.length; ++i) {
      context = await this.runCommand(commands[i], context);
    }
    return returnContext ? context : context.data;
  }
}

Script.require = ['Container', 'Methods', 'Input', 'Log', 'Graphql'];

module.exports = Script;
