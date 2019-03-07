'use strict';

module.exports = {
  title: 'Modulo',
  description: 'Calculate modulo',

  leftSchema: {type: 'integer'},
  rightSchema: {type: 'integer'},

  requires: [],

  binary: (left, right) => left % right
};
