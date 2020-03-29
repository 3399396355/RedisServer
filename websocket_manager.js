const path = require( "path" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );
const RedisUtils = require( "redis-manager-utils" );
const EventEmitter = require( "./main.js" ).event_emitter;
const sleep = require( "./utils.js" ).sleep;
const get_eastern_time_key_suffix = require( "./utils.js" ).get_eastern_time_key_suffix;
const pluralize = require( "./utils.js" ).get_eastern_time_key_suffix;

let redis_manager;
let redis_subscriber;

( async ()=> {
	redis_manager = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
	await redis_manager.init();
	redis_subscriber = new RedisUtils( Personal.redis.database_number , Personal.redis.host , Personal.redis.port );
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
})();


function ON_CONNECTION( socket , req ) {
	EventEmitter.on( "new_info" , ( info )=> {
		console.log( info );
		socket.send( JSON.stringify( { message: "new_info" , data: info } ) );
	});
	socket.on( "message" , async ( message )=> {
		try { message = JSON.parse( message ); }
		catch( e ) { console.log( e ); return; }
		console.log( message );
		if ( message.type === "pong" ) {
			console.log( "inside pong()" );
		}
		else if ( message.type === "redis_get_lrange" ) {
			return new Promise( async ( resolve , reject )=> {
				try {
					if ( !message.list_key ) { resolve(); return; }
					if ( !message.channel ) { resolve(); return; }
					const starting_position = message.starting_position || 0;
					const ending_position = message.ending_position || -1;
					const result = await redis_get_lrange( message.list_key , starting_position , ending_position );
					//console.log( result );
					socket.send( JSON.stringify( { message: `new_${ pluralize( message.channel ) }` , current_length: result.current_length , data: result.data } ) );
					resolve( result );
					return;

				}
				catch( error ) { console.log( error ); resolve( error ); return; }
			});
		}

	});

}
module.exports.on_connection = ON_CONNECTION;