/*

 ______              __              _______         __         
|   __ \.---.-.----.|  |_.--.--.    |     __|.---.-.|  |_.-----.
|    __/|  _  |   _||   _|  |  |    |    |  ||  _  ||   _|  -__|
|___|   |___._|__|  |____|___  |    |_______||___._||____|_____|
                         |_____|
                                
 by Jean-Charles Nadé - 2013                                                             
 
*/

/* modules */
var   express = require('express')
    , config = require('config')
    , mc = require('mc')
    , log4js = require('log4js')
    , logger = log4js.getLogger()
	, http = require('http')
    , path = require('path')
    , mongo = require('mongodb');


/* Intro */
logger.info("PartyGate Server");



// API Routes
var  v1 = require('./v1/mongo.js');



/* Memcached connection */
var memcached = new mc.Client('127.0.0.1:11211');
memcached.connect(function() {
    logger.info("memcached: Connected to the localhost on port 11211");
});

/* session with memcached */
var memStore = new express.session.MemoryStore;

/* Express web server configuration */
var app = express();
app.configure(function () {
    app.set('port', config.SERVER.port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('partygate9876543210'));
    app.use(express.session({secret: 'seagulldev9873210', store: memStore}));
    app.use(app.router);
    app.use(express.compress()); // compression
    //app.use(express.staticCache()); //TODO connect.staticCache() is deprecated and will be removed in 3.0: use varnish or similar reverse proxy caches
    app.use(express.static(path.join(__dirname, 'public')));
});




/***********************************************************************************
 *
 * Mongo Connection
 *
 ***********************************************************************************/


/**********************************************************************************************************************
 * MongoDB connection
 **********************************************************************************************************************/

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
    
    	// Negatif, no mongo to use over there
        logger.error('Unable to use the "' + config.MONGO.database + '" database on MongoDB', err);
    } else {
    
    	// yes, We got out database pointer
        partyDB = db;
        mongoStatus = true;
        logger.info("Connected with the MongoDB database '" + config.MONGO.database + "'");
    }
});



/**********************************************************************************/

app.get('/', function(req, res){
  res.send('Party Gate Server v1');
});



/* show a party page with a registration button */
app.get('/party/:partyTAG', function(req, res){

	// get party Date in mongo
	get_party_info(req.params.partyTAG,function(partyData){

		// and print
		partyData[0]['title'] = partyData[0]['partyTitle'];
		res.render('party_public_page', partyData[0] );

	});
});




app.get('/make', function(req, res){
	res.render('party_make_one', {} );
});



/* Save a new party */
app.post('/make', function(req, res){


	var partyTAG = req.body.partyTAG;

	req.body.ticketLimit = parseInt(req.body.ticketLimit);
	//var req.body.ticketLimit = 541;
	
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
        	col.update( { _id: partyTAG }, { $set: req.body }, {upsert:true}, function (err, docs) {
                if (err) {
                    logger.error("OUps ", err);
                    mongoStatus = false;
                    docs = [];
                }

                //
                res.redirect('/info/'+partyTAG);
                res.end();

            });
        }
    });
});

/* show a registration paqe for a selected party */
app.get('/info/:partyID', function(req, res){
    console.log(  req.params );
    req.config = config;
    res.render('party_info', req );
});


/* show a registration paqe for a selected party */
app.get('/api/party/:partyID', v1.info );



/* show a registration paqe for a selected party */
app.get('/party/registration/:partyTAG', function(req, res){

	//
	// 1) get party Date in mongo
	//
	get_party_info(req.params.partyTAG, function(partyData){

	if (partyData[0]){

		//
		// 2) check if its soldout
		//
		if ( partyData[0]['ticketLimit'] > 0) {
		
			//
			// 3) Its ok
			//
			res.render('party_registration_page', partyData[0] );

		}
		else {
		
			//
			// 3) Its sold out
			//
			res.render('party_soldout', {} );

		}


	} else {res.send('nope');}});

});


function page_billing(req,res){

    //console.log(req);
    res.render('party_thanks', req );
    //res.send('okkk');


}


app.post('/party/registration/:partyTAG', function(req, res){

    console.log('-------------------');
    console.log(req.body);
    console.log('-------------------');

	//
	// 1) get party data from mongo
	//
	get_party_info(req.params.partyTAG,function(partyData){


		//
		// 2) Check if this user get allready a ticker
		//
		checkifheUserGotAllreadyATicket(req.body.email, req.params.partyTAG,  function(data) {

			if (data[0]) {

                console.log('already a ticket')
                req.partyInfo   = partyData[0];
                req.userBillingInfo = data[0];
                page_billing(req,res);
				
			}
			else
			{

				//
				// 3) Checking how many ticket left 
				//
				if ( partyData[0]['ticketLimit'] > 0) {

					//
					// Make a new ticket
					//
                    console.log('NEW ticket')
					console.log(partyData[0]);

					reduceOneTicket( req.params.partyTAG ,function(data){

						//
						// And print The Password page
						//
						partyData[0]['title'] 		= partyData[0]['partyTitle'];
						// Building a password
						var field1 = [ 'burning','hot','happy','dusty','red','blue','pinky','faster'];
						var field2 = [ 'temple','camp','fire','water','bacon','playa','camp','hippie','ravers','rainbow'];
						var randomWord1 = field1[Math.floor(Math.random()* field1.length )];
						var randomWord2 = field2[Math.floor(Math.random()* field2.length )];
						var partyCode = partyData[0]['ticketLimit']+'-'+randomWord1+'-'+randomWord2;
						// data to save
						req.body['partyCode']	= partyCode;
						// data to print
						partyData[0]['partyCode']	= partyCode;
						partyData[0]['partyTAG']	= req.params.partyTAG;
						partyData[0]['email']	    = req.body['email'];
						// save info
						partyDB.collection('registration', function (err, col) {
							if (err) {
				
								// fail
								logger.error("Can't find the images collection", err);
								mongoStatus = false;
								res.header('Content-type', "application/json");
								res.header('Access-Control-Allow-Origin', '*');
								res.send([]);

							} else {

								// add the user onthe registratuib table
								req.body.partyTAG = req.params.partyTAG;

								col.update( { email: req.body.email }, { $set: req.body }, {upsert:true}, function (err, docs) {
									if (err) {
										logger.error("OUps ", err);
										mongoStatus = false;
										docs = [];
                                        res.send('we got some error. please try later');

									} else {
                                        req.partyInfo   = partyData[0];
                                        req.userBillingInfo = data[0];
                                        page_billing(req,res);
                                    }


								});
							}
						});

					});
	
				}
				else {
	
					//
					// Sorry we are soldout
					//
					console.log('soldout');
					 res.render('party_soldout', {} );
				}


			}

		});




	}); // end party data




});







//app.listen(5005);

http.createServer(app).listen(app.get('port'), function(){
  logger.info(" * Starting listening on port " + app.get('port'));
});











/**********************************************************************************/

function partyData2htmlform(partyData) {

	var form = 'form'+ String.fromCharCode(13);

	for (var i in partyData) {
		console.log(i);
		
		if (partyData[i].type == 'text') {
			form += "\n\t"+"input(type=text)"+ String.fromCharCode(13);
		}

	}
	return form;
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
        	col.find({ _id: partyID }).toArray(function (err, docs) {
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



function soHowManyRegistrationWeGotForThatParty(partyTAG,callback) {

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
        	col.count( { partyTAG: partyTAG }, function (err, docs) {
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



function reduceOneTicket(partyTAG,callback) {

    partyDB.collection('parties', function (err, col) {
        if (err) {
        	// fail

        } else {

        	// Yes
		    	// Yes
		    	col.update( { _id : partyTAG }, 
		    				{ $inc: { ticketLimit: -1} }
		    				
		    				, {upsert:true}, function (err, docs) {
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





function checkifheUserGotAllreadyATicket(email, partyTAG, callback) {

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
        	col.find({  email: email, partyTAG:partyTAG }).toArray(function (err, docs) {
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




