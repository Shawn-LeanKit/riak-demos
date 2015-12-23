var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );
var Promise = require( "bluebird" );

var demo = Promise.coroutine( function*() {
	var bucket = "demo-read-modify-write";
	var key = "user:123";
	vorpal.log( "----------DEMO START----------" );

	var client = yield getClient();

	var bucketProps = {
		bucket: bucket,
		allowMult: true,
		lastWriteWins: false
	};

	var result = yield client.storeBucketPropsAsync( bucketProps );

	var storeOpts = {
		bucket: bucket,
		key: key,
		value: {
			id: 123,
			firstName: "Jane",
			lastName: "Public"
		}
	};

	vorpal.log( `creating object '${key}'` );
	vorpal.log( storeOpts.value );
	yield client.storeValueAsync( storeOpts );

	vorpal.log( `Updating object '${key}'` );

	var result = yield client.fetchValueAsync( {
		bucket: bucket,
		key: key,
		convertToJs: true
	} );

	//fetch results are returned as riak objects which contain the value of the key
	//as well as its associated meta-data (vector clock, content-type,etc)
	//normally checks would be made to determine if sibling resolution needed to occur
	var riakObj = result.values[0];
	var user = riakObj.value;
	user.middleName = "Q";
	riakObj.setValue( user );

	//note that the entire riak object is written, which now includes the current casual context
	var result = yield client.storeValueAsync( {
		value: riakObj,
		returnBody: true, //tells the client to return data as part of the repsonse
		convertToJs: true //converts data to a JS object
	} );

	vorpal.log( "Results..." );
	vorpal.log( `number of siblings: ${result.values.length - 1}` );
	vorpal.log( `new value of '${key}' ` );
	vorpal.log( result.values[0].value );

	yield client.deleteValueAsync( {
		bucket: bucket,
		key: key
	} );

	vorpal.log( "----------DEMO END----------" );
} );

module.exports = {
	name: "read-modify-write",
	description: "shows how to update existing objects using the read-modify-write pattern",
	start: demo
};
