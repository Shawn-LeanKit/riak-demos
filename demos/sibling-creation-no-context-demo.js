var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );
var Promise = require( "bluebird" );

var demo = Promise.coroutine( function*() {
	var bucket = "demo-sibling-creatin-no-context";
	var key = "foo";
	vorpal.log( "----------DEMO START----------" );

	var client = yield getClient();

	var bucketProps = {
		bucket: bucket,
		allowMult: true,
		lastWriteWins: false
	};

	var storeOpts = {
		bucket: bucket,
		key: key,
		value: "hi"
	};

	var result = yield client.storeBucketPropsAsync( bucketProps );

	vorpal.log( "making 2 writes to the same key with no casual context" );

	yield Promise.all( [ client.storeValueAsync( storeOpts ), client.storeValueAsync( storeOpts ) ] );

	var result = yield client.fetchValueAsync( {
		bucket: bucket,
		key: key
	} );

	vorpal.log( "Results..." );
	vorpal.log( `number of siblings: ${result.values.length}` );
	vorpal.log( result );

	yield client.deleteValueAsync( {
		bucket: bucket,
		key: key
	} );

	vorpal.log( "----------DEMO END----------" );
} );

module.exports = {
	name: "sibling-creation-no-context",
	description: "creating siblings due to making writes without setting a casual context",
	start: demo
};
