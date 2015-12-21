var vorpal = require( "vorpal" )();
var unglob = require( "unglob" );
var co = require( "co" );
var each = require( "co-each" );

var init = co.wrap( function*() {
	var vorpal = require( "vorpal" )();
	var demoFiles = yield* unglob.directory( [ "*-demo.js" ], __dirname );

	yield each( demoFiles, ( file ) => {
		var demo = require( `./${file}` );

		vorpal.command( demo.name, demo.description )
		.action( ( args,callback ) => {
			demo.start()
			.then( callback )
			.catch( err => {
				vorpal.log( `Error in demo!${err.stack}` );
				process.exit( 1 );
			} );
		} );
	} );
	return vorpal;
} );

module.exports = init;
