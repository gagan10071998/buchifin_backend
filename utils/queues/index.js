// // queues.js

// const Queue = require('bull');
// const redis = require('redis');

// // Create a Redis client
// const redisClient = redis.createClient();

// // Create the Bull queue with Redis connection
// const fillingQueue = new Queue('fillingQueue', { redis: redisClient });
// const processFillingQueue = new Queue('processFillingQueue', { redis: redisClient });
// module.exports = {
//   fillingQueue,
//   processFillingQueue
// };
