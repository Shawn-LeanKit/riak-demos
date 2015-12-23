var vorpal = require( "vorpal" )();
var getClient = require( "../riak/promisified-client" );
var Promise = require( "bluebird" );
var _ = require( "lodash" );

var bucket = "demo-sibling-resolution";
var key = "cart:123";

//TODO: refactor this demo so that there is a read function that returns the current state
//of the cart. Then we should create the two new cart states that are written concurrently to create siblings.
//Finally, show how a subsequent read will resolve the siblings
var demo = Promise.coroutine( function*() {
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
		value: [
			{
				sku: 123,
				item: "PS4",
				cost: 400
			}
		]
	};

	vorpal.log( `--------creating shopping cart ${key}--------` );
	vorpal.log( storeOpts.value );

	yield client.storeValueAsync( storeOpts );

	vorpal.log( "--------adding new items to the cart concurrently--------" );
	yield* [
		addItemsToCart( [ { sku: 456, item: "XBONE", cost: 400 } ] ),
		addItemsToCart( [ { sku: 789, item: "WII U", cost: 300 } ] )
	];

	vorpal.log( "--------adding more items to the cart--------" );
	yield addItemsToCart( [ { sku: 444,item: "60in 4K TV",cost: 1500 },
							 { sku: 888,item: "12 pk Mt. Dew",cost: 1500 } ] );

	vorpal.log( `--------getting the final state of cart ${key}--------` );
	vorpal.log( yield getCart() );

	yield client.deleteValueAsync( {
		bucket: bucket,
		key: key
	} );

	vorpal.log( "--------DEMO END--------" );
} );

var addItemsToCart = Promise.coroutine( function*( items ) {
	var client = yield getClient();
	var riakObj = yield getCart();

	var curCart = riakObj.value;
	var newCart = curCart.concat( items );
	riakObj.setValue( newCart );

	yield client.storeValueAsync( { value: riakObj } );
} );

var getCart = Promise.coroutine( function*() {
	var client = yield getClient();

	//custom conflict resolver
	//the client will call this function regardless if there is an actual conflict
	//the client will take the return value of the function to build the "values" array
	//of the read result object. Therefore, the resolver should always return a riak object!
	//**Note: Even though the client calls this function, it will not write the value back.
	var mergeCart = function( siblings ) {
		//if there weren't any siblings, return the first item
		if ( siblings.length < 2 ) {
			return siblings[0];
		};

		vorpal.log( `--------${siblings.length} siblings detected while retrieving cart! beginning resolution...--------` );

		//we need to build a new riak object that has a value of the resolved cart.
		//all siblings have bucket information and the casual context attached so we just
		//pick the first one.
		var riakObj = siblings[0];

		//siblings are riak objects, so we need to get the underlying object values
		var allCarts = _.pluck( siblings, "value" );
		vorpal.log( "--------all cart objects--------" );
		vorpal.log( allCarts );
		var allItems = _.flatten( allCarts );

		//since it's a shopping cart, the resolution strategy is to preform a
		//set union accross all of the carts. In a real world scenario we'd need a strategy
		//for dealing with items that had been deleted
		var mergedCart = _.uniq( allItems, ( val ) => {
			return val.sku;
		} );

		vorpal.log( "--------merged carts result--------" );
		vorpal.log( mergedCart );

		riakObj.setValue( mergedCart );

		vorpal.log( "--------siblings resolved to new riak object--------" );
		vorpal.log( riakObj );

		return riakObj;
	};

	var result = yield client.fetchValueAsync( {
		bucket: bucket,
		key: key,
		conflictResolver: mergeCart,
		convertToJs: true
	} );

	return result.values.shift();
} );

module.exports = {
	name: "sibling-resolution",
	description: "preforming sibling resolution using the read-modify-write pattern",
	start: demo
};
