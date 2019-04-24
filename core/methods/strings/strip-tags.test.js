'use strict';

module.exports = {
  tests: [{
    can: 'strip all HTML tags',
    input: '<b>Test</b>',
    output: 'Test'
  }, {
    can: 'strip disallowed HTML tags',
    left: '<b>Test <em>string</em> <script>evil();</script></b>',
    right: ['b', 'em'],
    output: '<b>Test <em>string</em> evil();</b>'
  }]
};
