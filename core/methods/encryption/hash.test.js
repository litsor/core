'use strict';

module.exports = {
  tests: [{
    can: 'calculate SHA1',
    left: 'test',
    right: 'sha1',
    output: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
  }, {
    can: 'calculate SHA256',
    left: 'Test',
    right: 'sha256',
    output: '532eaabd9574880dbf76b9b8cc00832c20a6ec113d682299550d7a6e0f345e25'
  }],
};
