const S3Client = require('s3-browser-direct-upload');

const dev = process.env.ENV !== 'prod';

if (dev)
  const secrets = require('./secrets');

const s3ClientOptions = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || secrets.aws_id,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || secrets.aws_secret,
  region: 'us-west-1'
};

const s3Client = new S3Client(s3ClientOptions, ['jpg', 'png']);
Promise.promisifyAll(s3Client);

function getUploadOptions(key) {
  return {
    key: key,
    bucket: 'rushee-pictures'
  };
}

module.exports = function getUploadParams(key) {
  const options = getUploadOptions(key);
  return s3Client.uploadPostFormAsync(options);
};
