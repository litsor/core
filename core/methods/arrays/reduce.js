'use strict';

module.exports = {
  name: 'Reduce',
  description: 'Reduce list to single value',
  lazy: true,

  leftSchema: {type: 'array'},
  rightSchema: {title: 'Reducer'},

  binary: async (input, reducer, {}, context) => {
    let output = null;
    const items = await input();
    for (let i = 0; i < items.length; ++i) {
      output = await reducer({
        previous: output,
        current: items[i]
      }, context);
    }
    return output;
  }
};
