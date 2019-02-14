'use strict';

module.exports = {
  id: '!=',
  title: '!=',
  description: 'Not equal',

  leftSchema: {},
  rightSchema: {},

  binary: (left, right) => left !== right
};
