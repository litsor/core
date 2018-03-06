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
    const output = await script.run({
      ip: context.ip,
      ...args
    });
    return output.data;
  }

  async publish() {
    const resolvers = {
      Query: {},
      Mutation: {}
    };
    const schema = Object.keys(this.items).map(id => {
      const {context, field, script, params, variables, outputSchema, outputMultiple} = this.items[id];

      resolvers[context][field] = (object, args, context, ast) => {
        const selections = ast.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
        return this.resolve(script, object, {selections, ...args, ...variables}, context);
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
