'use strict';

module.exports = {
  id: '<=',
  title: '<=',
  description: 'Less than or equal',

  leftSchema: {},
  rightSchema: {},

  binary: (left, right) => left <= right
};
