const path = require( "path" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );
const RedisManager = require( "./main.js" ).redis_manager;
const RedisGetLRange = require( "./utils.js" ).redis_get_lrange;
const EventEmitter = require( "./main.js" ).event_emitter;
const sleep = require( "./utils.js" ).sleep;
const get_eastern_time_key_suffix = require( "./utils.js" ).get_eastern_time_key_suffix;
const pluralize = require( "./utils.js" ).get_eastern_time_key_suffix;

function ON_CONNECTION( socket , req ) {
	socket.on( "message" , async ( message )=> {
		try { message = JSON.parse( message ); }
		catch( e ) { console.log( e ); return; }
		console.log( message );
		if ( message.type === "ping" ) {
			console.log( "inside pong()" );
			socket.send( JSON.stringify( message: "pong" ) );
		}
		else if ( message.type === "redis_get_lrange" ) {
			return new Promise( async ( resolve , reject )=> {
				try {
					if ( !message.list_key ) { resolve(); return; }
					if ( !message.channel ) { resolve(); return; }
					const starting_position = message.starting_position || 0;
					const ending_position = message.ending_position || -1;
					const result = await RedisGetLRange( RedisManager , message.list_key , starting_position , ending_position );
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