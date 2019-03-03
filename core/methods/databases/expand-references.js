'use strict';

module.exports = {
  id: 'expandReferences',
  name: 'Expand references',
  description: 'Load referenced data',

  inputSchema: {
    type: 'object',
    properties: {
      data: {
        title: 'Loaded object',
        type: 'object'
      },
      model: {
        title: 'Model name',
        type: 'string'
      },
      selections: {
        title: 'Selected fields',
        type: 'object'
      }
    }
  },

  requires: ['Models', 'ScriptsManager', 'Immutable'],

  unary: async (left, {Models, ScriptsManager, Immutable}) => {
    const {data: input, model, selections} = left.toJS();
    const data = {...input};
    const modelInstance = Models.get(model);

    const promises = [];
    Object.keys(data).forEach(field => {
      if (typeof modelInstance.properties[field] === 'object' && modelInstance.properties[field].isReference && data[field] !== null) {
        const subselections = {id: {}, ...selections[field]} || {id: {}};
        const id = typeof data[field] === 'object' ? data[field].id : String(data[field]);
        // Skip fields that were already provided on the input.
        Object.keys(subselections).forEach(key => {
          if (key !== 'id' && typeof data[field][key] !== 'undefined' && Object.keys(subselections[key]).length === 0) {
            delete subselections[key];
          }
        });
        if (Object.keys(subselections).length <= 1) {
          data[field] = typeof data[field] === 'object' ? data[field] : {id};
        } else {
          promises.push((async () => {
            const refmodel = modelInstance.properties[field].$ref.substring(14);
            try {
              const {storage} = Models.get(refmodel);
              const script = ScriptsManager.get(`Storage${storage}Read`);
              data[field] = await script.run({
                model: refmodel,
                id: data[field],
                selections: subselections
              });
            } catch (err) {
              data[field] = null;
            }
          })());
        }
      }
    });
    await Promise.all(promises);

    return Immutable.fromJS(data);
  }
};
