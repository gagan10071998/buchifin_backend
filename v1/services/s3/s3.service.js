const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
class S3Service {
  #s3Client;
  constructor() {
    this.#s3Client = new S3Client({
      endpoint: "https://s3.us-east-005.backblazeb2.com",
      region: "us-east-005",
      credentials: {
        accessKeyId: "0056e44bb463fb60000000001",
        secretAccessKey: "K005CUURx7MPRnzSU3tPK/SpNQoXUPA"
      }
    });
  }

  async uploadFile({ bucketName = "buchifin", fileName, fileContent }) {
    console.log(
      `Uploading file to bucket: ${bucketName}, fileName: ${fileName}`
    );
    return this.#s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent
      })
    );
  }

  async getPublicUrl({ bucketName = "buchifin", fileName }) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName
    });

    return getSignedUrl(this.#s3Client, command, {
      expiresIn: 7 * 24 * 60 * 60
    });
  }
}

module.exports = { s3Service: new S3Service() };
