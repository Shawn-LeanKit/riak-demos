"use strict";
var Promise = require( "bluebird" );
var getClient = require( "../riak/promisified-client" );
var RiakObject = require( "basho-riak-client" ).Commands.KV.RiakObject;
var vorpal = require( "vorpal" )();
var _ = require( "lodash" );
var bucket = "secondary-index-demo";
var keyBase = "key";
var indexName = "foo_int";
var objectsToCreate = 10;

var demo = Promise.coroutine( function*() {
	var createdObjKeys = yield writeObjects();
	vorpal.log( `${createdObjKeys.length} objects created` );

	var results = yield getKeysByIndex( {
		bucket: bucket,
		indexName: indexName,
		indexKey: 5
	} );

	vorpal.log( "-------results of direct index query--------" );
	vorpal.log( results );

	var pagedQueryOpts = {
		bucket: bucket,
		indexName: indexName,
		rangeStart: 0,
		rangeEnd: objectsToCreate,
		maxResults: objectsToCreate
	};

	var pagedResults = yield getKeysByIndex( pagedQueryOpts );

	/*
		secondary indexes use an r value of 1, so the results may not
		always bring back the expected number of keys.
	*/
	vorpal.log( "-------results of paged range query--------" );
	vorpal.log( pagedResults );

	yield deleteObjects( createdObjKeys );
} );

var writeObjects = Promise.coroutine( function*() {
	var client = yield getClient();
	var tasks = [];

	for ( let i = 0; i < objectsToCreate; i++ ) {
		tasks.push( Promise.coroutine( function*() {
			var riakObj = new RiakObject();
			riakObj.setBucket( bucket );
			//a good reason to use secondary indexes is when the object is not
			//structured in a way that can be indexed by Riak search (i.e. Solr)
			riakObj.setValue( new Buffer( "pretend this is a blob" ), "utf8" );
			//secondary indexes can either be ints or strings (binary)
			//names of indexes should be of the form <name>_(int|bin)
			riakObj.addToIndex( indexName, i );

			return client.storeValueAsync( {
					value: riakObj
				} );
		} )() );
	}

	var results = yield Promise.all( tasks );
	return _.pluck( results, "generatedKey" );
} );

var getKeysByIndex = Promise.coroutine( function*( opts ) {
	var client = yield getClient();
	var results = yield client.secondaryIndexQueryAsync( opts );
	return results;
} );

var deleteObjects = Promise.coroutine( function*( keys ) {
	var client = yield getClient();

	yield Promise.each( keys, ( k ) => {
		client.deleteValueAsync( {
			bucket: bucket,
			key: k
		} );
	} );
} );

module.exports = {
	name: "secondary-indexes",
	description: "basic usage of secondary indexes",
	start: demo
};
