/**
 * Wrapper for retrieving AWS S3 upload parameters.
 * For use with post forms (see dist/js/register.js for example).
 */

const S3Client = require('s3-browser-direct-upload');

var config = require('./config');
var secrets = require('./secrets');

const s3ClientOptions = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || secrets.aws_id,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || secrets.aws_secret,
  region: config.s3_region,
};

console.log(s3ClientOptions);

const s3Client = new S3Client(s3ClientOptions, ['jpg', 'png']);
Promise.promisifyAll(s3Client);

function getUploadOptions(key) {
  return {
    key: key,
    bucket: config.s3_bucket,
  };
}

module.exports = function getUploadParams(key) {
  const options = getUploadOptions(key);
  console.log(options);
  return s3Client.uploadPostForm(options, function(err, params){
    console.log("----");
    console.log(err, params); // params contain all the data required to build browser-based form for direct upload (check API Documentation)
    return (params);
  });
};
