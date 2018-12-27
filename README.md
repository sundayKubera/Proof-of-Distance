### Proof-of-Distance
give "random name" to each "node"<br/>
check distance of "miner node name" and "block hash"<br/>
choose the smallest block<br/>

### Good Things
1. no needs for high hash power. just need big node pool
2. only few nodes can work on mining(some close nodes) and other nodes have to wait(some far nodes).
	so many nodes are just listening for chain(80%-90%?)
	we can make shard for them
3. 'one person one node' policy can decentralize the chain

#### When add Shard
	|-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-| <- node pool('+' is a node)
	|-|working|---------------------------------------------------------| <- when main chain only
	|-| main  |---|shard1|----|shard2|shard3|-------|shard4|-|shard5|---| <- when add shard(faster tps, more effective)
	|rd5|-|shard1|--| main  |--|shard3|-------|   shard4&2   |------|sha| <- nodes are randomly changing per block(it can collide with each other like 4&2)

### TimeLine
1. new block "Block A" created
2. "some one" make "Request A" to became a node
3. new block "Block B" created ("Request A" is in "Block B")
4. now "some one" became a node ("node name" = hash("Block B".header + hash("Request A"))) //<-- something like this

### ToDo
1. improve chain choose algorithm(Done)
2. add distance calc to block(Done)
3. add Comment(it's too dirty)(Done)
4. rebuild whole system(it's too dirty too)(Done, is it more dirty???)
?. add multiple chain support(one chain one wallet)
?. add 'delegate miner node name' transaction and mining system(some node can delegate 'miner node name' to random node optionally(it can be cancel))
?. add policy update transaction(like 'block difficulty calculating' or 'chain choose')
?. add code update transaction
?. add vote to minging system
?. add limit to node name's lifetime(automatically reissue)
?. add police node to minging system(if node name's first char is '0' then it's police node(6.25%))
?. add google account(?) verify to be a miner(one account one miner)

### Current System
	+----------+--------------+------------+-------------+
	| Protocol | SocketServer | BlockChain | Transaction |... anything else
	+----v^----+------v^------+-----v^-----+------v------+ 
	|                     Storage & Bus                  |
	+----------------------------------------------------+