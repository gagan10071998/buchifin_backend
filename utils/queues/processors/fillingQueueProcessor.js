// const fs = require('fs');
// const XlsxStreamReader = require("xlsx-stream-reader");
// const { fillingQueue, processFillingQueue } = require('../index');
// const Models = require('../../../models');

// fillingQueue.process(10, async (job) => {
//     let singleRowPercentage = 400 / job.data.totalRecords;
//     job.data.columnNames.unshift("null")
//     let fileDetails = JSON.parse(job.data.fileDetails);
//     let mapping = await Models.FileMapping.findOne({ _id: job.data.mapping }).lean();
//     let mappingKeys = []
//     let mappings = {};
//     await mapping.mapping.forEach(element => {
//         mappings[element.column] = element.mappedColumn;
//         mappingKeys.push(element.column);
//     });

//     if (job.data.extension === '.xlsx' || job.data.extension === '.xls') {
//         return new Promise((resolve, reject) => {
//             let workBookReader = new XlsxStreamReader();

//             workBookReader.on('worksheet', function (workSheetReader) {
//                 if (workSheetReader.id > 1) {
//                     workSheetReader.skip();
//                     return;
//                 }

//                 workSheetReader.on('row', async function (row) {
//                     if (row.attributes.r != 1) {
//                         let rowMapping = {
//                             meta:{}
//                         };
//                         await job.data.columnNames.forEach((ele, index) => {
//                             if(index){
//                                 if (mappingKeys.includes(ele)) {
//                                     rowMapping[mappings[ele]] = row.values[index];
//                                 }
//                                 else{
//                                     rowMapping['meta'][ele] = row.values[index];
//                                 }
//                             }
//                         })
//                         rowMapping.meta = JSON.stringify(rowMapping.meta);
//                         rowMapping.filling = job.data._id;
//                         rowMapping.createdBy = job.data.createdBy;
//                         rowMapping.singleRowPercentage = singleRowPercentage;
//                         rowMapping.mappingKeys = mappingKeys;
//                         rowMapping.mappings = mappings;
//                         if(parseInt(row.attributes.r) === job.data.totalRecords+1){
//                             rowMapping.lastRecord = true;
//                         }
//                         await processFillingQueue.add(rowMapping);
//                     }

//                 });

//                 workSheetReader.on('end', function () {
//                     resolve();
//                 });

//                 workSheetReader.on('error', function (error) {
//                     reject(error);
//                 });

//                 workSheetReader.process();
//             });

//             fs.createReadStream(fileDetails.path).pipe(workBookReader);
//         });
//     }
// });
