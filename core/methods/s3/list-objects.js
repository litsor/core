'use strict';

const {promisify} = require('util');
const AWS = require('aws-sdk');

module.exports = {
  id: 'listObjects',
  name: 'List objects in S3 storage',
  requires: [],
  tests: [],
  unary: async ({server, bucket, limit, token}) => {
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
    s3.listObjectsV2 = promisify(s3.listObjectsV2);

    const params = {
      Bucket: bucket,
      MaxKeys: limit && limit > 0 ? Math.min(limit, 100) : 10,
      ContinuationToken: token
    };
    const response = await s3.listObjectsV2(params);
    return {
      objects: response.Contents.map(({Key: key, Size: size, LastModified: lastModified}) => ({
        key,
        size,
        lastModified: ~~(lastModified / 1e3)
      })),
      next: response.IsTruncated ? response.NextContinuationToken : null
    };
  }
};
