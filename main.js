const process = require( "process" );
const path = require( "path" );
const ip = require( "ip" );
const http = require( "http" );
const WebSocket = require( "ws" );
//const RedisUtils = require( "redis-manager-utils" );
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
			EventEmitter.emit( "new_info" , message );
		}
	});
	redis_subscriber.redis.subscribe( "new_info" );
	module.exports.redis_manager = redis_manager;
	module.exports.redis_subscriber = redis_subscriber;

	// const python_script_subscriber = await PythonScriptSubscriber.init();
	// python_script_subscriber.redis.subscribe( "python-script-controller" );

	const express_app = require( "./express_app.js" );
	const server = http.createServer( express_app );
	const WebSocketManager = require( "./websocket_manager.js" );
	const websocket_server = new WebSocket.Server( { server } );
	server.listen( PORT , ()=> {
		console.log( "Sleep REDIS WebSocket Server Starting" );
		console.log( `\thttp://:localhost:${ PORT.toString() }` );
		console.log( `\thttp://:${ LOCAL_IP }:${ PORT.toString() }` );
	});
	websocket_server.on( "connection" ,  WebSocketManager.on_connection );

	// https://stackoverflow.com/a/38754039
	event_emitter.on( "websocket_broadcast" , ( info )=> {
		//console.log( info );
		//socket.send( JSON.stringify( { message: "new_info" , data: info } ) );
		websocket_server.clients.forEach( function each( client ) {
			client.send( info );
		});
	});

})();