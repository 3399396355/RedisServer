function sleep( ms ) { return new Promise( resolve => setTimeout( resolve , ms ) ); }
module.exports.sleep = sleep;

function get_eastern_time_key_suffix() {
	const now = new Date( new Date().toLocaleString( "en-US" , { timeZone: "America/New_York" } ) );
	const now_hours = now.getHours();
	const now_minutes = now.getMinutes();
	const dd = String( now.getDate() ).padStart( 2 , '0' );
	const mm = String( now.getMonth() + 1 ).padStart( 2 , '0' );
	const yyyy = now.getFullYear();
	const hours = String( now.getHours() ).padStart( 2 , '0' );
	const minutes = String( now.getMinutes() ).padStart( 2 , '0' );
	const seconds = String( now.getSeconds() ).padStart( 2 , '0' );
	const key_suffix = `${ yyyy }.${ mm }.${ dd }`;
	return key_suffix;
}
module.exports.get_eastern_time_key_suffix = get_eastern_time_key_suffix;

function pluralize( noun , suffix = "s" ) {
	if ( !noun ) { return; }
	if ( noun.length < 2 ) { return noun; }
	if ( noun.charAt( noun.length - 1 ) === "s" ) { return noun; }
	return noun + "s";
}
module.exports.pluralize = pluralize;

function redis_get_lrange( redis , key , start , end ) {
	return new Promise( async ( resolve , reject )=> {
		try {
			const current_length = await redis_manager.listGetLength( key );
			redis.lrange( key , start , end , ( error , results )=> {
				resolve( { current_length: current_length , data: results } );
				return;
			});
		}
		catch( error ) { console.log( error ); resolve( error ); return; }
	});
}
module.exports.redis_get_lrange = redis_get_lrange;