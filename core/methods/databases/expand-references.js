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

    const isComplete = (data, selections) => Object.keys(selections).reduce((complete, key) => {
      if (typeof (data || {})[key] === 'undefined') {
        // Check if we're dealing with an array of items and process them individually.
        if (Array.isArray(data)) {
          return complete && data.reduce((subComplete, item) => {
            return subComplete && isComplete(item, selections);
          }, true);
        }

        return false;
      }
      if (Object.keys(selections[key]).length > 0) {
        return complete && isComplete(data[key], selections[key]);
      }

      return complete;
    }, true);

    // Bail out if all fields are provided in the data.
    if (isComplete(data, selections)) {
      // console.log('complete');
      // console.log(data, subselections);
      return Immutable.fromJS(data);
    }

    const promises = [];

    Object.keys(data).forEach(field => {
      if (typeof modelInstance.properties[field] === 'object' && modelInstance.properties[field].isReference && data[field] !== null) {
        const id = typeof data[field] === 'object' ? data[field].id : String(data[field]);

        // Get the subselections and make sure that it includes the "id" field.
        const subselections = {id: {}, ...selections[field]} || {id: {}};

        // Remove fields from the selection that were already provided on the input, but keep the "id" field.
        // Also, if the field has subselections we need to check if this field is complete.
        Object.keys(subselections).forEach(key => {
          if (key !== 'id' && typeof data[field][key] !== 'undefined' && (Object.keys(subselections[key]).length === 0 || isComplete(data[field][key], subselections[key]))) {
            delete subselections[key];
          }
        });

        // Only return the id field when no or no other fields are requested.
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
                id,
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
