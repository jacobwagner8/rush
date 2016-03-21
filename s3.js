module.exports = function(aws_key, aws_secret) {
  const AWS = require('aws-sdk');
  AWS.config.region = 'us-west-1';
  var s3bucket = new AWS.S3({ params: { Bucket: 'rushee-pictures' } });
}

process.env.AWS_ACCESS_KEY_ID = process.env.AWS_KEY_ID || secrets.aws_id;
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_KEY_SECRET || secrets.aws_secret;
