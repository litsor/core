'use strict';

const ConfigFiles = require('./config-files');
const {PubSub} = require('apollo-server');
const SubscriptionIterator = require('./utilities/subscription-iterator');

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

    const {Graphql, ScriptsManager, Models, Selections, Streams} = dependencies;

    this.graphql = Graphql;
    this.scriptsManager = ScriptsManager;
    this.models = Models;
    this.selections = Selections;
    this.streams = Streams;

    this.pubsub = new PubSub();
  }

  async resolve(scriptName, object, args, context) {
    const script = this.scriptsManager.get(scriptName);
    const output = await script.run({...context, ...args});

    if (scriptName.match(/^Storage.+(Create|Update|Delete)$/) && typeof output === 'object' && output !== null && typeof args.model === 'string') {
      const model = this.models.get(args.model);

      // Check references that have reverse fields.
      // If so, we must publish the referenced object for subscriptions on the reverse link.
      Object.keys(model.properties).forEach(key => {
        if (model.properties[key].$ref && model.properties[key].reverse && output[key]) {
          const referencedModel = model.properties[key].$ref.substring(14);
          this.pubsub.publish(referencedModel, {id: output[key].id || output[key]});
        }
      });

      // Publish this object for listening subscriptions.
      this.pubsub.publish(model.id, output);
    }

    return output;
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
          subscriptionModels: [model.id],
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
          subscriptionModels: [model.id],
          params: {
            filters: {
              schema: {$ref: '#/definitions/' + model.id + 'FilterSet'},
              required: false,
              multiple: false
            },
            offset: {
              schema: {type: 'integer', minimum: 0},
              required: false,
              multiple: false
            },
            limit: {
              schema: {type: 'integer', minimum: 1},
              required: false,
              multiple: false
            },
            order: {
              schema: {$ref: '#/definitions/OrderFieldInput'},
              required: false,
              multiple: true
            }
          },
          variables: {
            model: model.id
          },
          outputSchema: {$ref: '#/definitions/' + model.id + 'Connection'},
          outputMultiple: false
        };
        Object.keys(model.properties).forEach(key => {
          const prop = model.properties[key];
          if (prop.isReference && prop.reverse) {
            const referencedModel = prop.$ref.substring(14);
            links['ReverseLink' + referencedModel + prop.reverse] = {
              id: 'ReverseLink' + referencedModel + prop.reverse,
              context: referencedModel,
              field: prop.reverse,
              script: `ReverseLink`,
              params: {
                filters: {
                  schema: {$ref: '#/definitions/' + model.id + 'FilterSet'},
                  required: false,
                  multiple: false
                },
                offset: {
                  schema: {type: 'integer', minimum: 0},
                  required: false,
                  multiple: false
                },
                limit: {
                  schema: {type: 'integer', minimum: 1},
                  required: false,
                  multiple: false
                },
                order: {
                  schema: {$ref: '#/definitions/OrderFieldInput'},
                  required: false,
                  multiple: true
                }
              },
              variables: {
                model: model.id,
                field: key
              },
              outputSchema: {$ref: '#/definitions/' + model.id + 'Connection'},
              outputMultiple: false
            };
          }
        });
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
              schema: {$ref: '#/definitions/' + model.id + 'UpdateInput'},
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
          outputSchema: {$ref: '#/definitions/DeletedObject'},
          outputMultiple: false
        };
      }
    });
    return links;
  }

  async prepareArgument(arg, context) {
    if (Array.isArray(arg)) {
      const output = [];
      for (let i = 0; i < arg.length; ++i) {
        output.push(await this.prepareArgument(arg[i], context));
      }
      return output;
    }

    if (typeof arg === 'object' && typeof arg.then === 'function') {
      // Argument is a promise, which is only used for file uploads.
      const {createReadStream, filename, mimetype} = await arg;
      arg = {
        stream: this.streams.registerStream(createReadStream()),
        filename,
        mimetype
      };
      context.streamIds.push(arg.stream);
    }

    return arg;
  }

  async prepareArguments(args, context) {
    const promises = Object.keys(args).map(async key => {
      args[key] = await this.prepareArgument(args[key], context)
    });
    await Promise.all(promises);
    return args;
  }

  async publish() {
    const defaultLinks = this.getDefaultLinks();
    const resolvers = {
      Query: {},
      Mutation: {}
    };
    const baseSchema = `input OrderFieldInput { field: String! direction: OrderDirection} enum OrderDirection { ASC DESC }`;
    const schema = baseSchema + Object.keys({...this.items, ...defaultLinks}).map(id => {
      const {field, script, params, variables, outputSchema, outputMultiple, subscriptionModels} = this.items[id] || defaultLinks[id];
      let {context} = this.items[id] || defaultLinks[id];

      if (context !== 'Query' && context !== 'Mutation') {
        context += 'Object';
      }

      if (typeof resolvers[context] === 'undefined') {
        resolvers[context] = {};
      }

      resolvers[context][field] = async (object, args, context, ast) => {
        const argumentsContext = {
          streamIds: []
        };
        try {
          args = await this.prepareArguments(args, argumentsContext);

          const selections = this.astToSelectionTree(ast.fieldNodes[0]);

          // Check if field is already resolved.
          if (object && this.selections.isComplete(object[ast.fieldName], selections)) {
            return object[ast.fieldName];
          }

          let parent = {model: null, id: null};
          if (typeof object !== 'undefined' && object.id && ast.parentType) {
            parent = {
              model: String(ast.parentType).replace(/Object$/, ''),
              id: String(object.id)
            };
          }

          const result = await this.resolve(script, object, {selections, parent, ...args, ...variables}, context);
          argumentsContext.streamIds.map(id => this.streams.removeStream(id));
          return result;
        } catch (error) {
          argumentsContext.streamIds.map(id => this.streams.removeStream(id));
          throw error;
        }
      };

      // Add subscription resolver if enabled for this field.
      if (subscriptionModels) {
        if (typeof resolvers.Subscription === 'undefined') {
          resolvers.Subscription = {};
        }
        resolvers.Subscription[field] = {
          subscribe: (_, variables, context, ast) => {
            const iterator = this.pubsub.asyncIterator(subscriptionModels);
            return new SubscriptionIterator({
              iterator,
              resolver: resolvers.Query[field],
              field,
              variables,
              context: {...context, subscription: true},
              ast
            });
          }
        };
      }

      const paramSpecs = Object.keys(params).map(name => {
        const typeSpec = params[name].multiple ? '[' + this.graphql.getGraphqlType(params[name].schema) + ']' : this.graphql.getGraphqlType(params[name].schema);
        const requiredMark = params[name].required ? '!' : '';
        return `${name}: ${typeSpec}${requiredMark}`;
      });
      const paramSpec = paramSpecs.length > 0 ? ' (' + paramSpecs.join(', ') + ')' : '';
      const outputSpec = outputMultiple ? '[' + this.graphql.getGraphqlType(outputSchema) + ']' : this.graphql.getGraphqlType(outputSchema);
      let schemaAdditions = `extend type ${context} {\n  ${field}${paramSpec}: ${outputSpec}\n}`;
      if (subscriptionModels) {
        schemaAdditions += `\nextend type Subscription {\n  ${field}${paramSpec}: ${outputSpec}\n}`;
      }
      return schemaAdditions;
    }).join('\n');
    await this.graphql.publish(schema, resolvers, 'GraphqlLinks');
  }
}

GraphqlLinks.require = ['Graphql', 'ScriptsManager', 'Models', 'Selections', 'Streams', ...ConfigFiles.require];

module.exports = GraphqlLinks;
