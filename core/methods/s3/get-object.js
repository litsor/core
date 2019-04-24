'use strict';

const {promisify} = require('util');
const AWS = require('aws-sdk');

module.exports = {
  id: 'getObject',
  name: 'Get object from S3 storage',
  requires: [],
  tests: [],
  unary: async input => {
    const {server, bucket, key} = input.toJS();
    server = server || {
      accessKeyId: '722AE4F7',
      secretAccessKey: 'DF52DD548DD84E86BE3106BD7012F99D',
      endpoint: 'http://s3:9000'
    };
    const {region, accessKeyId, secretAccessKey, endpoint} = server;
    if (region) {
      AWS.config.update({region});
    }
    const s3  = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      apiVersion: '2006-03-01'
    });
    s3.getObject = promisify(s3.getObject);

    const params = {
      Bucket: bucket,
      Key: key
    };
    const response = await s3.getObject(params);
    return response.Body.toString('base64');
  }
};
