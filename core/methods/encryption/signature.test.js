'use strict';

module.exports = {
  mockups: {
    Encrypt: {
      hmac() {
        return 'fXwwpyOBsbt797iJg5SriKSNnzqr3bdXZspYuySaLAU=';
      }
    }
  },

  tests: [{
    can: 'generate signature',
    input: 'input text',
    output: 'fXwwpyOBsbt797iJg5SriKSNnzqr3bdXZspYuySaLAU='
  }],
};
