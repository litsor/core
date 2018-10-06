'use strict';

const {promisify} = require('util');
const AWS = require('aws-sdk');

module.exports = {
  id: 'listBuckets',
  name: 'List buckets S3 storage',
  requires: [],
  tests: [],
  unary: async ({server}) => {
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
    s3.listBuckets = promisify(s3.listBuckets);

    const params = {};
    const response = await s3.listBuckets(params);
    return response.Buckets.map(bucket => bucket.Name);
  }
};
