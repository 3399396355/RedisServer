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
const EventEmitter = require( "./main.js" ).event_emitter;
const RedisManager = require( "./main.js" ).redis_manager;
const RedisGetListRange = require( "./utils.js" ).redis_get_lrange;
const pluralize = require( "./utils.js" ).pluralize;

let app = express();
// app.use( basicAuth({
// 	users: Personal.websocket_server.http_auth.users ,
// 	challenge: true
// }));
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

app.get( "/ping" , function( req , res ) {
	res.send( "pong" );
});

// EventEmitter.emit( "websocket_broadcast" , JSON.stringify( data ) );
app.get( "/redis/get/:key" , ( req , res )=> {
	const key = req.params.key;
	const redis_data = "";
	res.send( JSON.stringify( redis_data ) );
});

// GET /shoes?order=desc&shoe[color]=blue&shoe[type]=converse
// app.get( "/redis/lrange" , ( req , res )=> {
// 	const key = req.query.key;
// 	const from = req.query.from;
// 	const to = req.query.to;
// 	const redis_data = {};
// 	if ( !message.list_key ) { resolve(); return; }
// 	if ( !message.channel ) { resolve(); return; }
// 	const starting_position = message.starting_position || 0;
// 	const ending_position = message.ending_position || -1;
// 	const result = await redis_get_lrange( message.list_key , starting_position , ending_position );
// 	//console.log( result );
// 	socket.send( JSON.stringify( { message: `new_${ pluralize( message.channel ) }` , current_length: result.current_length , data: result.data } ) );
// 	res.send( JSON.stringify( redis_data ) );

// });



// POST /redis/lrange
// {
// 	"key": key ,
// 	"starting_position": 0 ,
// 	"ending_position": count ,
// 	"channel": "log"
// }
app.post( "/redis/lrange" , async ( req , res )=> {
	try {
		const key = req.body.key;
		const starting_position = req.body.starting_position || 0;
		const ending_position = req.body.ending_position || -1;
		const channel = req.body.channel;
		if ( !key ) { res.send( false ); return; }
		if ( !channel ) { res.send( false ); return; }
		const result_data = await RedisGetListRange( RedisManager.redis , key , starting_position , ending_position );
		const return_message = {
			message: `new_${ pluralize( message.channel ) }` ,
			current_length: result_data.current_length ,
			data: result_data.data
		}
		res.send( JSON.stringify( return_message ) );
	}
	catch( error ) {
		res.send( JSON.stringify( { error: error } ) );
	}
});





module.exports = app;