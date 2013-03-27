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


/**********************************************************************************/

app.get('/', function(req, res){
  res.send('Party Gate Server v1');
});


app.get('/party/:partyTAG', function(req, res){
	// And print
	var partyData =  get_party_info(req.params.partyTAG);
	partyData['title'] = partyData['partyTitle'];

   res.render('party_public_page', partyData );
});


app.get('/party/registration/:partyTAG', function(req, res){
	// And print
	var partyData 			= get_party_info(req.params.partyTAG);
	partyData['title'] 		= partyData['partyTitle'];
	partyData['formSize']	= partyData.form.length;
	
   res.render('party_registration_page', partyData );
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


function get_party_info(partyID) {

	var decom =  [];

	decom['decom2013'] = {
			  _id : 'decom2013'
			, partyTitle : "Brussels Decompression 2013"
			, partyDescription : "Burners from Belgium are pleased to invite you to our first Brussels Burning Man Decompression®.The purpose of Decompression is to give Burning Man participants  the opportunity to re-capture the spirit of Burning Man by bringing them together with the art, music and exceptional people of the event. It is also an opportunity to introduce new people to burner culture."
			, backgroundUrl: 'http://X2.bp.blogspot.com/-gQdn8R_wjUA/TlcruoDwCCI/AAAAAAABDAY/9PxjGlyur2k/s1600/Burning+Man+2010-6806.jpg'
			, ticketLimit: 80
			, form: [
						{ 
							id: 'email',
							label: 'Email',
							type: 'text',
							size: '64',
							placeholder: 'your email adress',
						},
						{ 
							id: 'name',
							label: 'PlayaName',
							type: 'text',
							size: '64',
							placeholder: 'Playa Name / Nick Name',
						},
						{ 
							id: 'phone',
							label: 'Phone Number',
							type: 'text',
							size: '64',
							placeholder: 'Your Phone Number',
						},
						{ 
							id: 'burningman',
							label: 'Did you already participated to Burning Man festival ?',
							type: 'checkbox',
							size: '64',
							placeholder: 'Your Phone Number',
						},
						{ 
							id: 'burningman',
							label: 'Did you already participated to  urning Man regional event ?',
							type: 'checkbox',
							size: '64',
							placeholder: 'Your Phone Number',
						}
				]
	};

	decom['decom2013staff'] = {
			 _id : 'decom2013staff'
			, partyTitle : "Brussels Decompression 2013"
			, partyDescription : "Burners from Belgium are pleased to invite you to our first Brussels Burning Man Decompression®.The purpose of Decompression is to give Burning Man participants  the opportunity to re-capture the spirit of Burning Man by bringing them together with the art, music and exceptional people of the event. It is also an opportunity to introduce new people to burner culture."
			, backgroundUrl: 'http://www.zastavki.com/pictures/2560x1600/2009/3D-graphics_Gray_Texture_016438_.jpg'
			, ticketLimit: 20
			, form: [
						{ 
							id: 'email',
							label: 'Email',
							type: 'text',
							size: '64',
							placeholder: 'your email adress',
						},
						{ 
							id: 'name',
							label: 'PlayaName',
							type: 'text',
							size: '64',
							placeholder: 'Playa Name / Nick Name',
						},
						{ 
							id: 'phone',
							label: 'Phone Number',
							type: 'text',
							size: '64',
							placeholder: 'Your Phone Number',
						},
						{ 
							id: 'burningman',
							label: 'Did you already participated to Burning Man festival ?',
							type: 'checkbox',
							size: '64',
							placeholder: 'Your Phone Number',
						},
						{ 
							id: 'burningman',
							label: 'Did you already participated to  urning Man regional event ?',
							type: 'checkbox',
							size: '64',
							placeholder: 'Your Phone Number',
						}
					]
	};

	return decom[partyID];

}









