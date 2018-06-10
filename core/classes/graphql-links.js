'use strict';

const ConfigFiles = require('./config-files');

class GraphqlLinks extends ConfigFiles {
  constructor(dependencies) {
    super(dependencies);

    this.configName = 'links';

    this.validationSchema = {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        context: {
          type: 'string'
        },
        field: {
          type: 'string',
          pattern: '^[a-zA-Z][a-zA-Z0-9]+$'
        },
        script: {
          type: 'string'
        },
        params: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              schema: {
                oneOf: [{
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string'
                    }
                  },
                  required: ['type']
                }, {
                  type: 'object',
                  properties: {
                    $ref: {
                      type: 'string'
                    }
                  },
                  required: ['$ref']
                }]
              },
              required: {
                type: 'boolean'
              },
              multiple: {
                type: 'boolean'
              }
            },
            required: ['schema', 'required', 'multiple']
          }
        },
        variables: {
          type: 'object'
        },
        outputSchema: {
          oneOf: [{
            type: 'object',
            properties: {
              type: {
                type: 'string'
              }
            },
            required: ['type']
          }, {
            type: 'object',
            properties: {
              $ref: {
                type: 'string'
              }
            },
            required: ['$ref']
          }]
        },
        outputMultiple: {
          type: 'boolean'
        }
      },
      required: ['id', 'context', 'field', 'script', 'params', 'outputSchema', 'outputMultiple'],
      additionalProperties: false
    };

    const {Graphql, ScriptsManager, Models} = dependencies;

    this.graphql = Graphql;
    this.scriptsManager = ScriptsManager;
    this.models = Models;
  }

  async resolve(scriptName, object, args, context) {
    const script = this.scriptsManager.get(scriptName);
    return script.run({...context, ...args});
  }

  astToSelectionTree(ast) {
    return ((ast.selectionSet || {}).selections || []).reduce((prev, field) => {
      return {
        ...prev,
        [field.name.value]: this.astToSelectionTree(field)
      };
    }, {});
  }

  getDefaultLinks() {
    const links = {};

    this.models.getNames().map(name => {
      return this.models.get(name);
    }).filter(model => model.storage).forEach(model => {
      if (this.scriptsManager.has(`Storage${model.storage}Read`)) {
        links['Read' + model.id] = {
          id: 'Read' + model.id,
          context: 'Query',
          field: model.id,
          script: `Storage${model.storage}Read`,
          params: {
            id: {
              schema: {$ref: '#/definitions/ID'},
              required: true,
              multiple: false
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Object'},
          outputMultiple: false
        };
      }
      if (this.scriptsManager.has(`Storage${model.storage}List`)) {
        links['List' + model.id] = {
          id: 'List' + model.id,
          context: 'Query',
          field: 'list' + model.id,
          script: `Storage${model.storage}List`,
          params: {
            filters: {
              schema: {$ref: '#/definitions/' + model.id + 'FilterSet'},
              required: false,
              multiple: false
            },
            offset: {
              schema: {type: 'integer', minimum: 0}
            },
            limit: {
              schema: {type: 'integer', minimum: 1}
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Connection'},
          outputMultiple: false
        };
      }
      if (this.scriptsManager.has(`Storage${model.storage}Create`)) {
        links['Create' + model.id] = {
          id: 'Create' + model.id,
          context: 'Mutation',
          field: 'create' + model.id,
          script: `Storage${model.storage}Create`,
          params: {
            input: {
              schema: {$ref: '#/definitions/' + model.id + 'Input'},
              required: true,
              multiple: false
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Object'},
          outputMultiple: false
        };
      }
      if (this.scriptsManager.has(`Storage${model.storage}Update`)) {
        links['Update' + model.id] = {
          id: 'Update' + model.id,
          context: 'Mutation',
          field: 'update' + model.id,
          script: `Storage${model.storage}Update`,
          params: {
            id: {
              schema: {$ref: '#/definitions/ID'},
              required: true,
              multiple: false
            },
            input: {
              schema: {$ref: '#/definitions/' + model.id + 'Input'},
              required: true,
              multiple: false
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Object'},
          outputMultiple: false
        };
      }
      if (this.scriptsManager.has(`Storage${model.storage}Delete`)) {
        links['Delete' + model.id] = {
          id: 'Delete' + model.id,
          context: 'Mutation',
          field: 'delete' + model.id,
          script: `Storage${model.storage}Delete`,
          params: {
            id: {
              schema: {$ref: '#/definitions/ID'},
              required: true,
              multiple: false
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Object'},
          outputMultiple: false
        };
      }
    });
    return links;
  }

  async publish() {
    const defaultLinks = this.getDefaultLinks();
    const resolvers = {
      Query: {},
      Mutation: {}
    };
    const schema = Object.keys({...this.items, ...defaultLinks}).map(id => {
      const {field, script, params, variables, outputSchema, outputMultiple} = this.items[id] || defaultLinks[id];
      let {context} = this.items[id] || defaultLinks[id];

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
