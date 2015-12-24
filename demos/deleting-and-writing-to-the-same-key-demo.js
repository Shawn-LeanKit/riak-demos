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
			lastName: "Doe",
			age: "20"
		},
		returnBody: true
	};

	yield client.storeValueAsync( storeOpts );

	vorpal.log( "--------object delete followed by another write--------" );

	//sometimes you need to delete and re-write to the same key. This example, simulates
	//such a scenario which is that we need to change the data type of the 'age' property
	yield client.deleteValueAsync( { bucket: bucket, key: key } );
	var result = client.storeValueAsync( {
		bucket: bucket,
		key: key,
		value: {
			id: 123,
			firstName: "Jane",
			lastName: "Doe",
			age: 20
		}
	} );

	vorpal.log( `--------value of ${key} after writing the new value--------` );
	//the key now has siblings, b/c while the original object was marked with a tombstone,
	//it had not been physically removed from the nodes before the subsequent write.
	//the second write does not have a casual context, so riak will automatically create a sibling
	var newResult = yield client.fetchValueAsync( {
		bucket: bucket,
		key: key,
		convertToJs: true
	} );
	vorpal.log( "--------sibling 1--------" );
	vorpal.log( newResult.values[0] );
	vorpal.log( "--------sibling 2--------" );
	vorpal.log( newResult.values[1] );

	/*
	  to properly do this operation, the read-modify-write pattern should be applied
	  however, speical flags need to be passed to the fetch operation to tell Riak
	  that you want it to return an object that has been tombstoned. Additionally, the
      subsequent write must provide the tombstoned vector clock.

	  ***Note: Alternatively, the delete operation could have a w value equal to the number
	  	       of nodes in the cluster. However, this trade-offs availability, and does not handle
			   edge-case scenarios where a delete operation occurs when the cluster is experiencing a partition
	*/
	vorpal.log( "--------attempting the same operation with the read-modify-write pattern--------" );
	yield client.deleteValueAsync( {
		bucket: bucket,
		key: key
	} );

	var deletedResult = yield client.fetchValueAsync( {
		bucket: bucket,
		key: key,
		returnDeletedVClock: true
	} );

	vorpal.log( "--------deleted riak object--------" );
	vorpal.log( deletedResult );
	var finalResult = yield client.storeValueAsync( {
		bucket: bucket,
		key: key,
		vclock: deletedResult.vclock,
		returnBody: true,
		convertToJs: true,
		value: {
				id: 123,
				firstName: "Jane",
				lastName: "Doe",
				age: 20
			}
	} );

	vorpal.log( "--------result of writing to the same key using the tombstone vclock--------" );
	vorpal.log( `number of siblings: ${finalResult.values.length - 1}` );
	vorpal.log( finalResult.values[0] );

	yield client.deleteValueAsync( {
		bucket: bucket,
		key: key
	} );

	vorpal.log( "--------DEMO END--------" );
} );

module.exports = {
	name: "delete-and-write-to-the-same-key",
	description: "shows how to delete and write to the same key",
	start: demo
};
