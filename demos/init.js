var vorpal = require( "vorpal" )();
var Promise = require( "bluebird" );
var unglob = require( "unglob" );
var globAsync = Promise.promisify( require( "glob" ) );

var init = Promise.coroutine( function*() {
	var vorpal = require( "vorpal" )();
	var demoFiles = yield globAsync( "*-demo.js", { cwd: __dirname } );

	yield Promise.each( demoFiles, ( file ) => {
		var demo = require( `./${file}` );

		vorpal.command( demo.name, demo.description )
		.action( ( args,callback ) => {
			demo.start()
			.then( callback )
			.catch( err => {
				vorpal.log( `Error in demo!\n${err.stack}` );
				process.exit( 1 );
			} );
		} );
	} );

	return vorpal;
} );

module.exports = init;
