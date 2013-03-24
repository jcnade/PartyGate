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
  res.send('Hello World');
});


//app.listen(5005);

http.createServer(app).listen(app.get('port'), function(){
  logger.info(" * Starting listening on port " + app.get('port'));
});


