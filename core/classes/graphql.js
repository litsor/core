'use strict';

const Router = require('koa-router');
const {graphqlKoa, graphiqlKoa} = require('apollo-server-koa');
const {makeExecutableSchema} = require('graphql-tools');
const {graphql, GraphQLScalarType} = require('graphql');
const GraphQLJson = require('graphql-type-json');
const {map, values} = require('lodash');
const validator = require('is-my-json-valid');

class Graphql {
  constructor({Http, Log}) {
    this.http = Http;
    this.log = Log;
  }

  startup() {
    const router = new Router();

    this.published = {};
    this.schema = null;

    router.post('/graphql', this.handleRequest.bind(this));
    router.get('/graphql', this.handleRequest.bind(this));

    router.get('/graphiql', graphiqlKoa({endpointURL: '/graphql'}));

    this.http.use('graphql', 2, router.routes());
  }

  shutdown() {
    this.http.unuse('graphql');
  }

  async query(query) {
    if (!this.schema) {
      throw new Error('Schema is not initialized');
    }
    const result = await graphql(this.schema, query.query, {}, {}, query.variables);
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  }

  handleRequest(ctx, next) {
    return this.handler(ctx, next);
  }

  async publish(schema, resolvers, name) {
    this.published[name] = {schema, resolvers};
    try {
      await this.setupRoutes();
    } catch (err) {
      this.log.critical('GraphQL error: ' + err.message);
    }
  }

  async setupRoutes() {
    const resolvers = {
      Query: {},
      Mutation: {},
      JSON: GraphQLJson
    };
    const emptySchema = `
      "Any known object type"
      interface AnyObject {
        id: ID!
      }
      "JSON value"
      scalar JSON
      type Query {a: Int}
      type Mutation {a: Int}
    `;
    this.schema = makeExecutableSchema({
      typeDefs: [emptySchema, ...map(values(this.published), 'schema')],
      resolvers: [resolvers, ...map(values(this.published), 'resolvers')]
    });
    this.handler = graphqlKoa(ctx => {
      const context = {
        ip: ctx.request.ip,
        headers: ctx.request.headers,
        correlationId: ctx.correlationId
      };
      return {schema: this.schema, context};
    });
    this.updateTypeMap();
  }

  updateTypeMap() {
    const output = {};
    const types = this.schema.getTypeMap();
    Object.keys(types).forEach(type => {
      if (typeof types[type].getFields !== 'function') {
        // Is a scalar type.
        return;
      }
      output[type] = {};
      const fields = types[type].getFields();
      Object.keys(fields).forEach(field => {
        const outputType = fields[field].type.toString().replace(/[^\w_]/g, '');
        output[type][field] = {type: outputType, args: {}};
        (fields[field].args || []).forEach(arg => {
          output[type][field].args[arg.name] = arg.type.toString().replace(/[^\w_]/g, '');
        });
      });
    });
    this.typeMap = output;
  }

  getFieldType(type, field) {
    try {
      return this.typeMap[type][field].type;
    } catch (err) {
      throw new Error(`Type ${type} does not have a field ${field}`);
    }
  }

  getParamType(type, field, param) {
    try {
      return this.typeMap[type][field].args[param];
    } catch (err) {
      throw new Error(`Field ${field} does not have a parameter ${param}`);
    }
  }

  isScalar(definition) {
    // All non-object types are scalar.
    // Objects are a JSON scalar when they allow extra properties.
    return definition.type !== 'object' || definition.additionalProperties !== false || typeof definition.properties !== 'object';
  }

  getGraphqlType(definition, input) {
    const primitives = {
      string: 'String',
      number: 'Float',
      integer: 'Int',
      boolean: 'Boolean'
    };
    if (definition.$ref) {
      let suffix = '';
      if (definition.isReference) {
        // References to other models should either get a "Object" suffix or "Input" for mutations.
        if (input) {
          return 'ID';
        }
        suffix = 'Object';
      }
      return definition.$ref.substring(14) + suffix;
    }
    return primitives[definition.type] || definition.type;
  }

  toGraphqlObjectType(name, definition) {
    const [properties, inputProperties] = [false, true].map(input => {
      return Object.keys(definition.properties).map(key => {
        const requiredMark = (definition.required || []).indexOf(key) >= 0 ? '!' : '';
        const type = this.getGraphqlType(definition.properties[key], input);
        return `  ${key}: ${type}${requiredMark}`;
      }).join('\n');
    });
    const description = JSON.stringify(definition.description || '');
    return `${description}\ntype ${name}Object implements AnyObject {\n  id: ID!\n${properties}\n}\ninput ${name}Input {\n${inputProperties}\n}\n`;
  }

  toGraphqlFilterType(name, definition) {
    const properties = Object.keys(definition.properties).reduce((prev, key) => {
      let filters;
      switch (definition.properties[key].type || '$ref') {
        case 'string':
          filters = [
            `  ${key}: String`,
            `  ${key}_ne: String`,
            `  ${key}_gt: String`,
            `  ${key}_gte: String`,
            `  ${key}_lt: String`,
            `  ${key}_lte: String`,
            `  ${key}_like: String`,
            `  ${key}_notLike: String`,
            `  ${key}_in: [String]`,
            `  ${key}_notIn: [String]`
          ];
          break;
        case 'integer':
          filters = [
            `  ${key}: Int`,
            `  ${key}_ne: Int`,
            `  ${key}_gt: Int`,
            `  ${key}_gte: Int`,
            `  ${key}_lt: Int`,
            `  ${key}_lte: Int`,
            `  ${key}_in: [Int]`,
            `  ${key}_notIn: [Int]`
          ];
          break;
        case 'number':
          filters = [
            `  ${key}: Float`,
            `  ${key}_ne: Float`,
            `  ${key}_gt: Float`,
            `  ${key}_gte: Float`,
            `  ${key}_lt: Float`,
            `  ${key}_lte: Float`,
            `  ${key}_in: [Float]`,
            `  ${key}_notIn: [Float]`
          ];
          break;
        case 'boolean':
          filters = [
            `  ${key}: Boolean`,
            `  ${key}_ne: Boolean`
          ];
          break;
        case '$ref':
          filters = [
            `  ${key}: ID`,
            `  ${key}_ne: ID`
          ];
          break;
        default:
          filters = [];
      }
      return [
        ...prev,
        ...filters
      ];
    }, []).join('\n');
    const description = JSON.stringify(definition.description || '');
    return `${description}\ninput ${name}FilterSet {\n${properties}\n}\n`;
  }

  toGraphqlConnectionType(name, definition) {
    const description = JSON.stringify(definition.description || '');
    return `${description}\ntype ${name}Connection {\n  count: Int\n  items: [${name}Object]\n}\n`;
  }

  toGraphqlScalarType(name, definition) {
    const description = JSON.stringify(definition.description || '');
    if (definition.type === 'string' && Array.isArray(definition.enum)) {
      const schema = `${description}\nenum ${name} {\n  ` + definition.enum.join('\n  ') + '\n}';
      return {resolver: {}, schema};
    }
    return {
      resolver: this.createScalarResolver(name, definition.description, definition),
      schema: `${description}\nscalar ${name}`
    };
  }

  createScalarResolver(name, description, schema) {
    const validate = validator(schema);
    return new GraphQLScalarType({
      name,
      description,
      serialize(value) {
        return value;
      },
      parseValue(value) {
        return value;
      },
      parseLiteral(ast) {
        if (!validate(ast.value)) {
          throw new Error(validate.error);
        }
        return ast.value;
      }
    });
  }
}

Graphql.singleton = true;
Graphql.require = ['Http', 'Log'];

module.exports = Graphql;
