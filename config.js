const production = process.env.PRODUCTION === 'true';

module.exports = {
  production,
  do_db_reset: production && false,
  event_dates: [1, 3, 5, 8],
  s3_region: process.env.AWS_REGION,
  s3_bucket: process.env.S3_BUCKET,
  db_host: process.env.DB_HOST,
  db_user: process.env.DB_USERNAME,
  db_port: process.env.DB_PORT,
  http_port: production ? 80 : 8000,
};
