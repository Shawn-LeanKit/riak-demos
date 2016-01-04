# riak-demos
Demos various operations of the Riak NoSQL database

##Dependencies

* [Node.js 4+ (for ES6 generators)](https://nodejs.org/en/download/)
* [Riak] (http://docs.basho.com/riak/latest/installing/) 
  * **Recommended:** If you are on OSX use [riak-dev-cluster](https://github.com/basho-labs/riak-dev-cluster/)

##Project Setup

* Clone the repo :)
* Run ```npm install``` from the project root
* Navigate to */riak/config.js*
* in the ```nodes``` array property add an element for each node in your riak cluster (ex: \<ip_address\>:\<pbc api port\>)
  * protocol buffer api port information can be found in *\<riakInstall\>/\<riakNode\>/etc/riak.conf* under     **listener.protobuf.internal**
* Run ```node index.js``` at the project root to start the application

##Demos

Once the app is running enter in one of the commands below to run a demo to see the full list enter ```help```

**Note**: The demos invovling data types must have a bucket type created before hand via the [riak-admin utility](https://docs.basho.com/riak/2.0.1/dev/using/data-types/#Setting-Up-Buckets-to-Use-Riak-Data-Types). If you are using the OSX dev cluster you should just have to run the corresponding following ```RAKE``` commands and they will be created for you.

```
rake set_bucket
rake counter_bucket
rake map_bucket
```


| demo | description | notes |
|------|-------------|-------|
| counter-data-type  | basic usage of the counter data type | requires a counter bucket type to be created called "counters"
| delete-and-write-to-the-same-key | shows how to delete and write to the same key
| concurrent-write-with-delete | shows how riak treats concurrent write operations where one is a delete
| read-modify-write | update existing objects using the read-modify-write pattern
| secondary-indexes | basic usage of secondary indexes
| set-data-type | basic usage of the set data type | requires a counter bucket type to be created called "sets"
| sibling-creation-no-context | shows effects of not using the read-modify-write pattern
| sibling-resolution | preforms sibling resolution using the read-modify-write pattern
