'use strict';

module.exports = {
  mockups: {
    Models: {
      get(name) {
        if (name === 'Post') {
          return {
            storage: 'Internal',
            properties: {
              author: {
                $ref: '#/definitions/User',
                isReference: true
              }
            }
          };
        }
        if (name === 'User') {
          return {
            storage: 'Internal',
            properties: {
              name: {
                type: 'string'
              }
            }
          };
        }
      }
    },
    ScriptsManager: {
      get(name) {
        if (name === 'StorageInternalRead') {
          return {
            run({model}) {
              if (model === 'User') {
                return {
                  name: 'John'
                };
              }
            }
          };
        }
      }
    }
  },

  tests: [{
    can: 'expand reference',
    input: {
      id: '1',
      model: 'Post',
      data: {
        author: '2'
      },
      selections: {
        author: {
          name: {}
        }
      }
    },
    output: {
      author: {
        name: 'John'
      }
    }
  }, {
    can: 'return id without loading object',
    input: {
      id: '1',
      model: 'Post',
      data: {
        author: '2'
      },
      selections: {
        author: {
          id: {}
        }
      }
    },
    output: {
      author: {
        id: '2',
        __typename: 'UserObject'
      }
    }
  }]
};
