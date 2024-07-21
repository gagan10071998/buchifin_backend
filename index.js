/* 
Import Required Modules
*/
require('dotenv').config()
const config = require('config');
const express = require("express");
const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const seed = require('./seed');
const cors = require("cors");
const universal = require('./utils');
app.use(cors());

/*
Initialize Server
*/
let server = require("http").createServer(app);

/* 
Socket Initialization
*/
// const { io } = require("./utils/Sockets");
// io.attach(server);

/*
Database Connection
*/
mongoose.connect(config.get('DB_URL'), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async (db) => {
        console.log(`****************************************** MONGODB CONNECTED ***********************************************`);
        try {
            await seed.createSuperAdmin();
            await seed.createPermissions();
        } catch (seedError) {
            console.error("Error while seeding data:", seedError);
            process.exit(1); // Exit the process with an error code
        }

        // Start the server after the database connection and seed data population
        server.listen(config.get('PORT'), () => {
            console.log(`****************************************** ${'ENVIRONMENT:::' + process.env.NODE_ENV} *******************************************************`);
            console.log(`****************************************** ${'PORT:::' + config.get('PORT')} *******************************************************`);
        });

    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1); // Exit the process with an error code
    });

/* 
View Engine Setup
*/
app.set("view engine", "ejs");

/*
Middelwares
*/
app.use(morgan("dev"));
app.use(express.json({ limit: '900mb' }));
app.use(express.urlencoded({ extended: false }));

/*
Serving Static Files
*/
app.use(config.get('PATHS').IMAGE.STATIC, express.static(__dirname + config.get('PATHS').IMAGE.ACTUAL));
app.use(config.get('PATHS').FILE.STATIC, express.static(__dirname + config.get('PATHS').FILE.ACTUAL));

/*
API Hits
*/
app.use(async (req, res, next) => {
    console.log("API HIT -----------------> ", req.method, res.statusCode, req.originalUrl || req.url, "\n|\nv\n|\nv\n");
    if (!req.header('lang') || req.header('lang') == '') { req.lang = 'en' }
    else { req.lang = req.header('lang') }
    next();
});

/* Authorization Middleware */
app.use(universal.Authorization);

/*
Test API
*/
app.use('/test', async (req, res, next) => {
    res.status(200).send({ status: 200, message: "TEST API" });
});

/*
API Routes
*/
const route = require('./route');
app.use('/api', route);

/*
Catch 404 Error
*/
app.use((req, res, next) => {
    const err = new Error("Invalid Route");
    res.status(404).send({ status: 404, message: err.message });
});

/*
Error Handler
*/
app.use(universal.errHandler);
