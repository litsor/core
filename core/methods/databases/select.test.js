'use strict';

module.exports = {
  mockups: {
    Models: {
      get() {
        return {
          properties: {
            title: {type: 'string'}
          }
        };
      }
    },
    Database: {
      get() {
        return {
          findAll({attributes}) {
            if (Array.isArray(attributes[0])) {
              return [{dataValues: {count: 1}}];
            }
            return [{dataValues: {id: '1', title: 'Test A'}}];
          }
        };
      }
    },
    ScriptsManager: {
      get() {
        return {};
      }
    }
  },

  tests: [{
    title: 'Can select all results',
    input: {
      model: 'Post',
      selections: {count: {}, items: {}}
    },
    output: {count: 1, items: [{id: '1', title: 'Test A'}]}
  }]
};
