'use strict';

const ConfigFiles = require('./config-files');

class Models extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);

    this.graphql = dependencies.Graphql;
    this.database = dependencies.Database;

    this.configName = 'models';
  }

  create(definition) {
    definition.type = definition.type || 'object';
    if (definition.type === 'object' && typeof definition.properties === 'object') {
      definition.additionalProperties = false;
    }
    return definition;
  }

  async publish() {
    const {schema, resolvers} = this.getSchema();
    await this.graphql.publish(schema, resolvers, 'Models');
    const promises = Object.keys(this.items).filter(name => {
      return this.items[name].store;
    }).map(name => {
      return this.database.publish(name, this.items[name], this);
    });
    await Promise.all(promises);
  }

  addPrimitiveType(definition) {
    if (typeof definition.$ref !== 'undefined') {
      const ref = definition.$ref.substring(14);
      if (typeof this.items[ref] !== 'undefined' && this.items[ref].type !== 'object') {
        definition.type = this.items[ref].type;
      } else {
        definition.isReference = true;
      }
    }
  }

  getSchema() {
    const resolvers = {};
    const schema = this.getNames().reduce((prev, name) => {
      const definition = this.get(name);
      if (this.graphql.isScalar(definition)) {
        const {resolver, schema} = this.graphql.toGraphqlScalarType(name, definition);
        resolvers[name] = resolver;
        return [...prev, schema];
      }
      Object.keys(definition.properties).forEach(name => {
        this.addPrimitiveType(definition.properties[name]);
      });
      return [
        ...prev,
        this.graphql.toGraphqlObjectType(name, definition),
        this.graphql.toGraphqlFilterType(name, definition),
        this.graphql.toGraphqlConnectionType(name, definition)
      ];
    }, []).join('\n');
    return {schema, resolvers};
  }
}

Models.singleton = true;
Models.require = ['Graphql', 'Database', ...ConfigFiles.require];

module.exports = Models;
