"use strict";

var Promise = require( "bluebird" );
var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );

var bucketType = "counters";
var bucket = "demo-counter-data-type";
var key = "my_counter";

var demo = Promise.coroutine( function*() {
	var client = yield getClient();
	yield Promise.all( getTasks() );

	var counter = yield client.fetchCounterAsync( {
		bucketType: bucketType,
		bucket: bucket,
		key: key
	} );

	vorpal.log( "--------final value of counter--------" );
	vorpal.log( counter );

	yield client.deleteValueAsync( {
		bucketType: bucketType,
		bucket: bucket,
		key: key
	} );
} );

var getTasks = Promise.coroutine( function*() {
	var tasks = [];

	for ( let i = 0; i < 10; i++ ) {
		tasks.push( Promise.coroutine( function*() {
			var client = yield getClient();
			var opts = {
				bucket: bucket,
				bucketType: bucketType,
				key: key
			};

			opts.increment = i % 2 === 0 ? 3 : -1;

			var result = yield client.updateCounterAsync( opts );
			vorpal.log( `--------iteration ${i}: incrementing counter by ${opts.increment}--------` );
			vorpal.log( result );
		} )() );
	}

	return tasks;
} );

module.exports = {
	name: "counter-data-type",
	description: "demos the counter data type",
	start: demo
};
