//#!/bin/env node
 //  OpenShift sample Node application
var express = require('express');
var fs = require('fs');
//load the Client interface
var MongoClient = require('mongodb').MongoClient;
var cors = require('cors');

/**
 *  Define the sample application.
 */
var SampleApp = function () {
    'use strict';
    
    //  Scope.
    var self = this,
        connection_string = '127.0.0.1:27017/nodejs';


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function () {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function () {
        if (typeof self.zcache === "undefined") {
            self.zcache = {
                'index.html': ''
            };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function (key) {
        return self.zcache[key];
    };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
            ].forEach(function (element, index, array) {
            process.on(element, function () {
                self.terminator(element);
            });
        });
    };



    // Connect to the db
    if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
        connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
            process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
            process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
            process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
            process.env.OPENSHIFT_APP_NAME;
    }

    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function () {
        self.routes = {};

        self.routes['/asciimo'] = function (req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/getFavourite'] = function (req, res) {
            var favourite = {
                lat: 12.1212,
                lng: 23.2323
            };
            res.send(favourite);
        };

        self.routes['/getLocations'] = function (req, res) {
            // the client db connection scope is wrapped in a callback:
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                if (err) { throw err; }
                var collection = db.collection('locations').find().limit(100).toArray(function (err, docs) {
                    console.dir(docs);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.send(docs);
                    db.close();
                });
            });
        };

        self.routes['/getUserLocation'] = function (req, res) {
            // the client db connection scope is wrapped in a callback:
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                if (err) { throw err; }
                var collection = db.collection('locations').find({
                    user: 'kayttaja'
                }).limit(10).toArray(function (err, docs) {
                    console.dir(docs);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.send(docs);
                    db.close();
                });
            });
        };

        self.routes['/getCalibrationLocation'] = function (req, res) {
            // the client db connection scope is wrapped in a callback:
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                if (err) { throw err; }
                var collection = db.collection('locations').find({
                    user: 'kayttaja1'
                }).limit(10).toArray(function (err, docs) {
                    console.dir(docs);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.send(docs);
                    db.close();
                });
            });
        };

        self.routes['/getEndLocation'] = function (req, res) {
            // the client db connection scope is wrapped in a callback:
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                if (err) { throw err; }
                var collection = db.collection('locations').find({
                    user: 'end'
                }).limit(10).toArray(function (err, docs) {
                    console.dir(docs);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.send(docs);
                    db.close();
                });
            });
        };

        self.routes['/setEndLocation'] = function (req, res) {
            // insert a book record into a collection of "books"
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                db.collection('locations').update({
                    user: 'end'
                }, {
                    user: 'end',
                    lat: req.query.lat,
                    lng: req.query.lng
                }, {
                    upsert: true
                });
                db.close();
            });
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.send();

        };

        self.routes['/updateLocation'] = function (req, res) {
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                db.collection('locations').update({
                    user: req.query.name
                }, {
                    user: req.query.name,
                    lat: req.query.lat,
                    lng: req.query.lng
                }, {
                    upsert: true
                });
                db.close();
            });
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.send();
        };

        self.routes['/calibrateLocation'] = function (req, res) {
            MongoClient.connect('mongodb://' + connection_string, function (err, db) {
                db.collection('locations').update({
                    user: req.query.name + '1'
                }, {
                    user: req.query.name + '1',
                    lat: req.query.lat,
                    lng: req.query.lng
                }, {
                    upsert: true
                });
                db.close();
            });
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.send();
        };

        self.routes['/'] = function (req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html'));
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function () {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        var r;
        for (r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function () {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function () {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function () {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now()), self.ipaddress, self.port);
        });
    };

}; /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();