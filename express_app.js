const express = require( "express" );
const basicAuth = require( "express-basic-auth" );
const fs = require( "fs" );
const path = require( "path" );
const bodyParser = require( "body-parser" );
const helmet = require( "helmet" );
// https://github.com/helmetjs/helmet/issues/57
//const cors = require( "cors" );
const PORT = require( "./main.js" ).port;
const Personal = require( "./main.js" ).personal;

let app = express();
app.use( basicAuth({
	users: Personal.websocket_server.http_auth.users ,
	challenge: true
}));
app.use( helmet() );
//app.use( express.static( path.join( __dirname , "client" ) ) );
app.use( express.static( Personal.websocket_server.ionic_build_static_path ) );
//app.use( cors( { origin: "http://localhost:" + PORT.toString() } ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );

//const HTMLPath = path.join( __dirname , "./client/views" , "index.html" );
const HTMLPath = path.join( Personal.websocket_server.ionic_build_static_path , "index.html" );
app.get( "/" , function( req , res ) {
	res.sendFile( HTMLPath );
});

module.exports = app;