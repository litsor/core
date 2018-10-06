'use strict';

module.exports = {
  title: 'Map',
  description: 'Process each item in an array',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Callback'},

  binary: async (left, right, {}, context) => {
    const value = await left();
    return Promise.all(value.map(item => right({
      ...context.data,
      item
    })));
  }
};
