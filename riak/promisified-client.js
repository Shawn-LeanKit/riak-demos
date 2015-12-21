var Riak = require( "basho-riak-client" );
var Promise = require( "bluebird" );
var fs = require( "fs" );
var config = require( "./config" );

function getAsyncClient( nodes ) {
	var client;
	return Promise.fromCallback( ( callback ) => {
		client = new Riak.Client( config.nodes, callback );
	} ).then( ( result )=> {
		Promise.promisifyAll( client );
		return client;
	} );
};

module.exports = getAsyncClient;
