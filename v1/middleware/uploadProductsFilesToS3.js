const { s3Service } = require("../services/s3/s3.service");

const uploadProductsFilesToS3 = async (req, res, next) => {
  const filesToUpload = [];
  if (req.files["pdf"]) {
    req.files["pdf"].forEach((file) => {
      req.body.pamplet = file.originalname;
      filesToUpload.push({
        type: "pdf",
        bucketName: "buchifin",
        fileName: file.originalname,
        fileContent: file.buffer
      });
    });
  }

  if (req.files["images"]) {
    req.files["images"].forEach((file) => {
      filesToUpload.push({
        type: "image",
        bucketName: "buchifin",
        fileName: file.originalname,
        fileContent: file.buffer
      });
    });
  }

  await Promise.all(filesToUpload.map(s3Service.uploadFile.bind(s3Service)));
  req.body.photos = filesToUpload
    .filter((file) => file.type === "image")
    .map((file) => ({ url: file.fileName }));
  req.body.photos.forEach((photo) => {
    photo.signedUrl = s3Service.getPublicUrl({ fileName: photo.url });
  });
  const photosSignedUrls = await Promise.all(
    req.body.photos.map((photo) => photo.signedUrl)
  );
  req.body.photos.forEach((photo, index) => {
    photo.signedUrl = photosSignedUrls[index];
  });
  req.body.pamphlet = {
    url: req.files["pdf"] ? req.files["pdf"][0].originalname : null
  };
  req.body.pamphlet.signedUrl = req.files["pdf"]
    ? await s3Service.getPublicUrl({ fileName: req.files["pdf"][0].originalname })
    : null;

  next();
};

module.exports = { uploadProductsFilesToS3 };
