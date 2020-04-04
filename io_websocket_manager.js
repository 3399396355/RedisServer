const path = require( "path" );
const PersonalFilePath = path.join( process.env.HOME , ".config" , "personal" , "raspi_motion_alarm_rewrite.json" );
const Personal = require( PersonalFilePath );
const RedisManager = require( "./main.js" ).redis_manager;
const RedisGetLRange = require( "./utils.js" ).redis_get_lrange;
const EventEmitter = require( "./main.js" ).event_emitter;
const sleep = require( "./utils.js" ).sleep;
const get_eastern_time_key_suffix = require( "./utils.js" ).get_eastern_time_key_suffix;
const pluralize = require( "./utils.js" ).pluralize;

function ComputeResult( message ) {
	return new Promise( async ( resolve , reject ) => {
		try {
			console.log( "Computing Result for WebSocket Message ()=>" );
			console.log( message );
			try { message = JSON.parse( message ); }
			catch( e ) { console.log( e ); resolve( { error: e.stack } ); return; }
			if ( message.type === "ping" ) {
				resolve( { message: "pong" } );
				return;
			}
			else if ( message.type === "redis_get_lrange" ) {
				console.log( message );
				if ( !message.list_key ) { resolve( { error: "no list key sent" } ); return; }
				if ( !message.channel ) { resolve( { error: "no channel provided" } ); return; }
				const channel = message.channel;
				const info_message = "new_" + pluralize( channel );
				const starting_position = message.starting_position || 0;
				const ending_position = message.ending_position || -1;
				const redis_data = await RedisGetLRange( RedisManager , message.list_key , starting_position , ending_position );
				console.log( redis_data );
				resolve( { message: info_message , current_length: redis_data.current_length , data: redis_data.data } );
				return;
			}
			resolve( { error: "no message type sent" } );
			return;
		}
		catch( error ) { console.log( error ); resolve( { error: error.stack } ); return; }
	});
}

// https://stackoverflow.com/a/46878342
// function s4() {
//     return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
// }
// function GetUniqueID() {
//     return s4() + "-" + s4() + "-" + s4();
// }

function ON_CONNECTION( socket ) {
	// socket.id = GetUniqueID();
	socket.on( "event" , async ( data )=> {
		try {
			console.log( data );
			// if ( !message ) { socket.send( JSON.stringify( result ) ); return; }
			let result = await ComputeResult( data );
			// result.socket_id = socket.id;
			console.log( "Repyling With : " );
			console.log( result );
			result = JSON.stringify( result );

			//socket.send( result );
			//EventEmitter.emit( "websocket_broadcast" , socket.id , result );
			socket.emit( 'request' , result );
			EventEmitter.emit( "websocket_broadcast" , result );
			console.log( data );
		}
		catch( error ) {
			console.log( error );
			try {
				//socket.send( JSON.stringify( { error: error.stack } ) );
				socket.emit( 'request' , { error: error.stack } );
			}
			catch( error ) { console.log( "Something Wrong With WebSocket" ); }
		}
	});

}
module.exports.on_connection = ON_CONNECTION;