'use strict';

const ConfigFiles = require('./config-files');

class GraphqlLinks extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);

    this.configName = 'links';

    const {Graphql, ScriptsManager, Models} = dependencies;

    this.graphql = Graphql;
    this.scriptsManager = ScriptsManager;
    this.models = Models;
  }

  async resolve(scriptName, object, args, context) {
    const script = this.scriptsManager.get(scriptName);
    return script.run({
      ip: context.ip,
      ...args
    });
  }

  astToSelectionTree(ast) {
    return ((ast.selectionSet || {}).selections || []).reduce((prev, field) => {
      return {
        ...prev,
        [field.name.value]: this.astToSelectionTree(field)
      };
    }, {});
  }

  async publish() {
    const resolvers = {
      Query: {},
      Mutation: {}
    };
    const schema = Object.keys(this.items).map(id => {
      const {field, script, params, variables, outputSchema, outputMultiple} = this.items[id];
      let {context} = this.items[id];

      if (context !== 'Query' && context !== 'Mutation') {
        context += 'Object';
      }

      if (typeof resolvers[context] === 'undefined') {
        resolvers[context] = {};
      }

      resolvers[context][field] = (object, args, context, ast) => {
        let parent = {model: null, id: null};
        if (typeof object !== 'undefined' && object.id && ast.parentType) {
          parent = {
            model: String(ast.parentType).replace(/Object$/, ''),
            id: String(object.id)
          };
        }
        const selections = this.astToSelectionTree(ast.fieldNodes[0]);
        return this.resolve(script, object, {selections, parent, ...args, ...variables}, context);
      };

      const paramSpecs = Object.keys(params).map(name => {
        const typeSpec = params[name].multiple ? '[' + this.graphql.getGraphqlType(params[name].schema) + ']' : this.graphql.getGraphqlType(params[name].schema);
        const requiredMark = params[name].required ? '!' : '';
        return `${name}: ${typeSpec}${requiredMark}`;
      });
      const paramSpec = paramSpecs.length > 0 ? ' (' + paramSpecs.join(', ') + ')' : '';
      const outputSpec = outputMultiple ? '[' + this.graphql.getGraphqlType(outputSchema) + ']' : this.graphql.getGraphqlType(outputSchema);
      return `extend type ${context} {\n  ${field}${paramSpec}: ${outputSpec}\n}`;
    }).join('\n');
    await this.graphql.publish(schema, resolvers, 'GraphqlLinks');
  }
}

GraphqlLinks.require = ['Graphql', 'ScriptsManager', 'Models', ...ConfigFiles.require];

module.exports = GraphqlLinks;
