// const { processFillingQueue } = require('../index');
// const Models = require('../../../models');

// processFillingQueue.process(10, async (job, done) => {
//     let filling = await Models.Filling.findOne({ _id: job.data.filling }).lean();
//     let caseUpload = {
//         haveError: false,
//         errorColumns: [],
//         ...job.data
//     };


//     try {
//         await Object.values(job.data.mappings).forEach(ele=>{
//             if(['',null,undefined,'N/A', 'null', 'n/a'].includes(caseUpload[ele] ? (caseUpload[ele].trim()).toLowerCase() : caseUpload[ele])){
//                 caseUpload.errorColumns.push({
//                     column: ele,
//                     value: caseUpload[ele]
//                 })
//                 caseUpload.haveError = true;
//             }
//         })
//         await new Models.Case(caseUpload).save();
//         if (job.data.lastRecord) {
//             let errorRecords = await Models.Case.find({haveError: true, filling: job.data.filling, isDeleted: false }).lean();
//             errorRecords = errorRecords.length;
//             await Models.Filling.findOneAndUpdate({ _id: job.data.filling }, {
//                 loadPercentage: 100,
//                 errorRecords,
//                 completedTime: new Date()
//             });
//         }
//         else {
//             if (Math.floor(filling.loadPercentage) !== 100) {
//                 await Models.Filling.findOneAndUpdate({ _id: job.data.filling }, {
//                     loadPercentage: filling.loadPercentage + job.data.singleRowPercentage
//                 });
//             }
//         }
//         done(null);
//         await job.remove();
//     } catch (error) {
//         done(error);
//     }
// });
