const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

const uploadFileToS3 = (file, type = 'doc') => {
  return new Promise((resolve, reject) => {
    const destination = type==='doc' ? 'documents/': 'profilepics/';
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: destination + file.filename,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const generatePresignedUrlForDownload = (fileKey) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    Expires: 60 * 60, // URL expires in 15 mins
  }

  return s3.getSignedUrlPromise('getObject', params)
}

module.exports = { uploadFileToS3, generatePresignedUrlForDownload };
