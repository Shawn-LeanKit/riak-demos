var Promise = require( "bluebird" );
var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );

var demo = Promise.coroutine( function*() {
	var bucket = "demo-deleting-objects";
	var key = "user:123";
	vorpal.log( "----------DEMO START----------" );

	var client = yield getClient();

	var bucketProps = {
		bucket: bucket,
		allowMult: true,
		lastWriteWins: false
	};

	yield client.storeBucketPropsAsync( bucketProps );

	var storeOpts = {
		bucket: bucket,
		key: key,
		value: {
			id: 123,
			firstName: "Jane",
			lastName: "Doe"
		},
		returnBody: true
	};

	var result = yield client.storeValueAsync( storeOpts );
	var riakObj = result.values[0];
	riakObj.setValue( { firstName: "Jane",lastName: "Public" } );

	vorpal.log( "--------preforming an update and delete operation concurrently--------" );

	yield* [
		client.deleteValueAsync( { bucket: bucket, key: key } ),
		client.storeValueAsync( { value: riakObj } )
	];

	vorpal.log( "--------value of key after concurrent operations--------" );
	vorpal.log( yield client.fetchValueAsync( {
		bucket: bucket,
		key: key
	} ) );

	vorpal.log( "--------DEMO END--------" );
} );

module.exports = {
	name: "concurrent-write-with-delete",
	description: "shows how riak handles concurrent write operation where one is a delete",
	start: demo
};
