const path = require( "path" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );
const RedisManager = require( "./main.js" ).redis_manager;
const RedisGetLRange = require( "./utils.js" ).redis_get_lrange;
const EventEmitter = require( "./main.js" ).event_emitter;
const sleep = require( "./utils.js" ).sleep;
const get_eastern_time_key_suffix = require( "./utils.js" ).get_eastern_time_key_suffix;
const pluralize = require( "./utils.js" ).get_eastern_time_key_suffix;

function ComputeResult( message ) {
	return new Promise( async ( resolve , reject ) => {
		try {
			console.log( "Computing Result for WebSocket Message ()=>" );
			console.log( message );
			try { message = JSON.parse( message ); }
			catch( e ) { console.log( e ); resolve( { message: e } ); return; }
			if ( message.type === "ping" ) {
				console.log( "inside pong()" );
				resolve( { message: "pong" } );
				return;
			}
			else if ( message.type === "redis_get_lrange" ) {
				if ( !message.list_key ) { resolve( { message: "no list key sent" } ); return; }
				if ( !message.channel ) {  resolve( { message: "no channel provided" } ); return; }
				const message = "new_" + pluralize( message.channel );
				console.log( message );
				const starting_position = message.starting_position || 0;
				const ending_position = message.ending_position || -1;
				const redis_data = await RedisGetLRange( RedisManager , message.list_key , starting_position , ending_position );
				console.log( redis_data );
				resolve( { message: message , current_length: redis_data.current_length , data: redis_data.data } );
				return;

			}
			resolve( { message: "no message type sent" } );
			return;
		}
		catch( error ) { console.log( error ); resolve( { message: error } ); return; }
	});
}

function ON_CONNECTION( socket , req ) {
	socket.on( "message" , async ( message )=> {
		if ( !message ) { socket.send( JSON.stringify( result ) ); return; }
		let result = await ComputeResult( message );
		socket.send( JSON.stringify( result ) );
	});

}
module.exports.on_connection = ON_CONNECTION;