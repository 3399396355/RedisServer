const process = require( "process" );
const path = require( "path" );
const fs = require( "fs" );
const ip = require( "ip" );
const http = require( "http" );
//const https = require( "https" );
const WebSocket = require( "ws" );
const RedisUtils = require( "redis-manager-utils" );
const EventEmitter = require( "events" );

process.on( "unhandledRejection" , function( reason , p ) {
	console.error( reason, "Unhandled Rejection at Promise" , p );
	console.trace();
});
process.on( "uncaughtException" , function( err ) {
	console.error( err , "Uncaught Exception thrown" );
	console.trace();
});

( async ()=> {

	const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
	const Personal = require( PersonalFilePath );
	module.exports.personal = Personal;

	// https://stackoverflow.com/a/27940375
	const ServerCertificatePath = path.join( process.env.HOME , ".config" , "personal" , "RedisServer" ,  "cert.pem" );
	const ServerPrivateKeyPath = path.join( process.env.HOME , ".config" , "personal" , "RedisServer" ,  "key.pem" );
	const ServerCertificateFile = fs.readFileSync( ServerCertificatePath , "utf8" );
	const ServerPrivateKeyFile = fs.readFileSync( ServerPrivateKeyPath , "utf8" );
	const ServerCredentials = { key: ServerPrivateKeyFile , cert: ServerCertificateFile };

	//const PORT = Personal.websocket_server.port || 6262;
	const PORT = 6464;
	module.exports.port = PORT;
	const LOCAL_IP = ip.address();

	const event_emitter = new EventEmitter();
	module.exports.event_emitter = event_emitter;

	const redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
	await redis_manager.init();
	const redis_subscriber = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
	await redis_subscriber.init();
	redis_subscriber.redis.on( "message" , ( channel , message )=> {
		//console.log( "sub channel " + channel + ": " + message );
		console.log( "new message from: " + channel );
		console.log( message );
		if ( channel === "new_info" ) {
			message = { message: channel , data: message };
			event_emitter.emit( "websocket_broadcast" , "0" , JSON.stringify( message ) );
		}
	});
	redis_subscriber.redis.subscribe( "new_info" );
	module.exports.redis_manager = redis_manager;
	module.exports.redis_subscriber = redis_subscriber;

	// const python_script_subscriber = await PythonScriptSubscriber.init();
	// python_script_subscriber.redis.subscribe( "python-script-controller" );

	const express_app = require( "./express_app.js" );
	const server = http.createServer( express_app );
	//const server = https.createServer( ServerCredentials , express_app );
	const WebSocketManager = require( "./websocket_manager.js" );
	const websocket_server = new WebSocket.Server( { server } );
	server.listen( PORT , ()=> {
		console.log( "Sleep REDIS WebSocket Server Starting" );
		console.log( `\thttp://:localhost:${ PORT.toString() }` );
		console.log( `\thttp://:${ LOCAL_IP }:${ PORT.toString() }` );
	});
	websocket_server.on( "connection" ,  WebSocketManager.on_connection );

	// https://stackoverflow.com/a/38754039
	// https://stackoverflow.com/a/46878342
	event_emitter.on( "websocket_broadcast" , ( id , info )=> {
		//console.log( info );
		//socket.send( JSON.stringify( { message: "new_info" , data: info } ) );
		websocket_server.clients.forEach( function each( client ) {
			if ( client.id !== id ) {
				client.send( info );
			}
		});
	});

})();