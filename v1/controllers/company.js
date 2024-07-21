const config = require("config");
const validations = require("../validations");
const USER_TYPES = config.get("USER_TYPES");
const universal = require("../../utils");
const MESSAGES = require("../../constants").Messages;
const CODES = require("../../constants").Codes;
const Models = require("../../models");
const ObjectId = require("mongoose").Types.ObjectId;
const path = require('path');
const _ = require('lodash');

const s3Upload = async (filePayload, req, documentType) => {
  let s3Response = await universal.uploadFileToS3(filePayload);
  let documentPayload = {
    etag: s3Response['ETag'],
    s3Key: s3Response['Key'],
    url: s3Response['Location'],
    extension: path.extname(filePayload.originalname),
    ...filePayload,
    documentType,
    uploadedBy: req.user._id,
    uploadedByType: req.userType
  };
  delete documentPayload.Buffer;
  return documentPayload;
}

module.exports = {
  updateById: async (req, res, next) => {
    try {
      const companyId = new ObjectId(req.body.id);
      let companyExists = await Models.Company.findOne({ _id: companyId, isDeleted: false }).lean();
      if (!companyExists) {
        return universal.response(res, CODES.BAD_REQUEST, MESSAGES.COMPANY_NOT_EXISTS, {}, req.lang);
      }

      const keys = [
        'gst[doc][front]', 'gst[doc][back]', 'registrationCertificate[doc][front]',
        'registrationCertificate[doc][back]', 'license[doc][front]', 'license[doc][back]',
        'aadhaar[doc][front]', 'aadhaar[doc][back]', 'pan[doc][front]', 'pan[doc][back]',
        'bankDetails[cancelCheque][front]', 'bankDetails[cancelCheque][back]'
      ];

      const promises = keys.map(async key => {
        if (req.files[key]) {
          const filePayload = req.files[key][0];
          const documentType = key.split('[')[0];
          const documentPayload = await s3Upload(filePayload, req, documentType);
          const path = key.replace(/\[(.*?)\]/g, '.$1');
          const existingDocId = _.get(companyExists, path);
          if (existingDocId) {
            documentPayload.parentDocumentId = existingDocId;
            await Models.Document.findOneAndUpdate({ _id: existingDocId }, {
              updateReason: `New Document uploaded By ${req.user.name} as type ${req.userType}`,
              updatedBy: req.user._id,
              updatedType: req.userType
            })
          }
          const doc = await new Models.Document(documentPayload).save();
          _.set(companyExists, path, doc._id);
        }
      });

      await Promise.all(promises);

      if (req.body.documents && Array.isArray(req.body.documents)) {
        req.body.documents = await Promise.all(req.body.documents.map(async (document, index) => {
          const frontKey = `documents[${index}][doc][front]`;
          const backKey = `documents[${index}][doc][back]`;

          let doc = {
            label: document.label,
            number: document.number,
            note: document.note,
            ...(document._id ? { _id: document._id } : {}),
            doc: {}
          };
          let documentExists = null;
          documentExists = await Models.Company.findOne(
            {
              _id: companyId,
              documents: { $elemMatch: { _id: new ObjectId(document._id) } }
            },
            { 'documents.$': 1 }
          );

          if (req.files[frontKey]) {
            const filePayload = req.files[frontKey][0];
            let documentPayload = await s3Upload(filePayload, req, 'docFront');
            if (documentExists && documentExists.documents && documentExists.documents[0] && documentExists.documents[0].doc && documentExists.documents[0].doc.front) {
              documentPayload.parentDocumentId = documentExists.documents[0].doc.front;
            }
            documentPayload = await new Models.Document(documentPayload).save();
            doc.doc.front = documentPayload._id;
          }

          if (req.files[backKey]) {
            const filePayload = req.files[backKey][0];
            let documentPayload = await s3Upload(filePayload, req, 'docBack');
            if (documentExists && documentExists.documents && documentExists.documents[0] && documentExists.documents[0].doc && documentExists.documents[0].doc.back) {
              documentPayload.parentDocumentId = documentExists.documents[0].doc.back;
            }
            documentPayload = await new Models.Document(documentPayload).save();
            doc.doc.back = documentPayload._id;
          }

          if (document._id) {
            await Models.Company.updateOne(
              { "_id": companyId, "documents._id": new ObjectId(document._id) },
              {
                $set: {
                  ...(doc.label ? { 'documents.$.label': doc.label } : { 'documents.$.label': documentExists.documents[0].label }),
                  ...(doc.number ? { 'documents.$.number': doc.number } : { 'documents.$.number': documentExists.documents[0].number }),
                  ...(doc.note ? { 'documents.$.note': doc.note } : { 'documents.$.note': documentExists.documents[0].note }),
                  ...(doc?.doc?.front ? { 'documents.$.doc.front': doc.doc.front } : { 'documents.$.doc.front': documentExists.documents[0].doc.front }),
                  ...(doc?.doc?.back ? { 'documents.$.doc.back': doc.doc.back } : { 'documents.$.doc.back': documentExists.documents[0].doc.back }),
                }
              }
            );
          }

          return doc;

        }));
        req.body.documents = req.body.documents.filter(obj => !obj._id);
        let previousDocuments = (await Models.Company.findOne({ _id: companyId, isDeleted: false }).lean()).documents;
        req.body.documents = [...req.body.documents, ...previousDocuments]
        delete companyExists.documents;
      }
      
      companyExists = _.merge({}, companyExists, req.body);
      await Models.Company.findOneAndUpdate({ _id: companyId, isDeleted: false }, companyExists);
      companyExists = await Models.Company.findOne({ _id: companyId, isDeleted: false }).lean();
      return await universal.response(res, CODES.OK, MESSAGES.DATA_FETCHED_SUCCESSFULLY, companyExists, req.lang);

    } catch (error) {
      console.log(error);
      next(error);
    }
  }
};
