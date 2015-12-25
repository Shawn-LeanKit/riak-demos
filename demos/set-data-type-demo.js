"use strict";

var Promise = require( "bluebird" );
var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );
var _ = require( "lodash" );

var bucketType = "sets";
var bucket = "demo-set-data-type";
var key = "my_set";
var values = [ "foo","bar","baz" ];
var moarValues = [ "foo1","bar1","baz1" ];

var demo = Promise.coroutine( function*() {
	var client = yield getClient();
	var opts = {
		bucketType: bucketType,
		bucket: bucket,
		key: key
	};

	var storeOpts1 = _.clone( opts );
	var storeOpts2 = _.clone( opts );
	var removeOpts1 = _.clone( opts );
	var removeOpts2 = _.clone( opts );

	storeOpts1.additions = values;
	storeOpts2.additions = moarValues;

	yield* [ client.updateSetAsync( storeOpts1 ), client.updateSetAsync( storeOpts2 ) ];

	var setAfterAdditions = yield client.fetchSetAsync( opts );

	vorpal.log( "--------set contents after additions--------" );
	vorpal.log( setAfterAdditions );

	//removing items from sets requires the casual context of the object
	removeOpts1.removals = values;
	removeOpts1.context = setAfterAdditions.context;
	removeOpts2.removals = values;
	removeOpts2.context = setAfterAdditions.context;
	yield* [ client.updateSetAsync( removeOpts1 ), client.updateSetAsync( removeOpts2 ) ];

	var setAfterRemovals = yield client.fetchSetAsync( opts );

	vorpal.log( "--------set contents after removals--------" );
	vorpal.log( setAfterRemovals );

	yield client.deleteValueAsync( opts );
} );

var getSet = Promise.coroutine( function*() {
	var client = yield getClient();
	var opts = {
		bucketType: bucketType,
		bucket: bucket,
		key: key
	};

	return yield client.fetchSetAsync( opts );
} );

var addItemsToSet = Promise.coroutine( function*( opts ) {
	var opts = {
		bucketType: bucketType,
		bucket: bucket,
		key: key,
		additions: values
	};

	var client = yield getClient();
	var results = yield client.updateSetAsync( opts );

	return results;
} );

module.exports = {
	name: "set-data-type",
	description: "demos the set data type",
	start: demo
};
