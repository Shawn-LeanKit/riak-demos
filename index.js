var initDemos = require( "./demos/init.js" );

initDemos().then( ( vorpal )=> {
	vorpal.delimiter( "Enter a demo (type help to see a list):" ).show();
} )
.catch( err => {
	console.log( err.stack );
	process.exit( 1 );
} );
