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

  requires: ['Models', 'ScriptsManager', 'Immutable', 'Selections'],

  unary: async (left, {Models, ScriptsManager, Immutable, Selections}) => {
    const {data: input, model, selections} = left.toJS();
    const data = {...input};
    const modelInstance = Models.get(model);

    // Bail out if all fields are provided in the data.
    if (Selections.isComplete(data, selections)) {
      // console.log('complete');
      // console.log(data, subselections);
      return Immutable.fromJS(data);
    }

    const promises = [];

    Object.keys(data).forEach(field => {
      if (typeof modelInstance.properties[field] === 'object' && modelInstance.properties[field].isReference && data[field] !== null) {
        const id = typeof data[field] === 'object' ? data[field].id : String(data[field]);
        const refmodel = modelInstance.properties[field].$ref ? modelInstance.properties[field].$ref.substring(14) : null;
        const __typename = refmodel ? `${refmodel}Object` : undefined;

        // Get the subselections and make sure that it includes the "id" field.
        const subselections = {id: {}, __typename, ...selections[field]} || {id: {}, __typename};

        // Remove fields from the selection that were already provided on the input, but keep the "id" field.
        // Also, if the field has subselections we need to check if this field is complete.
        Object.keys(subselections).forEach(key => {
          if (key !== 'id' && key !== '__typename' && typeof data[field][key] !== 'undefined' && (Object.keys(subselections[key]).length === 0 || Selections.isComplete(data[field][key], subselections[key]))) {
            delete subselections[key];
          }
        });

        // Only return the id and __typename fields when no or no other fields are requested.
        if (Object.keys(subselections).length <= 2) {
          data[field] = typeof data[field] === 'object' ? data[field] : {id, __typename};
        } else {
          promises.push((async () => {
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
