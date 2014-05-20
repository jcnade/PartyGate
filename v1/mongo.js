/*

    API V1 - With MongoDB
*/


/* modules */
var  config = require('config')
    , log4js = require('log4js')
    , logger = log4js.getLogger()
    , mongo = require('mongodb');


/* Intro */
logger.info(" * Loading PartyGate API v1 ");


/***********************************************************************************
 *
 * Mongo Connection
 *
 ***********************************************************************************/

logger.info("Connecting with MongoDB", JSON.stringify(config.mongo));

var mongoServer = new mongo.Server( config.MONGO.host,
    config.MONGO.port, {
        auto_reconnect: config.MONGO.autoReconnect,
        w:config.MONGO.writeAcknowlegement,
        journal:config.MONGO.flushToJournalBeforeAcknowlegement,
        fsync:config.MONGO.flushToFileSystemBeforeAcknowlegement
    });

var mongoDb = new mongo.Db(config.MONGO.database, mongoServer, {
    safe: config.MONGO.safe
});

var mongoStatus = false;
var partyDB;

mongoDb.open(function (err, db) {
    if (err) {
        logger.error('Unable to use the "' + config.MONGO.database + '" database on MongoDB', err);
    } else {
        // yes, We got out database pointer
        partyDB = db;
        mongoStatus = true;
        logger.info("Connected with the MongoDB database '" + config.MONGO.database + "'");
    }
});



exports.info = function(req, res) {

    get_party_info(req.params.partyID,function(dataFromMongo){
        console.log(dataFromMongo[0])
        res.send(dataFromMongo[0]);
    });

}



exports.members = function(req, res) {

    console.log('members')

    get_party_members(req.params.partyID,function(dataFromMongo){

        console.log(dataFromMongo)
        res.send(dataFromMongo);
    });

}



function get_party_info(partyID,callback) {

    partyDB.collection('parties', function (err, col) {
        if (err) {

            // fail
            logger.error("Can't find the images collection", err);
            mongoStatus = false;
            res.header('Content-type', "application/json");
            res.header('Access-Control-Allow-Origin', '*');
            res.send([]);

        } else {

            // Yes
            col.find({_id: partyID }).toArray(function (err, docs) {
                if (err) {
                    logger.error("OUps ", err);
                    mongoStatus = false;
                    docs = [];
                }
                callback(docs);
            });
        }
    });
}



function get_party_members(partyID,callback) {

    console.log('get_party_members')

    partyDB.collection('registration', function (err, col) {
        if (err) {

            // fail
            logger.error("Can't find the images collection", err);
            mongoStatus = false;
            res.header('Content-type', "application/json");
            res.header('Access-Control-Allow-Origin', '*');
            res.send([]);

        } else {

            // Yes
            col.find( { } ).toArray(function (err, docs) {
                console.log(docs)
            //col.find({ 'partyTAG': partyID }).toArray(function (err, docs) {
                if (err) {
                    logger.error("OUps ", err);
                    mongoStatus = false;
                    docs = [];
                }
                callback(docs);
            });
        }
    });
}

















