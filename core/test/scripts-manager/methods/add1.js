'use strict';

module.exports = {
  getValue(name) {
    return (global.add1 || {})[name] || 0;
  },

  reset() {
    global.add1 = {};
  },

  unary: name => {
    global.add1 = global.add1 || {};
    global.add1[name] = (global.add1[name] || 0) + 1;
  }
};
